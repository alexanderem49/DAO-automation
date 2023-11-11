import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Wallet, ethers } from "ethers";
import { formatEther, formatUnits, parseEther, parseUnits } from "ethers/lib/utils";
import { gasPriceThreshold, getMaxBalance, getRandomSigner, isGasPriceGood } from "./ethers";
import { decreasePrepend, increasePrepend, log, warning } from "./logging";
import { delay, getRandomOppositeTradePause } from "./timing";
import { executeWithTimeout, randomInRange } from "./tools";
import { executeTrade, getAlluoForExactEth } from "./uniswap";
import { dram, fundingAddress, getNewAddress, usdc } from "./bot";

let alluoVolume = BigNumber.from(0);
let ethVolume = BigNumber.from(0);

function getBuyInUsdcAmount(): BigNumber {
    const min = 56; // 5.6
    const max = 100000; // 10000.0

    const amount = randomInRange(min, max) / 10;

    return parseUnits(amount.toString(), 6);
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

    while (!await executeWithTimeout(async () => {
        if (await signer.getTransactionCount() > nonce) {
            return true;
        }

        const gasPrice = (await signer.provider!.getGasPrice()).add(parseUnits("10.0", 9));
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

async function fundUsdc(signer: Wallet, amount: BigNumber) {
    log(`Funding ${signer.address} with ${formatUnits(amount, 6)} USDC`);

    const calldata = usdc.interface.encodeFunctionData("transfer", [signer.address, amount]);

    const transaction = {
        to: usdc.address,
        data: calldata,
    };

    await sendTransactionWithGasPriceRetry(fundingAddress, transaction, "USDC funding");
}

async function fundMatic(signer: Wallet, amount: BigNumber) {
    log(`Funding ${signer.address} with ${formatEther(amount)} MATIC`);

    const transaction = {
        to: signer.address,
        value: amount,
    };

    await sendTransactionWithGasPriceRetry(fundingAddress, transaction, "MATIC funding");
}

async function moveDram(signerFrom: Wallet, addressTo: string) {
    const amount = await dram.balanceOf(signerFrom.address);
    log(`Moving ${formatEther(amount)} DRAM from ${signerFrom.address} to ${addressTo}`);

    const calldata = dram.interface.encodeFunctionData("transfer", [addressTo, amount]);

    const transaction = {
        to: dram.address,
        data: calldata,
    };

    await sendTransactionWithGasPriceRetry(signerFrom, transaction, "DRAM moving");
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
    // Get pair of new unused address
    // send MATIC and USDC to first address
    // buy DRAM with USDC
    // wait random time 15 min max
    // transfer DRAM and MATIC to second address
    // sell DRAM for USDC
    // clear USDC and MATIC from both addresses
    // wait 15 min minus time spent on previous pause

    const buyInAmount = getBuyInUsdcAmount();
    log(`Buying in with ${formatUnits(buyInAmount, 6)} USDC`);

    const buyInSigner = getNewAddress();
    const buyOutSigner = getNewAddress();

    await fundUsdc(buyInSigner, buyInAmount);
    await fundMatic(buyInSigner, parseEther("2.0"));

    const dramReceived = await executeTrade(buyInSigner, true, buyInAmount);

    await moveDram(buyInSigner, buyOutSigner.address);
    await fundMatic(buyOutSigner, parseEther("2.0"));

    const pause = getRandomOppositeTradePause();
    log(`Waiting ${pause} seconds before selling out`);
    await delay(pause);

    await executeTrade(buyOutSigner, false, dramReceived);

    await clearAddress(buyInSigner);
    await clearAddress(buyOutSigner);

    log("Cycle completed successfully");
}
