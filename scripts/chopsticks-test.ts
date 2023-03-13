/* eslint @typescript-eslint/no-var-requires: "off" */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* tslint:disable:no-unused-variable */
import { firstValueFrom, lastValueFrom, takeWhile } from "rxjs";

import { ApiProvider } from "../src/api-provider";
import { BaseCrossChainAdapter } from "../src/base-chain-adapter";
import { ChainName } from "../src/configs";
import { Bridge } from "../src/index";
import { KintsugiAdapter } from "../src/adapters/interlay";
import { FN } from "../src/types";
import { KusamaAdapter } from "../src/adapters/polkadot";
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

    return new Keyring().encodeAddress(hex, ss58Prefix);
}

enum TestCase {
    "FeeEstimate",
    "ExistentialDeposit"
}
async function sendTx(fromChain: ChainName, toChain: ChainName, token: string, bridge: Bridge, sentAmount: FN, testCase: TestCase) {
    const originAdapter = bridge.findAdapter(fromChain);
    const destAdapter = bridge.findAdapter(toChain);

    // use a fresh address each time to test the worst-case scenario with the ED
    const destAddress = getRandomAddress(destAdapter.getSS58Prefix());

    let expectedDiff = FN.fromInner("1", sentAmount.getPrecision());

    const tx = originAdapter.createTx({
        to: toChain,
        token,
        amount: sentAmount,
        address: destAddress,
        signer: destAddress, // doesn't matter in chopsticks
    });

    let cfg = {
        token: token,
        address: destAddress,
        amount: expectedDiff,
        timeout: 60 * 1000, // 15 sec timeout
    };
    let changes = destAdapter.subscribeBalanceChanged(cfg);
    await submitTx(tx as SubmittableExtrinsic<"rxjs", ISubmittableResult>);
    let q = changes.pipe(takeWhile((x) => x == BalanceChangedStatus.CHECKING, true));

    let result = await lastValueFrom(q);
    let newBalance = (await firstValueFrom(destAdapter.subscribeTokenBalance(token, destAddress))).free;
    if (result != BalanceChangedStatus.SUCCESS || newBalance.isZero()) {
        let err = `Failed to transfer ${sentAmount} ${token} from ${fromChain} to ${toChain} @ ${destAddress} - likely the configured ${TestCase[testCase]} is too low`;
        throw new Error(err)
    }

    let actualFee = sentAmount.sub(newBalance);

    return actualFee;
}

enum ResultCode {
    "OK",
    "WARN",
    "FAIL"
}

function iconOf(code: ResultCode) {
    switch (code) {
        case ResultCode.OK:
            return '✅';
        case ResultCode.WARN:
            return '⚠️';
        case ResultCode.FAIL:
            return '❌';
    }
}

type IndividualTestResult = {
    message: string;
    result: ResultCode
};

async function checkTransfer(fromChain: ChainName, toChain: ChainName, token: string, bridge: Bridge): Promise<IndividualTestResult>{
    try {
        let ret = {
            message: "",
            result: ResultCode.OK,
        };

        const originAdapter = bridge.findAdapter(fromChain);
        let expectedMinAmount = await firstValueFrom(originAdapter.subscribeMinInput(token, toChain));
        let expectedEd = originAdapter.getDestED(token, toChain).balance;

        // check that the fee set in the config are set sufficiently large
        let actualFee = await sendTx(fromChain, toChain, token, bridge, expectedMinAmount.mul(new FN(10)), TestCase.FeeEstimate);
        let feeBudget = originAdapter.getCrossChainFee(token, toChain).balance;
        let feeOverestimationFactor = feeBudget.div(actualFee);
        let actualFeePlancks = actualFee._getInner();
        // console.log(`Fee budget: ${feeBudget}, actual fee: ${actualFee} (= ${actualFeePlancks} plank), marginFactor: ${feeOverestimationFactor}`);
        if (feeOverestimationFactor.toNumber() <= 2) {
            let message = `Fees need to be increased in config. The actual fees are ${actualFee} (= ${actualFeePlancks} plank). Fee overestimation factor was ${feeOverestimationFactor} - we want at least 2.0`;

            // if below 1, this is an error. 
            if (feeOverestimationFactor.toNumber() < 1) {
                return {
                    message: message,
                    result: ResultCode.FAIL
                }
            } else { 
                // not immediately failing, but dangerously close - we need to return
                // a warning, unless the code below will returns an error
                ret = {
                    message: message,
                    result: ResultCode.WARN
                };
            }
        }

        // check existential deposit by sending exactly `actualFee + ed + [1 planck]`. The function
        // will throw an error if the ed is set too low.
        let amountToSend = actualFee.add(expectedEd).add(FN.fromInner("1", actualFee.getPrecision()));
        await sendTx(fromChain, toChain, token, bridge, amountToSend, TestCase.ExistentialDeposit);
        
        return ret;
    } catch (error) {
        return {
            message: (error as any).message,
            result: ResultCode.FAIL
        };
    }
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
        ["kusama", "KSM"],
        ["karura", "KBTC"],
        ["karura", "KINT"],
        ["karura", "LKSM"],
        ["statemine", "USDT"],
        ["heiko", "KINT"],
        ["heiko", "KBTC"],
    ].flatMap(([to, token]) => [["kintsugi", to, token], [to, "kintsugi", token]]); // bidirectional testing

    let aggregateTestResult = ResultCode.OK;

    for (const [from, to, token] of testcases) {

        // don't use console.log because I don't want newline here - I want the OK/FAIL to be added on the same line
        process.stdout.write(`Testing ${token} transfer from ${from} to ${to}... `);
        let result = await checkTransfer(from as ChainName, to as ChainName, token, bridge);
        console.log(ResultCode[result.result]);
        if (result.result != ResultCode.OK) {
            console.log(iconOf(result.result), result.message);
            if (aggregateTestResult == ResultCode.OK || (aggregateTestResult == ResultCode.WARN && result.result == ResultCode.FAIL)) {
                // only 'increase' the aggregate error
                aggregateTestResult = result.result;
            }
        } 
    }

    let icon = iconOf(aggregateTestResult);
    switch (aggregateTestResult) {
        case ResultCode.OK:
            console.log(icon, 'all channels OK');
            process.exit(0);
        case ResultCode.WARN:
            console.log(icon, 'action required');
            process.exit(-1);
        case ResultCode.FAIL:
            console.log(icon, 'some channels FAILED');
            process.exit(-2);
    } 
}