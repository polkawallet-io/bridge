# Polkadot bridge SDK

Polkadot bridge SDK for multi-chain cross-chain token transfer.

You can integrate the amazing multi-chain bridge into your DApp with this SDK.

And you're welcome to add your parachain-adapter into the SDK.

## Support Bridges
[all support bridges](docs/support-bridges.md)

## Usage

Example: [src/bridge.spec.ts](src/bridge.spec.ts)

### 1. initiate the bridge SDK

```typescript
/// import any parachain-adapters you want in your bridge.
const acala = new AcalaAdapter();
const polkadot = new PolkadotAdapter();
const acalaApi = new ApiPromise({ provider: new WsProvider('xxx') });
const polkadotApi = new ApiPromise({ provider: new WsProvider('xxx') });

await acala.init(acalaApi);
await polkadot.init(polkadotApi);

/// create your bridge instance and pass the adapters to it.
const bridge = new Bridge({ adapters: [acala, polkadot] });
```

Then you can get the bridge routers:

```typescript
const allRouters = bridge.router.getRouters();
/// or the available routers, we can disable some routes by config
/// const availableRouters = bridge.router.getAvailableRouters();

/// and get filtered routers
const destChains = bridge.router.getDestinationChains({ from: "acala" });
const tokens = bridge.router.getAvailableTokens({ from: "acala", to: "polkadot" });
```

### 2. network connection

