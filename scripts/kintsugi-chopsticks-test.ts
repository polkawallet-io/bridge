/* eslint @typescript-eslint/no-var-requires: "off" */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* tslint:disable:no-unused-variable */
import { BaseCrossChainAdapter } from "../src/base-chain-adapter";
import { ChainName } from "../src/configs";
import { KintsugiAdapter } from "../src/adapters/interlay";
import { BifrostAdapter } from "../src/adapters/bifrost";
import { KusamaAdapter } from "../src/adapters/polkadot";
import { StatemineAdapter } from "../src/adapters/statemint";
import { KaruraAdapter } from "../src/adapters/acala";
import { HeikoAdapter } from "../src/adapters/parallel";
import { runTestCasesAndExit } from "./chopsticks-test";

main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
    process.exit(-1);
});

async function main(): Promise<void> {
    const adaptersEndpoints : Record<string, { adapter: BaseCrossChainAdapter, endpoints: Array<string> }> = {
        // make sure endpoints are aligned with the ports spun up by chopsticks config in
        // .github/workflows/xcm-tests.yml
        // reminder: parachains get ports in oder of arguments, starting with 8000 and incremented for each following one; 
        //           relaychain gets its port last after all parachains.
        kintsugi:   { adapter: new KintsugiAdapter(),   endpoints: ['ws://127.0.0.1:8000'] },
        statemine:  { adapter: new StatemineAdapter(),  endpoints: ['ws://127.0.0.1:8001'] },
        karura:     { adapter: new KaruraAdapter(),     endpoints: ['ws://127.0.0.1:8002'] },
        heiko:      { adapter: new HeikoAdapter(),      endpoints: ['ws://127.0.0.1:8003'] },
        bifrost:    { adapter: new BifrostAdapter(),    endpoints: ['ws://127.0.0.1:8004'] },
        kusama:     { adapter: new KusamaAdapter(),     endpoints: ['ws://127.0.0.1:8005'] },
    };

    const testCases = [
        ["bifrost", "VKSM"],
        ["kusama", "KSM"], 
        ["karura", "KBTC"],
        ["karura", "KINT"],
        ["karura", "LKSM"],
        ["statemine", "USDT"],
        ["heiko", "KINT"],
        ["heiko", "KBTC"],
    ].flatMap(([targetChain, token]) => [
        {from: "kintsugi" as ChainName, to: targetChain as ChainName, token}, 
        {from: targetChain as ChainName, to: "kintsugi" as ChainName, token}
    ]); // bidirectional testing

    await runTestCasesAndExit(adaptersEndpoints, testCases);
}