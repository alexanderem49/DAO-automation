import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { IERC20Metadata } from "../../typechain/IERC20Metadata";
import { error, log, setPrepand } from "./logging";
import { delay, getRandomExecutionPause } from "./timing";
import { tradingLoop as tradingCycle } from "./trading";
import { parseUnits } from "ethers/lib/utils";

export let signers: SignerWithAddress[];
export let alluo: IERC20Metadata;
export let usdc: IERC20Metadata;

async function init() {
    signers = await ethers.getSigners();
    alluo = await ethers.getContractAt("IERC20Metadata", "0x12C20bcEe31bD34064cAa6eC0FD5c4c2Fce179C7");
    usdc = await ethers.getContractAt("IERC20Metadata", "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174");

    log("Fetched " + signers.length + " signers from mnemonic.");

    const network = await ethers.provider.getNetwork();
    log("Connected to network with chainId: " + network.chainId);

    if (network.chainId == 31337) {
        log("Hardhat network detected, setting custom balance and buying ALLUO for everyone...");
        const usdcWhale = await ethers.getImpersonatedSigner("0xe7804c37c13166fF0b37F5aE0BB07A3aEbb6e245");

        for (let i = 0; i < signers.length; i++) {
            const signer = signers[i];

            await usdc.connect(usdcWhale).transfer(
                signer.address,
                parseUnits("1000", 6)
            );

            await ethers.provider.send("hardhat_setBalance", [
                signer.address,
                "0x367f3bbb9448bd40", // 3.926923076923080000 - 367f3bbb9448bd40
              ]);
        }
    }
}

async function main() {
    await init();

    while (true) {
        console.log();
        log("Next cycle:");
        setPrepand("    ");

        try {
            await tradingCycle();
        } catch (err) {
            error("Error in trading cycle");
            console.log("\n", err, "\n");
            error("Unsuccessful cycle, restarting in 5 minutes");
            await delay(300000);
            continue;
        }

        setPrepand("");

        const interval = getRandomExecutionPause();
        log("Waiting for " + interval + " seconds before next cycle");
        await delay(interval * 1000);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});