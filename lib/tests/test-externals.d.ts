import "wed/onerror";

// Declare this for our own purposes. This is not normally exported but in
// testing we want to access it, so...
declare module "wed/onerror" {
  export interface TestInterface {
    reset(): void;
  }

  // tslint:disable-next-line:variable-name
  export const __test: TestInterface;
}
