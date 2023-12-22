import { Context, Telegraf } from 'telegraf';
import { Update } from 'typegram';

import { ethers } from 'hardhat';
import { BigNumber, Contract } from 'ethers';
import { formatEther, formatUnits } from 'ethers/lib/utils';
import { IERC20Metadata } from '../../typechain';
import { Agent } from "node:https";

const bot: Telegraf<Context<Update>> = new Telegraf(process.env.TELEGRAM_BOT_API as string,
    {
        telegram: {
            agent: new Agent({ keepAlive: false }),
        },
    }
);

const uniswapRouter = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

let alluo: IERC20Metadata;
ethers.getContractAt("IERC20Metadata", "0x12C20bcEe31bD34064cAa6eC0FD5c4c2Fce179C7").then((x) => {
    alluo = x
});

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

bot.command("listendramtrades", (ctx) => {
    console.log(`User ${ctx.message.from.first_name} ${ctx.message.from.last_name} (@${ctx.message.from.username}) sent /listendramtrades command`);

    ctx.reply('Listening DRAM-USDC and DRAM-USDT trades');
    const addressUsdc = "0x350Bbc7cf0A51D5d81A417479eb3D1846F9104aC";
    const addressUsdt = "0xf7d22e1f88495c2910A03F1C7746ac190e8315b6";

    const filterUsdc = {
        address: addressUsdc,
        topics: [
            ethers.utils.id("Swap(address,address,int256,int256,uint160,uint128,int24)")
        ]
    };

    const filterUsdt = {
        address: addressUsdt,
        topics: [
            ethers.utils.id("Swap(address,address,int256,int256,uint160,uint128,int24)")
        ]
    };

    ethers.provider.on(filterUsdc, (log) => {

        const contract = new Contract(addressUsdc, abi, ethers.provider);
        const event: SwapEvent = contract.interface.decodeEventLog("Swap", log.data, log.topics) as unknown as SwapEvent;

        ctx.reply(
            `
UniswapV3 exchange DRAM-USDC:

Pool balance diff:
DRAM: ${formatUnits(event.amount0.toString(), 18)}
USDC: ${formatUnits(event.amount1.toString(), 6)}

Recepient: ${event.recipient}
Sender: ${event.sender}

Tx: https://polygonscan.com/tx/${log.transactionHash}
`
        )
    })

    ethers.provider.on(filterUsdt, (log) => {

        const contract = new Contract(addressUsdt, abi, ethers.provider);
        const event: SwapEvent = contract.interface.decodeEventLog("Swap", log.data, log.topics) as unknown as SwapEvent;

        ctx.reply(
            `
UniswapV3 exchange DRAM-USDT:

Pool balance diff:
DRAM: ${formatUnits(event.amount0.toString(), 18)}
USDT: ${formatUnits(event.amount1.toString(), 6)}

Recepient: ${event.recipient}
Sender: ${event.sender}

Tx: https://polygonscan.com/tx/${log.transactionHash}
`
        )
    })

})

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
