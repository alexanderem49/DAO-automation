import { Context, Telegraf } from 'telegraf';
import { Update } from 'typegram';

import { ethers } from 'hardhat';
import { BigNumber, Contract } from 'ethers';
import { formatEther, formatUnits } from 'ethers/lib/utils';
import { IERC20Metadata } from '../../typechain';

const bot: Telegraf<Context<Update>> = new Telegraf(process.env.TELEGRAM_BOT_API as string);

const uniswapRouter = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

let alluo: IERC20Metadata;
ethers.getContractAt("IERC20Metadata", "0x12C20bcEe31bD34064cAa6eC0FD5c4c2Fce179C7").then((x) => {
    alluo = x
});

const knownAddress = [
    // Automation mnemonic addresses
    '0xdAFB3Bc95D7D81f8C1C435fdFf46d5dAC704F84D',
    '0x389F1A90Ca136f2f8c789cf096B41DEF0c1D7565',
    '0xA01fa051B4554ABd2A85732565EfdD87458bd8e9',
    '0xEf895a5a89385fC3b89ACe32367b98E673028927',
    '0xBEaF447a66eEb725c077411A309a6960f77f4001',
    '0xa872C37de8c33b645CdB7321cdf34a26A696c7d5',
    '0x94Bf7B3d2Ef7A5941c2e01720BfDEc06A347Ecbd',
    '0x062ceCE4cF9630f0105504aFc41F70f424161189',
    '0x2A0302556f3Fd76fA14E88a0F55aBcDDffC12c9B',
    '0x4CE4071AFD1bBe4Ca58034a026a7A14d80b0b390',
    '0x3dd0d1E8A4d630b924f54958fF5B920294B84cd3',
    '0xE9abAfE732024D2383C21F16141FCac45Bd30B86',
    '0x5665fE25058A37c49f6618B63C674955172bF7cB',
    '0xa772F2701CD6EdaE8d575b13E4b8Fdd1730f5aD0',
    '0x16f63eF8f3b5A39f09FeEff6db989C39eCf52B7b',
    '0x0e972db1049E8F73d7E5FeD2F1BEC06d315b04B6',
    '0x3859524C6Ad6871763F6C72010fFd68ecdDD080b',
    '0xfd90829FED50843eC2a470A2B0f8a9ddF6763515',
    '0x5A9183BaDFfe5373B01Da25eb73f6319349b726A',
    '0xbc42Ea58B2167E1AE2045f26e491D880a537E9c8'
]

type SwapEvent = {
    sender: string,
    recipient: string,
    amount0: BigNumber,
    amount1: BigNumber,
    sqrtPriceX96: BigNumber,
    liquidity: BigNumber,
    tick: number
}

const abi = [
    "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)"
];

bot.start((ctx) => {
    ctx.reply('it has been a long... long time...');
    console.log(`User ${ctx.message.from.first_name} ${ctx.message.from.last_name} (@${ctx.message.from.username}) sent /start command`);
});

bot.command("listenblocks", (ctx) => {
    console.log(`User ${ctx.message.from.first_name} ${ctx.message.from.last_name} (@${ctx.message.from.username}) sent /listenblocks command`);

    ctx.reply('Listening for new blocks');

    ethers.provider.on("block", (block) => {
        ctx.reply(
            `Current block is ${block}`
        )
    })
})

bot.command("listentesttrades", (ctx) => {
    console.log(`User ${ctx.message.from.first_name} ${ctx.message.from.last_name} (@${ctx.message.from.username}) sent /listentesttrades command`);

    ctx.reply('Listening USDC-WETH trades (NOT ALLUO)');
    const address = "0x350bbc7cf0a51d5d81a417479eb3d1846f9104ac"

    const filter = {
        address: address,
        topics: [
            ethers.utils.id("Swap(address,address,int256,int256,uint160,uint128,int24)")
        ]
    };

    ethers.provider.on(filter, (log) => {

        const contract = new Contract(address, abi, ethers.provider);
        const event: SwapEvent = contract.interface.decodeEventLog("Swap", log.data, log.topics) as unknown as SwapEvent;

        ctx.reply(
            `
UniswapV3 exchange USDC-WETH:

Pool balance diff:
USDC: ${formatUnits(event.amount0.toString(), 6)}
WETH: ${formatUnits(event.amount1.toString(), 18)}

Recepient: ${event.recipient} ${knownAddress.includes(event.recipient) ? "(known address)" : (event.recipient == uniswapRouter ? "UniswapV3 router" : "UNKNOWN ADDRESS")}
Sender: ${event.sender} ${knownAddress.includes(event.sender) ? "(known address)" : (event.sender == uniswapRouter ? "UniswapV3 router" : "UNKNOWN ADDRESS")}

Tx: https://etherscan.io/tx/${log.transactionHash}
`
        )
    })
})

