export class RouterConfigNotFound extends Error {
  constructor(token: string, destChain: string, network: string) {
    super();

    this.message = `can't find ${token} to ${destChain} router in ${network} network`;
    this.name = "RouterConfigNotFound";
  }
}

export class AdapterNotFound extends Error {
  constructor(network: string) {
    super();

    this.message = `${network} adapter not find`;
    this.name = "AdapterNotFound";
  }
}

export class ApiNotFound extends Error {
  constructor(network: string) {
    super();

    this.message = `Api not set for ${network} adapter`;
    this.name = "ApiNotFound";
  }
}

export class TokenNotFound extends Error {
  constructor(token: string, network?: string) {
    super();

    if (network) {
      this.message = `can't find ${token} in ${network}`;
    } else {
      this.message = `can't find ${token} in current network`;
    }

    this.name = "TokenNotFound";
  }
}

export class NoCrossChainAdapterFound extends Error {
  constructor(name: string) {
    super();

    this.message = `Can't find ${name} adapter, please registed it first before use.`;
    this.name = "NoCrossChainAdapterFound";
  }
}

export class DestinationWeightNotFound extends Error {
  constructor(source: string, destination: string, token: string) {
    super();

    this.message = `Can't find ${source} addapter's destination weight for ${destination} destination sending ${token} token.`;
    this.name = "DestinationWeightNotFound";
  }
}
