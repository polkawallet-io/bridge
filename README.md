# bridge

Polkadot bridge js SDK for multi-chain cross-chain token transfer.

You can integrate the amazing multi-chain bridge into your DApp with this SDK.

And you're welcome to add your parachain-adapter into the SDK.

## Usage

Example: [src/bridge.spec.ts](src/bridge.spec.ts)

#### 1. initiate the bridge SDK

```typescript
/// import any parachain-adapters you want in your bridge.
const availableAdapters: Record<string, BaseCrossChainAdapter> = {
  polkadot: new PolkadotAdapter(),
  // kusama: new KusamaAdapter(),
  acala: new AcalaAdapter(),
  // karura: new KaruraAdapter(),
  // statemine: new StatemineAdapter(),
  // bifrost: new BifrostAdapter(),
  // ...
};

/// create your bridge instance and pass the adapters to it.
const bridge = new Bridge({
  adapters: Object.values(availableAdapters),
});
```

Then you can get the bridge routers:
```typescript
const allRouters = bridge.router.getRouters();
/// or the available routers (some may temporarily unavailable)
const availableRouters = bridge.router.getAvailableRouters();

/// and get filtered routers
const destChains = bridge.router.getDestiantionsChains({from: 'acala'});
const tokens = bridge.router.getAvailableTokens({from: 'acala', to: 'polkadot'});
```

#### 2. network connection