bot.command("listentransactiontest", (ctx) => {
    console.log(`User ${ctx.message.from.first_name} ${ctx.message.from.last_name} (@${ctx.message.from.username}) sent /listetesttransaction command`);

    ctx.reply('Listening for transactions from Binance 16 (0xDFd5293D8e347dFe59E90eFd55b2956a1343963d)');

    ethers.provider.on("block", (block) => {
        const address = "0xDFd5293D8e347dFe59E90eFd55b2956a1343963d";
        ethers.provider.getBlockWithTransactions(block).then((block) => {
            for (const tx of block.transactions) {
                if (tx.from == address) {
                    ctx.reply(
                        `Address ${address} executed transaction!
                        
Tx: https://etherscan.io/tx/${tx.hash}`
                    );
                }
            }
            console.log("Processed block " + block.number + " with " + block.transactions.length + " transactions");
        }).catch(err => console.log(err));
    });
})

bot.command("listenhackertransaction", (ctx) => {
    console.log(`User ${ctx.message.from.first_name} ${ctx.message.from.last_name} (@${ctx.message.from.username}) sent /listetesttransaction command`);

    ctx.reply('Listening for transactions from hacker address (0xDCe5d6b41C32f578f875EfFfc0d422C57A75d7D8)');

    ethers.provider.on("block", (block) => {
        const address = "0xDCe5d6b41C32f578f875EfFfc0d422C57A75d7D8";
        ethers.provider.getBlockWithTransactions(block).then((block) => {
            for (const tx of block.transactions) {
                if (tx.from == address) {
                    ctx.reply(
                        `Address ${address} executed transaction!
                        
Tx: https://etherscan.io/tx/${tx.hash}`
                    );
                }
            }
            console.log("Processed block " + block.number + " with " + block.transactions.length + " transactions");
        }).catch(err => console.log(err));
    });
})

bot.command("listendramtrades", (ctx) => {
    console.log(`User ${ctx.message.from.first_name} ${ctx.message.from.last_name} (@${ctx.message.from.username}) sent /listenalluotrades command`);

    ctx.reply('Listening DRAM-USDC trades');
    const address = "0x350Bbc7cf0A51D5d81A417479eb3D1846F9104aC"

    const filter = {
        address: address,
        topics: [
            ethers.utils.id("Swap(address,address,int256,int256,uint160,uint128,int24)")
        ]
    };

    ethers.provider.on(filter, (log) => {

        const contract = new Contract(address, abi, ethers.provider);
        const event: SwapEvent = contract.interface.decodeEventLog("Swap", log.data, log.topics) as unknown as SwapEvent;

        ctx.reply(
            `
UniswapV3 exchange DRAM-USDC:

Pool balance diff:
DRAM: ${formatUnits(event.amount0.toString(), 18)}
USDC: ${formatUnits(event.amount1.toString(), 6)}

Recepient: ${event.recipient} ${knownAddress.includes(event.recipient) ? "(known address)" : (event.recipient == uniswapRouter ? "UniswapV3 router" : "UNKNOWN ADDRESS")}
Sender: ${event.sender} ${knownAddress.includes(event.sender) ? "(known address)" : (event.sender == uniswapRouter ? "UniswapV3 router" : "UNKNOWN ADDRESS")}

Tx: https://polygonscan.com/tx/${log.transactionHash}
`
        )
    })
})

bot.command("getbalances", async (ctx) => {
    console.log(`User ${ctx.message.from.first_name} ${ctx.message.from.last_name} (@${ctx.message.from.username}) sent /getbalances command`);

    let balances = "Trading bot accounts balances:\n\n";
    let alluoTotal = BigNumber.from(0);
    let ethTotal = BigNumber.from(0);
    for (let i = 0; i < knownAddress.length; i++) {
        const element = knownAddress[i];
        const alluoBalance = await alluo.balanceOf(element);
        const ethBalance = await ethers.provider.getBalance(element);

        balances += `Index ${i} - ${element}:
ETH: ${formatEther(ethBalance)}
ALLUO: ${formatEther(alluoBalance)}
https://etherscan.io/address/${element}

`
        ethTotal = ethTotal.add(ethBalance);
        alluoTotal = alluoTotal.add(alluoBalance);
    }

    balances += `

Total ETH - ${formatEther(ethTotal)}
Total ALLUO - ${formatEther(alluoTotal)}`;

    ctx.reply(balances);
});

bot.command("stoplisteners", (ctx) => {
    console.log(`User ${ctx.message.from.first_name} ${ctx.message.from.last_name} (@${ctx.message.from.username}) sent /stoplisteners command`);

    ctx.reply('Stopped all listeners');

    ethers.provider.removeAllListeners();
})

bot.command("logs", (ctx) => {
    console.log(`User ${ctx.message.from.first_name} ${ctx.message.from.last_name} (@${ctx.message.from.username}) sent /logs command`);

    const filePath = "nohup.out";
    const filePathBot = "bot.out";

    ctx.replyWithDocument(
        {
            source: filePath,
            filename: `${new Date().toUTCString()}_logs.log`
        }
    );

    ctx.replyWithDocument(
        {
            source: filePathBot,
            filename: `${new Date().toUTCString()}_bot_logs.log`
        }
    );
});

bot.catch((err, ctx) => {
    console.log(err);
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
