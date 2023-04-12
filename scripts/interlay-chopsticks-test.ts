/* eslint @typescript-eslint/no-var-requires: "off" */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* tslint:disable:no-unused-variable */
import { PolkadotAdapter } from "../src/adapters/polkadot";
import { InterlayAdapter } from "../src/adapters/interlay";
import { StatemintAdapter } from "../src/adapters/statemint";
import { BaseCrossChainAdapter } from "../src/base-chain-adapter";
import { ChainName } from "../src/configs";
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
        interlay:   { adapter: new InterlayAdapter(),   endpoints: ['ws://127.0.0.1:8000'] },
        statemint:  { adapter: new StatemintAdapter(),  endpoints: ['ws://127.0.0.1:8001'] },
        polkadot:   { adapter: new PolkadotAdapter(),   endpoints: ['ws://127.0.0.1:8002'] },
    };

    const testCases = [
        ["polkadot", "DOT"],
        ["statemint", "USDT"],
    ].flatMap(([targetChain, token]) => [
        {from: "interlay" as ChainName, to: targetChain as ChainName, token}, 
        {from: targetChain as ChainName, to: "interlay" as ChainName, token}
    ]); // bidirectional testing

    await runTestCasesAndExit(adaptersEndpoints, testCases);
}