You can use the `ApiProvider` of the SDK which can connect to all the parachains [https://polkadot.js.org/apps](https://polkadot.js.org/apps) supported,
or you can use your own apiProvider.

```typescript
import { ApiProvider } from "./api-provider";

const provider = new ApiProvider();
```

Connect network and pass the `ApiPromise | ApiRx` into the adapters.

```typescript
// list all available from-chains
const chains = Object.keys(availableAdapters) as ChainId[];

// connect all adapters
const connected = await firstValueFrom(provider.connectFromChain(chains, undefined));

// and set `ApiPromise | ApiRx` for each adapter
await Promise.all(chains.map((chain) => availableAdapters[chain].init(provider.getApi(chain))));
```

> For ERC20 token of EVM, acala.js introduces an approach
> to query token balance from EVM with `@acala-network/eth-providers`.
> see: [src/adapters/acala.spec.ts](src/adapters/acala.spec.ts)

```typescript
import { EvmRpcProvider } from "@acala-network/eth-providers";
import { Wallet } from "@acala-network/sdk";

const provider = new ApiProvider();
const api = provider.getApiPromise("acala");
const evmProvider = new EvmRpcProvider("wss://acala.polkawallet.io");
const wallet = new Wallet(api, { evmProvider });

// by passing a wallet instance with [EvmRpcProvider],
// the [AcalaAdapter] can access the ERC20 token balance in EVM.
const acala = new AcalaAdapter();
await acala.init(api, wallet);
```

### 3. token balance query & token transfer

```typescript
/// balance query
const balance = await firstValueFrom(adapter.subscribeTokenBalance(token, testAccount));

/// and you may want to use the inputConfig provided by the SDK
/// to limit user's transfer amount input
const inputConfig = await firstValueFrom(adapter.subscribeInputConfigs({ to: toChain, token, address: toAddress, signer }));
console.log(inputConfig.minInput, inputConfig.maxInput, inputConfig.destFee, inputConfig.estimateFee, inputConfig.ss58Prefix);

/// create tx & send
const tx = adapter.createTx({
  amount: FixedPointNumber.fromInner("10000000000", 10),
  to: "polkadot",
  token: "DOT",
  address: toAddress
});
tx.signAndSend(keyPair, { tip: "0" }, onStatusChangecCallback);
```

## How to integrate your parachain into the bridge sdk

### For Substrate parachains

#### 1. Add parachain config

Add a new item in `src/configs/chains/polkadot-chains.ts` or `src/configs/chains/kusama-chains.ts`.

```typescript
/// karura for example
{
  karura: {
    display: "Karura",
    type: typeSubstrate,
    icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fkarura.png&w=96&q=75",
    paraChainId: 2000,
    ss58Prefix: 8,
  }
  /// ...other parachains
}
```

#### 2. Create adapter for your parachain

Add a new adapter file in `src/adapters/`, and create your `ParachainAdapter` class extends `BaseCrossChainAdapter`.

Example: [src/adapters/bifrost.ts](./src/adapters/bifrost.ts)

##### 2.1 define tokens and routers

```typescript
/// bifrost for example
export const bifrostTokensConfig: Record<string, MultiChainToken> = {
  BNC: { name: "BNC", symbol: "BNC", decimals: 12, ed: "10000000000" },
  VSKSM: { name: "VSKSM", symbol: "VSKSM", decimals: 12, ed: "100000000" },
  /// ...other tokens
};
export const bifrostRouteConfigs: Omit<RouteConfigs, "from">[] = [
  /// router for token `BNC` from `bifrost` to `karura`,
  /// `xcm.fee` defines the XCM-Fee on karura,
  /// `xcm.weightLimit` defines the weightLimit value used creating Extrinsic.
  { to: "karura", token: "BNC", xcm: { fee: { token: "BNC", amount: "932400000" }, weightLimit: "Unlimited" } },
  /// router for token `KUSD` from `bifrost` to `karura`
  { to: "karura", token: "KUSD", xcm: { fee: { token: "KUSD", amount: "3826597686" }, weightLimit: "Unlimited" } },
];
```

##### 2.2 implement public method `subscribeTokenBalance()`

Implement the `subscribeTokenBalance` method so the bridge can query token balances.

```typescript
/// 1. create `BifrostBalanceAdapter` extends `BalanceAdapter`.
class BifrostBalanceAdapter extends BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;

  constructor ({ api, chain, tokens }: BalanceAdapterConfigs) {
    super({ api, chain, tokens });
    this.storages = createBalanceStorages(api);
  }

  public subscribeBalance (token: string, address: string): Observable<BalanceData> {
    /// ...balance queries
  }
}
/// 2. we use a `createBalanceStorages` function with acala `Storage` utils
///    for token balance queries here.
function createBalanceStorages(api: AnyApi) => {
  return {
    /// balances for native-token (BNC for bifrost)
    balances: (address: string) =>
      Storage.create<any>({
        api,
        path: 'query.system.account',
        params: [address]
      }),
    /// assets for non-native-token (KUSD for bifrost)
    assets: (address: string, token: unknown) =>
      Storage.create<any>({
        api,
        path: "query.tokens.accounts",
        params: [address, token],
      }),
  };
};
/// 3. implement the `subscribeTokenBalance` method
class BaseBifrostAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: BifrostBalanceAdapter;

  public subscribeTokenBalance (token: string, address: string): Observable<BalanceData> {
    return this.balanceAdapter.subscribeBalance(token, address);
  }
}
```

##### 2.3 implement public method `subscribeMaxInput()`

Implement the `subscribeMaxInput` method so the bridge can set transferable token amount limit.

```typescript
/// maxInput = availableBalance - estimatedFee - existentialDeposit
class BaseBifrostAdapter extends BaseCrossChainAdapter {
  public subscribeMaxInput(token: string, address: string, to: ChainId): Observable<FN> {
    return combineLatest({
      txFee: token === this.balanceAdapter?.nativeToken ? this.estimateTxFee() : "0",
      balance: this.balanceAdapter.subscribeBalance(token, address).pipe(map((i) => i.available)),
    }).pipe(
      map(({ balance, txFee }) => {
        const tokenMeta = this.balanceAdapter?.getToken(token);
        const feeFactor = 1.2;
        const fee = FN.fromInner(txFee, tokenMeta?.decimals).mul(new FN(feeFactor));

        return balance.minus(fee).minus(FN.fromInner(tokenMeta?.ed || "0", tokenMeta?.decimals));
      })
    );
  }
}
```

##### 2.4 implement public method `createTx()`

Implement the `createTx` method so the bridge can create the cross-chain transfer Extrinsic.

```typescript
class BaseBifrostAdapter extends BaseCrossChainAdapter {
  public createTx(
    params: TransferParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> | SubmittableExtrinsic<"rxjs", ISubmittableResult> {
    const { address, amount, to, token } = params;
    const toChain = chains[to];

    const accountId = this.api?.createType("AccountId32", address).toHex();

    const tokenId = SUPPORTED_TOKENS[token];
    if (!tokenId) {
      throw new TokenNotFound(token);
    }

    return this.api.tx.xTokens.transfer(
      tokenId,
      amount.toChainData(),
      {
        V1: {
          parents: 1,
          interior: { X2: [{ Parachain: toChain.paraChainId }, { AccountId32: { id: accountId, network: "Any" } }] },
        },
      },
      this.getDestWeight(token, to)?.toString()
    );
  }
}
```

##### 2.5 pass your routers config to your adapter

```typescript
/// `chains.bifrost` is the config you added in step 1.
/// `bifrostRouteConfigs` & `bifrostTokensConfig` is the config you defined in step 2.1.
export class BifrostAdapter extends BaseBifrostAdapter {
  constructor() {
    super(chains.bifrost, bifrostRouteConfigs, bifrostTokensConfig);
  }
}
```

And you are all set now!

#### Additional steps

You can import your `ParachainAdapter` into [src/bridge.spec.ts](src/bridge.spec.ts) to test your adapter.

> run testing with `yarn test`.

And remember to run `yarn lint` before commit your code.

### For EVM parachains

TODO
