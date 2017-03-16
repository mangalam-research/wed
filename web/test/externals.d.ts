declare namespace Chai {
  // Add catch to the interface. karma-main.js performs this work.
  export interface PromisedAssertion {
    catch<TResult>(onrejected: (reason: any) => TResult | PromiseLike<TResult>): Promise<TResult>;
  }
}
