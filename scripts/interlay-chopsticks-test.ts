/* eslint @typescript-eslint/no-var-requires: "off" */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* tslint:disable:no-unused-variable */
import { PolkadotAdapter } from "../src/adapters/polkadot";
import { InterlayAdapter } from "../src/adapters/interlay";
import { StatemintAdapter } from "../src/adapters/statemint";
import { HydraAdapter } from "../src/adapters/hydradx";
import { AcalaAdapter } from "../src/adapters/acala";
import { ParallelAdapter } from "../src/adapters/parallel";
import { BifrostPolkadotAdapter } from "../src/adapters/bifrost";
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
        interlay: { adapter: new InterlayAdapter(), endpoints: ['ws://127.0.0.1:8000'] },
        statemint: { adapter: new StatemintAdapter(), endpoints: ['ws://127.0.0.1:8001'] },
        hydra: { adapter: new HydraAdapter(), endpoints: ['ws://127.0.0.1:8002'] },
        acala: { adapter: new AcalaAdapter(), endpoints: ['ws://127.0.0.1:8003'] },
        // disable astar - rpc currently is too fragile for use in recurring tests
        // astar:      { adapter: new AstarAdapter(),      endpoints: ['ws://127.0.0.1:8004'] },
        parallel: { adapter: new ParallelAdapter(), endpoints: ['ws://127.0.0.1:8004'] },
        bifrost_polkadot: { adapter: new BifrostPolkadotAdapter(), endpoints: ['ws://127.0.0.1:8005']},
        polkadot: { adapter: new PolkadotAdapter(), endpoints: ['ws://127.0.0.1:8006'] },
    };

    const filterCases: Partial<RouterTestCase>[] = [
        {from: "astar"},
        {to: "astar"},
    ];

    await runTestCasesAndExit(adaptersEndpoints, filterCases);
}