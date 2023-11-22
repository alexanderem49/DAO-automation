import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Wallet, ethers } from "ethers";
import { formatEther, formatUnits, parseEther, parseUnits } from "ethers/lib/utils";
import { gasPriceThreshold, getMaxBalance, getRandomSigner, isGasPriceGood } from "./ethers";
import { decreasePrepend, increasePrepend, log, warning, error } from "./logging";
import { delay, getRandomOppositeTradePause } from "./timing";
import { executeWithTimeout, randomInRange } from "./tools";
import { executeTrade, getAlluoForExactEth } from "./uniswap";
import { dram, fundingAddress, getNewAddress, usdc } from "./bot";
import { IERC20Metadata } from "../../typechain";

async function getBuyInAmount(token: IERC20Metadata, walletAddress: string): Promise<BigNumber> {
    const min = 56; // 5.6
    const maxRaw = await token.balanceOf(walletAddress);

    if (maxRaw.eq(BigNumber.from(0))) {
        return BigNumber.from(0);
    }

    const decimals = await token.decimals();
    const max = maxRaw.div(BigNumber.from(10).pow(decimals - 1)).toNumber();

    const amount = randomInRange(min, max) / 10;

    return parseUnits(amount.toString(), await token.decimals());
}

export async function sendTransactionWithGasPriceRetry(
    signer: Wallet,
    transaction: ethers.providers.TransactionRequest,
    txLabel = ""
) {
    increasePrepend();
    const timeout = 1000 * 60; // 1 minute
    const gasLimit = await signer.estimateGas(transaction);
    const nonce = await signer.getTransactionCount();
    log("Gas limit: " + gasLimit.toNumber());
    log("Nonce: " + nonce);

    let gasPrice = await signer.provider!.getGasPrice();

    while (!await executeWithTimeout(async () => {
        if (await signer.getTransactionCount() > nonce) {
            return true;
        }

        gasPrice = gasPrice.add(gasPrice.div(10));
        const currentGasPrice = await signer.provider!.getGasPrice();
        if (currentGasPrice.gt(gasPrice)) {
            gasPrice = currentGasPrice;
        }
        log("Gas price: " + formatUnits(gasPrice, 9));

        transaction.gasLimit = gasLimit;
        transaction.gasPrice = gasPrice;
        transaction.nonce = nonce;

        const txReceipt = await signer.sendTransaction(transaction);

        log("Broadcasted " + txLabel + " tx: " + txReceipt.hash);
        log("Waiting for " + txLabel + " tx to be confirmed...");

        await txReceipt.wait();

        log("Confirmed " + txLabel + " tx: " + txReceipt.hash);
        return true;
    }, timeout)) {
        log("Timeout in " + txLabel + " detected, sending same tx again");
    }

    decreasePrepend();
}

async function fundCoin(token: IERC20Metadata, signer: Wallet, amount: BigNumber) {
    log(`Funding ${signer.address} with ${formatUnits(amount, await token.decimals())} ${await token.symbol()}`);

    const calldata = token.interface.encodeFunctionData("transfer", [signer.address, amount]);

    const transaction = {
        to: token.address,
        data: calldata,
    };

    await sendTransactionWithGasPriceRetry(fundingAddress, transaction, `${await token.symbol()} funding`);
}

async function fundMatic(signer: Wallet, amount: BigNumber) {
    log(`Funding ${signer.address} with ${formatEther(amount)} MATIC`);

    const transaction = {
        to: signer.address,
        value: amount,
    };

    await sendTransactionWithGasPriceRetry(fundingAddress, transaction, "MATIC funding");
}

async function moveCoin(token: IERC20Metadata, signerFrom: Wallet, addressTo: string) {
    const amount = await token.balanceOf(signerFrom.address);
    log(`Moving ${formatUnits(amount, await token.decimals())} ${await token.symbol()} from ${signerFrom.address} to ${addressTo}`);

    const calldata = token.interface.encodeFunctionData("transfer", [addressTo, amount]);

    const transaction = {
        to: token.address,
        data: calldata,
    };

    await sendTransactionWithGasPriceRetry(signerFrom, transaction, `${await token.symbol()} moving`);
}

