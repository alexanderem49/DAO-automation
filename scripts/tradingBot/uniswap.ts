import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, constants, ContractReceipt, ethers, Wallet } from "ethers";
import { ethers as hethers } from "hardhat";

import { abi as QuoterABI } from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'
import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { log, warning } from "./logging";
import { formatEther, formatUnits, parseEther, parseUnits } from "ethers/lib/utils";
import { dram, usdc } from "./bot";
import { executeWithTimeout } from "./tools";
import { sendTransactionWithGasPriceRetry } from "./trading";

interface Immutables {
    factory: string
    token0: string
    token1: string
    fee: number
    tickSpacing: number
    maxLiquidityPerTick: ethers.BigNumber
} // 0.009000000000000000

const poolAddress = '0x23b725a9973DF1Be7Dd691F4F72e0886f9a55540'
const poolContract = new ethers.Contract(poolAddress, IUniswapV3PoolABI, hethers.provider)

const quoterAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
const quoterContract = new ethers.Contract(quoterAddress, QuoterABI, hethers.provider)

const slippage = 1; // 0.01%

function calculateSlippage(expectedOutput: BigNumber) {
    const delta = expectedOutput.mul(slippage).div(10000);
    const result = expectedOutput.sub(delta);

    log("Slippage calculation: if expected output is " + formatEther(expectedOutput) + " and slippage is "
        + slippage / 100 + "% (" + formatEther(delta) + ") minimum output is " + formatEther(result));
    return result;
}

async function getPoolImmutables() {
    const [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] = await Promise.all([
        poolContract.factory(),
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.tickSpacing(),
        poolContract.maxLiquidityPerTick(),
    ])

    const immutables: Immutables = {
        factory,
        token0,
        token1,
        fee,
        tickSpacing,
        maxLiquidityPerTick,
    }
    return immutables
}

export async function getAlluoForExactEth(amountIn: BigNumber): Promise<BigNumber> {
    if (amountIn.eq(BigNumber.from(0))) {
        return BigNumber.from(0);
    }

    const immutables = await getPoolImmutables();

    const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
        immutables.token1,
        immutables.token0,
        immutables.fee,
        amountIn,
        0
    );

    log("UniswapV3 query: " + formatUnits(amountIn, 6) + " USDC is " + formatEther(quotedAmountOut) + " DRAM");

    return quotedAmountOut;
}

export async function getEthForExactAlluo(amountIn: BigNumber): Promise<BigNumber> {
    if (amountIn.eq(BigNumber.from(0))) {
        return BigNumber.from(0);
    }

    const immutables = await getPoolImmutables();

    const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
        immutables.token0,
        immutables.token1,
        immutables.fee,
        amountIn,
        0
    );

    log("UniswapV3 query: " + formatEther(amountIn) + " DRAM is " + formatUnits(quotedAmountOut, 6) + " USDC");

    return quotedAmountOut;
}

export async function executeTrade(
    signer: Wallet,
    isAlluoBuyOrder: boolean,
    orderAmount: BigNumber
): Promise<BigNumber> {
    if (orderAmount.eq(BigNumber.from(0))) {
        warning("executeTrade was asked to trade 0 tokens!!!");
        return BigNumber.from(0);
    }

    const immutables = await getPoolImmutables();
    const router = await hethers.getContractAt("IUniswapV3Router", "0xE592427A0AEce92De3Edee1F18E0157C05861564");

    if (!isAlluoBuyOrder) {
        log("Selling DRAM, checking allowance to UniswapV3 router");
        const approvalAmount = await dram.callStatic.allowance(signer.address, router.address);
        log("    DRAM query: " + signer.address + " approved " + formatEther(approvalAmount) + " DRAM to UniswapV3 Router (0xE592427A0AEce92De3Edee1F18E0157C05861564)");
        if (approvalAmount.lt(orderAmount)) {
            log("    Allowance is NOT enough, submitting approve tx")
            const calldata = dram.interface.encodeFunctionData("approve", [router.address, constants.MaxUint256]);
            const transaction = {
                to: dram.address,
                data: calldata,
            };

            await sendTransactionWithGasPriceRetry(signer, transaction, "DRAM approve");
        } else {
            log("    DRAM allowance is enough")
        }

        const usdcBalanceBefore = await usdc.balanceOf(signer.address);
        const amountOutMinimum = calculateSlippage(await getEthForExactAlluo(orderAmount));

        const params = {
            tokenIn: dram.address,
            tokenOut: immutables.token1,
            fee: immutables.fee,
            recipient: signer.address,
            deadline: constants.MaxUint256,
            amountIn: orderAmount,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: 0
        }

        const calldata = router.interface.encodeFunctionData("exactInputSingle", [params]);
        const transaction = {
            to: router.address,
            data: calldata,
        };

        await sendTransactionWithGasPriceRetry(signer, transaction, "DRAM sell");

        const usdcBalanceAfter = await usdc.balanceOf(signer.address);
        const purchasedAmount = usdcBalanceAfter.sub(usdcBalanceBefore);

        log("    Address " + signer.address + " sold DRAM for " + formatUnits(purchasedAmount, 6) + " USDC");

        return purchasedAmount;
    }

    log("Buying DRAM, checking allowance to UniswapV3 router");
    const approvalAmount = await usdc.callStatic.allowance(signer.address, router.address);
    log("    USDC query: " + signer.address + " approved " + formatUnits(approvalAmount, 6) + " USDC to UniswapV3 Router (0xE592427A0AEce92De3Edee1F18E0157C05861564)");
    if (approvalAmount.lt(orderAmount)) {
        if (approvalAmount.lt(orderAmount)) {
            log("    Allowance is NOT enough, submitting approve tx")
            const calldata = usdc.interface.encodeFunctionData("approve", [router.address, constants.MaxUint256]);
            const transaction = {
                to: usdc.address,
                data: calldata,
            };

            await sendTransactionWithGasPriceRetry(signer, transaction, "USDC approve");
        } else {
            log("    USDC allowance is enough")
        }
    } else {
        log("    USDC allowance is enough")
    }

    const dramAmountBefore = await dram.callStatic.balanceOf(signer.address);
    const params = {
        tokenIn: immutables.token1,
        tokenOut: dram.address,
        fee: immutables.fee,
        recipient: signer.address,
        deadline: constants.MaxUint256,
        amountIn: orderAmount,
        amountOutMinimum: calculateSlippage(await getAlluoForExactEth(orderAmount)),
        sqrtPriceLimitX96: 0
    };

    const calldata = router.interface.encodeFunctionData("exactInputSingle", [params]);
    const transaction = {
        to: router.address,
        data: calldata,
    };

    await sendTransactionWithGasPriceRetry(signer, transaction, "DRAM buy");

    const dramAmountAfter = await dram.callStatic.balanceOf(signer.address);
    const purchasedAmount = dramAmountAfter.sub(dramAmountBefore);

    log("    Address " + signer.address + " bought " + formatEther(purchasedAmount) + " DRAM for " + formatUnits(orderAmount, 6) + " USDC");

    return purchasedAmount;
}