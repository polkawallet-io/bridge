export class RouterConfigNotFound extends Error {
  constructor (token: string, destChain: string, network: string) {
    super();

    this.message = `can't find ${token} to ${destChain} router in ${network} network`;
    this.name = 'RouterConfigNotFound';
  }
}

export class ApiNotFound extends Error {
  constructor (network: string) {
    super();

    this.message = `Api not set for ${network} adapter`;
    this.name = 'ApiNotFound';
  }
}

export class TokenConfigNotFound extends Error {
  constructor (token: string) {
    super();

    this.message = `can't find ${token} config`;
    this.name = 'TokenConfigNotFound';
  }
}

export class TokenConfigItemNotFound extends Error {
  constructor (token: string, item: string, network: string) {
    super();

    this.message = `can't find ${token} ${item} config in ${network}`;
    this.name = 'TokenConfigItemNotFound';
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