You can use the `ApiProvider` of the SDK which can connect to all the parachains [https://polkadot.js.org/apps](https://polkadot.js.org/apps) supported,
or you can use your own apiProvider.

```typescript
import { ApiProvider } from './api-provider';

const provider = new ApiProvider();
```
Connect network and pass the `ApiPromise | ApiRx` into the adapters.
```typescript
// list all available from-chains
const chains = Object.keys(availableAdapters) as ChainName[];

// connect all adapters
const connected = await firstValueFrom(provider.connectFromChain(chains, undefined));

// and set `ApiPromise | ApiRx` for each adapter
await Promise.all(chains.map((chain) => availableAdapters[chain].setApi(provider.getApi(chain))));
```

#### 3. token balance query & token transfer

```typescript
/// balance query
const balance = await firstValueFrom(adapter.subscribeTokenBalance(token, testAccount));

/// and you may want to use the inputConfig provided by the SDK
/// to limit user's transfer amount input
const inputConfig = await firstValueFrom(adapter.subscribeInputConfigs({ to: toChain, token, address: toAddress, signer }));
console.log(inputConfig.minInput, inputConfig.maxInput, inputConfig.destFee, inputConfig.estimateFee, inputConfig.ss58Prefix)

/// create tx & send
const tx = adapter.createTx({
  amount: FixedPointNumber.fromInner('10000000000', 10),
  to: 'polkadot',
  token: 'DOT',
  address: toAddress,
  signer: testAccount
});
tx.signAndSend(keyPair, { tip: '0' }, onStatusChangecCallback);
```

## How to integrate your parachain into the bridge sdk

### For Substrate parachains

#### 1. Add parachain config

Add a new item in `src/configs/chains/polkadot-chains.ts` or `src/configs/chains/kusama-chains.ts`.
```typescript
/// karura for example
{
  karura: {
    id: 'karura',
    display: 'Karura',
    icon: 'https://resources.acala.network/networks/karura.png',
    paraChainId: 2000,
    ss58Prefix: 8
  }
  /// ...other parachains
}
```

#### 2. Add tokens config

Add a new tokens config file in `src/configs/tokens/`.
```typescript
/// acala for example
/// add `src/configs/tokens/acala-tokens.ts` file
export const acalaTokensConfig: Record<string, MultiChainToken> = {
  /// ACA has different `existentialDeposit` on different chains,
  /// so it has a `Record<ChainName, BN>` value for it's `ed` key.
  /// And some Tokens may have different `decimals` on different chains.
  ACA: { name: 'ACA',
    symbol: 'ACA',
    decimals: 12,
    ed: {
      acala: new BN('100000000000'),
      moonbeam: new BN('100000000000'),
      parallel: new BN('100000000000')
    } },
  /// ...other tokens
};
```

And import the token config file into `src/configs/tokens/index.ts`.

#### 3. Add routers config

Add a new router config file in `src/configs/routers/`.
```typescript
/// bifrost for example
/// add `src/configs/routers/bifrost-routers.ts` file
export const bifrostRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  bifrost: [
    /// router for token `BNC` from `bifrost` to `karura`,
    /// `xcm.fee` defines the XCM-Fee on karura,
    /// `xcm.weightLimit` defines the weightLimit value used creating Extrinsic.
    { to: 'karura', token: 'BNC', xcm: { fee: { token: 'BNC', balance: FN.fromInner('932400000', 12) }, weightLimit: 'Unlimited' } },
    /// router for token `KUSD` from `bifrost` to `karura`
    { to: 'karura', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('3826597686', 12) }, weightLimit: 'Unlimited' } }
  ]
};
```

And import the config file into `src/configs/routers/index.ts`.

#### 4. Create adapter for your parachain

Add a new adapter file in `src/adapters/`, and create your `ParachainAdapter` class extends `BaseCrossChainAdapter`.

Example: [src/adapters/bifrost.ts](./src/adapters/bifrost.ts)

##### 4.1 implement public method `subscribeTokenBalance()`

Implement the `subscribeTokenBalance` method so the bridge can query token balances.

```typescript
/// 1. create `BifrostBalanceAdapter` extends `BalanceAdapter`.
class BifrostBalanceAdapter extends BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;

  constructor ({ api, chain }: BalanceAdapterConfigs) {
    super({ api, chain });
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
    assets: (tokenId: string, address: string) =>
      Storage.create<any>({
        api,
        path: 'query.assets.account',
        params: [tokenId, address]
      })
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

##### 4.2 implement public method `subscribeMaxInput()`

Implement the `subscribeMaxInput` method so the bridge can set transferable token amount limit.

```typescript
/// maxInput = availableBalance - estimatedFee - existentialDeposit
class BaseBifrostAdapter extends BaseCrossChainAdapter {
  public subscribeMaxInput (token: string, address: string, to: ChainName): Observable<FN> {
    return combineLatest({
      txFee:
        token === this.balanceAdapter?.nativeToken
          ? this.estimateTxFee()
          : '0',
      balance: this.balanceAdapter.subscribeBalance(token, address).pipe(map((i) => i.available)),
      ed: this.balanceAdapter?.getTokenED(token)
    }).pipe(
      map(({ balance, ed, txFee }) => {
        const feeFactor = 1.2;
        const fee = FN.fromInner(txFee, this.balanceAdapter?.getTokenDecimals(token)).mul(new FN(feeFactor));
        return balance.minus(fee).minus(ed || FN.ZERO);
      })
    );
  }
}
```

##### 4.3 implement public method `createTx()`

Implement the `createTx` method so the bridge can create the cross-chain transfer Extrinsic.

```typescript
/// maxInput = availableBalance - estimatedFee - existentialDeposit
class BaseBifrostAdapter extends BaseCrossChainAdapter {
  public createTx (params: CrossChainTransferParams): SubmittableExtrinsic<'promise', ISubmittableResult> | SubmittableExtrinsic<'rxjs', ISubmittableResult> {
    const { address, amount, to, token } = params;
    const toChain = chains[to];

    const accountId = this.api?.createType('AccountId32', address).toHex();

    const tokenId = SUPPORTED_TOKENS[token];
    if (!tokenId) {
      throw new CurrencyNotFound(token);
    }

    return this.api.tx.xTokens.transfer(
      tokenId,
      amount.toChainData(),
      {
        V1: {
          parents: 1,
          interior: { X2: [{ Parachain: toChain.paraChainId }, { AccountId32: { id: accountId, network: 'Any' } }] }
        }
      },
      this.getDestWeight(token, to)?.toString());
  }
}
```

##### 4.4 pass your routers config to your adapter

```typescript
/// `chains.bifrost` is the config you added in step 1.
/// `routersConfig.bifrost` is the config you defined in step 3.
export class BifrostAdapter extends BaseBifrostAdapter {
  constructor () {
    super(chains.bifrost, routersConfig.bifrost);
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