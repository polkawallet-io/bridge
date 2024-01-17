/* eslint @typescript-eslint/no-var-requires: "off" */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* tslint:disable:no-unused-variable */
import { KintsugiAdapter } from "../src/adapters/interlay";
import { StatemineAdapter } from "../src/adapters/statemint";
import { KusamaAdapter } from "../src/adapters/polkadot";
import { BaseCrossChainAdapter } from "../src/base-chain-adapter";
import { RouterTestCase, runTestCasesAndExit } from "./chopsticks-test";

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
        statemine: { adapter: new StatemineAdapter(), endpoints: ['ws://127.0.0.1:8001'] },
        kusama:     { adapter: new KusamaAdapter(),     endpoints: ['ws://127.0.0.1:8002'] },
    };

    // already tested in kintsugi-chopsticks-test
    const skipCases: Partial<RouterTestCase>[] = [
        {
            from: "kintsugi",
            to: "kusama",
        },
        {
            from: "kusama",
            to: "kintsugi",
        },
    ];

    await runTestCasesAndExit(adaptersEndpoints, true, skipCases);
}