async function clearAddress(signer: Wallet) {
    const dramBalance = await dram.balanceOf(signer.address);
    const usdcBalance = await usdc.balanceOf(signer.address);
    let maticBalance = await signer.getBalance();

    log(`Clearing ${signer.address} with ${formatEther(dramBalance)} DRAM, ${formatUnits(usdcBalance, 6)} USDC and ${formatEther(maticBalance)} MATIC`);

    if (!dramBalance.eq(BigNumber.from(0))) {
        const calldata = dram.interface.encodeFunctionData("transfer", [fundingAddress.address, dramBalance]);

        const transaction = {
            to: dram.address,
            data: calldata,
        };

        await sendTransactionWithGasPriceRetry(signer, transaction, "DRAM clearing");
    }

    if (!usdcBalance.eq(BigNumber.from(0))) {
        const calldata = usdc.interface.encodeFunctionData("transfer", [fundingAddress.address, usdcBalance]);

        const transaction = {
            to: usdc.address,
            data: calldata,
        };

        await sendTransactionWithGasPriceRetry(signer, transaction, "USDC clearing");
    }

    maticBalance = await signer.getBalance();
    if (!maticBalance.eq(BigNumber.from(0))) {
        const txLabel = "MATIC clearing";

        increasePrepend();
        const timeout = 1000 * 60; // 1 minute
        const gasLimit = 21000;
        const nonce = await signer.getTransactionCount();
        log("Gas limit: " + gasLimit.toString());
        log("Nonce: " + nonce);

        while (!await executeWithTimeout(async () => {
            if (await signer.getTransactionCount() > nonce) {
                return true;
            }

            const gasPrice = (await signer.provider!.getGasPrice()).add(parseUnits("10.0", 9));
            log("Gas price: " + formatUnits(gasPrice, 9));

            let transaction: ethers.providers.TransactionRequest = {
                to: fundingAddress.address,
                value: maticBalance.sub(gasPrice.mul(gasLimit)),
            };

            transaction.gasLimit = gasLimit;
            transaction.gasPrice = gasPrice;
            transaction.nonce = nonce;
            transaction.type = 1;

            const txReceipt = await signer.sendTransaction(transaction);

            log("Broadcasted " + txLabel + " tx: " + txReceipt.hash);
            log("Waiting for " + txLabel + " tx to be confirmed...");

            await txReceipt.wait();

            log("Confirmed " + txLabel + " tx: " + txReceipt.hash);
            return true;
        }, timeout)) {
            log("Timeout in " + txLabel + " detected, sending same tx again");
        }

        decreasePrepend();
    }
}

export async function tradingLoop() {
    const stepOneSigner = getNewAddress();
    const stepTwoSigner = getNewAddress();

    try {
        // 50/50 chance of buying or selling
        let isBuy = Math.random() < 0.5;
        log(`Action: ${isBuy ? "buy" : "sell"} DRAM`);

        let buyInAmount: BigNumber;
        if (isBuy) {
            buyInAmount = await getBuyInAmount(usdc, fundingAddress.address);
            log(`Buying in with ${formatUnits(buyInAmount, 6)} USDC`);
        } else {
            buyInAmount = await getBuyInAmount(dram, fundingAddress.address);
            log(`Selling out with ${formatEther(buyInAmount)} DRAM`);
        }

        if (buyInAmount.eq(BigNumber.from(0))) {
            warning("Not enough funds to trade, reversing action");

            isBuy = !isBuy;

            if (isBuy) {
                buyInAmount = await getBuyInAmount(usdc, fundingAddress.address);
                log(`Buying in with ${formatUnits(buyInAmount, 6)} USDC`);
            } else {
                buyInAmount = await getBuyInAmount(dram, fundingAddress.address);
                log(`Selling out with ${formatEther(buyInAmount)} DRAM`);
            }
        }

        if (isBuy) {
            await fundCoin(usdc, stepOneSigner, buyInAmount);
        }
        else {
            await fundCoin(dram, stepOneSigner, buyInAmount);
        }

        await fundMatic(stepOneSigner, parseEther("2.0"));

        const dramReceived = await executeTrade(stepOneSigner, isBuy, buyInAmount);


        if (isBuy) {
            await moveCoin(dram, stepOneSigner, stepTwoSigner.address);
        } else {
            await moveCoin(usdc, stepOneSigner, stepTwoSigner.address);
        }

        await fundMatic(stepTwoSigner, parseEther("2.0"));

        const pause = getRandomOppositeTradePause();
        log(`Waiting ${pause} seconds before selling out`);
        await delay(pause);

        await executeTrade(stepTwoSigner, !isBuy, dramReceived);

        await clearAddress(stepOneSigner);
        await clearAddress(stepTwoSigner);

        log("Cycle completed successfully");
    }
    catch (e) {
        while (true) {
            try {
                await clearAddress(stepOneSigner);
                await clearAddress(stepTwoSigner);
                break;
            }
            catch (e) {
                error("Failed to clear address, retrying in 15 seconds");
                console.log("\n", e, "\n");
                await delay(15);
            }
        }

        throw e;
    }
}
