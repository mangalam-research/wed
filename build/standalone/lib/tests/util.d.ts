export declare function delay(timeout: number): Promise<void>;
export declare function waitFor(fn: () => boolean | Promise<boolean>, pollDelay?: number, timeout?: number): Promise<boolean>;
export declare function waitForSuccess(fn: () => void, pollDelay?: number, timeout?: number): Promise<void>;
export declare class DataProvider {
    private readonly base;
    private readonly cache;
    private readonly parser;
    private readonly registered;
    constructor(base: string);
    register(name: string, path: string): void;
    getNamed(name: string): Promise<string>;
    getNamedDoc(name: string): Promise<Document>;
    getText(path: string): Promise<string>;
    _getText(path: string): Promise<string>;
    getDoc(path: string): Promise<Document>;
}
export declare type ErrorClass = {
    new (...args: any[]): Error;
};
export declare function expectError(fn: Function, pattern: RegExp | string): Promise<void>;
export declare function expectError(fn: Function, errorClass: ErrorClass, pattern: RegExp | string): Promise<void>;
export declare function makeFakePasteEvent(clipboardData: any): any;
