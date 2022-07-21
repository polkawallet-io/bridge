export class TokenConfigNotFound extends Error {
  constructor (token: string, network: string) {
    super();

    this.message = `can't find ${token} config in ${network} network`;
    this.name = 'TokenConfigNotFound';
  }
}

export class CurrencyNotFound extends Error {
  constructor (name: string) {
    super();

    this.message = `can't find ${name} currency in current network`;
    this.name = 'CurrencyNotFound';
  }
}

export class NoCrossChainAdapterFound extends Error {
  constructor (name: string) {
    super();

    this.message = `Can't find ${name} adapter, please registed it first before use.`;
    this.name = 'NoCrossChainAdapterFound';
  }
}
