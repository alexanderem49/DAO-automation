import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { IERC20Metadata } from "../../typechain/IERC20Metadata";
import { decreasePrepend, error, increasePrepend, log, resetPrepend } from "./logging";
import { delay, getRandomExecutionPause } from "./timing";
import { tradingLoop as tradingCycle } from "./trading";
import { parseUnits } from "ethers/lib/utils";
import { Wallet } from "ethers";

export let signers: SignerWithAddress[];
export let dram: IERC20Metadata;
export let usdc: IERC20Metadata;
export let addressStartIndex = 1;
export let fundingAddress: Wallet;

export function getSignerFromMnemonic(index: number) {
    const path = `m/44'/60'/0'/0/${index}`;
    const mnemonic = process.env.MNEMONIC as string;
    return ethers.Wallet.fromMnemonic(mnemonic, path).connect(ethers.provider);
}

export function getNewAddress() {
    const signer = getSignerFromMnemonic(addressStartIndex);
    addressStartIndex++;
    return signer;
}

async function init() {
    signers = await ethers.getSigners();
    dram = await ethers.getContractAt("IERC20Metadata", "0x12C20bcEe31bD34064cAa6eC0FD5c4c2Fce179C7");
    usdc = await ethers.getContractAt("IERC20Metadata", "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359");

    const network = await ethers.provider.getNetwork();
    log("Connected to network with chainId: " + network.chainId);

    log("Finding first unused address...");
    while (true) {
        const signer = getSignerFromMnemonic(addressStartIndex);
        if (await signer.getTransactionCount() == 0) {
            log("Found first unused address: " + signer.address + " with index " + addressStartIndex);
            break;
        }

        log("Address " + signer.address + " with index " + addressStartIndex + " is already used, trying next one...");
        addressStartIndex++;
    }

    if (network.chainId == 31337) {
        log("Hardhat network detected, setting custom balance and getting USDC...");
        const usdcWhale = await ethers.getImpersonatedSigner("0xe7804c37c13166fF0b37F5aE0BB07A3aEbb6e245");
        const dramWhale = await ethers.getImpersonatedSigner("0x040eB4673D7929927f40D52581b22aF54E7C6cBe");

        for (let i = 0; i < signers.length; i++) {
            const signer = signers[i];

            await usdc.connect(usdcWhale).transfer(
                signers[0].address,
                parseUnits("1000", 6)
            );

            await dram.connect(dramWhale).transfer(
                signers[0].address,
                parseUnits("1000", 18)
            );

            await ethers.provider.send("hardhat_setBalance", [
                signers[0].address,
                "0x367f3bbb9448bd4000", // 3.926923076923080000 - 367f3bbb9448bd40
              ]);
        }
    }

    fundingAddress = getSignerFromMnemonic(0);
    log("Funding address: " + fundingAddress.address);

    const maticBalance = await fundingAddress.getBalance();
    log("Funding address balance: " + ethers.utils.formatEther(maticBalance) + " MATIC");

    const usdcBalance = await usdc.balanceOf(fundingAddress.address);
    log("Funding address USDC balance: " + ethers.utils.formatUnits(usdcBalance, 6) + " USDC");
}

async function main() {
    await init();

    while (true) {
        console.log();
        resetPrepend();
        log("Next cycle:");
        increasePrepend()

        try {
            await tradingCycle();
        } catch (err) {
            error("Error in trading cycle");
            console.log("\n", err, "\n");
            error("Unsuccessful cycle, restarting in 5 minutes");
            await delay(300);
            continue;
        }

        decreasePrepend();

        const interval = getRandomExecutionPause();
        log("Waiting for " + interval + " seconds before next cycle");
        await delay(interval);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});