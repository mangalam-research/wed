declare namespace Chai {
  // Add catch to the interface. karma-main.js performs this work.
  export interface PromisedAssertion {
    catch<TResult>(onrejected: (reason: any) => TResult | PromiseLike<TResult>): Promise<TResult>;
  }

  // Fix to chai to allow .to.include(null) and .to.include(undefined). Submit
  // this to DefinitelyTyped.
  export interface Include {
    (value: Object | undefined | null, message?: string): Assertion;
  }

  // Fix to chai-as-promised to allow .to.include(null) and
  // .to.include(undefined). Submit this to DefinitelyTyped.
  export interface PromisedInclude {
    (value: Object | undefined | null, message?: string): PromisedAssertion;
  }

}

declare module "bluejax" {
  export function ajax(...params: any[]): Promise<any>;
}
