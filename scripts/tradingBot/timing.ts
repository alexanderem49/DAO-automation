import { randomInRange } from "./tools";

export function delay(sec: number) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

export function getRandomExecutionPause(): number {
    return maxPause - lastPause;
}

// 15 minutes
const maxPause = 15 * 60;
let lastPause = 0;
export function getRandomOppositeTradePause(): number {
    const min = 0;
    const max = maxPause;

    lastPause = randomInRange(min, max);
    return lastPause;
}
