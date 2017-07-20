
declare namespace mergeOptions {
  interface MergeOptionsConfig {
    concatArrays?: boolean;
  }

  interface MergeOptions {
    (this: mergeOptions.MergeOptionsConfig, ...args: {}[]): any;
    (...args: {}[]): any;
  }
}

declare var mergeOptions: mergeOptions.MergeOptions;

export = mergeOptions;
export as namespace mergeOptions;
