/* eslint @typescript-eslint/no-var-requires: "off" */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* tslint:disable:no-unused-variable */
import { firstValueFrom, lastValueFrom, takeWhile} from "rxjs";

import { ApiProvider } from "../src/api-provider";
import { BaseCrossChainAdapter } from "../src/base-chain-adapter";
import { ChainName } from "../src/configs";
import { Bridge } from "../src/index";
import { KintsugiAdapter } from "../src/adapters/interlay";
import { FN } from "../src/types";
import {  KusamaAdapter } from "../src/adapters/polkadot";
import { StatemineAdapter } from "../src/adapters/statemint";
import { Keyring } from "@polkadot/api";
import { BalanceChangedStatus } from "../src/types";
import { KaruraAdapter } from "../src/adapters/acala";
import { HeikoAdapter } from "../src/adapters/parallel";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";


main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
    process.exit(-1);
});

async function submitTx(tx: SubmittableExtrinsic<"rxjs", ISubmittableResult>) {
    const keyring = new Keyring({ type: "sr25519" });
    // alice
    const userKeyring = keyring.addFromUri('0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a');
    let resultingEvents = await tx.signAndSend(userKeyring);
    resultingEvents.subscribe(); // required, or else signAndSend won't do anything
}

function getRandomAddress(ss58Prefix: number) {
    let hex = "0x" + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

    const keyring = new Keyring();
    return keyring.encodeAddress(hex, ss58Prefix);
}

async function checkTransfer(fromChain: ChainName, toChain: ChainName, token: string, bridge: Bridge) {
    // use a fresh address each time to test the worst-case scenario with the ED
    const originAdapter = bridge.findAdapter(fromChain);
    const destAdapter = bridge.findAdapter(toChain);

    const destAddress = getRandomAddress(destAdapter.getSS58Prefix());
    
    let min = await firstValueFrom(originAdapter.subscribeMinInput(token, toChain));
    // don't use console.log because I don't want newline here - I want the OK/FAIL to be added on the same line
    process.stdout.write(`Transferring ${min} ${token} from ${fromChain} to ${toChain}.${destAddress}... `);

    let expectedDiff = FN.fromInner("1", min.getPrecision());

    const tx = originAdapter.createTx({
      to: toChain,
      token,
      amount: min,
      address: destAddress,
      signer: destAddress, // doesn't matter in chopsticks
    });

    let cfg = {
        token: token,
        address: destAddress,
        amount: expectedDiff,
        timeout: 15*1000, // 15 sec timeout
    };
    let changes = destAdapter.subscribeBalanceChanged(cfg);
    await submitTx(tx as SubmittableExtrinsic<"rxjs", ISubmittableResult>);
    let q = changes.pipe(takeWhile((x) => x == BalanceChangedStatus.CHECKING, true));

    let result = await lastValueFrom(q);
    let success = result == BalanceChangedStatus.SUCCESS;
    if (success) {
        console.log("OK");
    } else {
        console.log("FAIL");
    }
    return success;
}

async function main(): Promise<void> {

    const availableAdapters: Record<string, BaseCrossChainAdapter> = {
        kusama: new KusamaAdapter(),
        statemine: new StatemineAdapter(),
        kintsugi: new KintsugiAdapter(),
        karura: new KaruraAdapter(),
        heiko: new HeikoAdapter(),
    };

    const bridge = new Bridge({
        adapters: Object.values(availableAdapters),
    });
    const chains = Object.keys(availableAdapters) as ChainName[];

    const provider = new ApiProvider("mainnet"); // we overwrite endpoints, so not really mainnet
    const endpoints = {
        kusama: ['ws://127.0.0.1:8004'],
        kintsugi: ['ws://127.0.0.1:8000'],
        statemine: ['ws://127.0.0.1:8001'],
        karura: ['ws://127.0.0.1:8002'],
        heiko: ['ws://127.0.0.1:8003'],
    };

    // connect all adapters
    // const connected = 
    await lastValueFrom(
        provider.connectFromChain(chains, endpoints)
    );
    // and set apiProvider for each adapter
    await Promise.all(
        chains.map((chain) =>
            availableAdapters[chain].setApi(provider.getApi(chain))
        )
    );

    let testcases = [
        ["karura", "KBTC"],
        ["karura", "KINT"],
        ["karura", "LKSM"],
        ["kusama", "KSM"],
        ["statemine", "USDT"],
        ["heiko", "KINT"],
        ["heiko", "KBTC"],
    ].flatMap(([to, token]) => [["kintsugi", to, token], [to, "kintsugi", token]]); // bidirectional testing

    for (const [from, to, token] of testcases) {
        if (!await checkTransfer(from as ChainName, to as ChainName, token, bridge)) {
            console.log("Exiting unsuccessfully");
            process.exit(-1);
        }
    }
    
    console.log('done');
    process.exit(0);
}