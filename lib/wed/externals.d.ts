/// <reference types="jquery"/>

// Fix the incorrect declaration of jQuery.data. The documentation only mentions
// Element as the type of element but the code clearly allows Document and
// Element.
interface JQueryStatic {
  data<T>(element: Document | Element, key: string, value: T): T;
  data(element: Document | Element, key: string): any;
  data(element: Document | Element): any;
  (selector: Element | null | undefined): JQuery;
}

interface JQuery {
  on(events: string,
     handler: ((eventObject: JQueryEventObject, ...args: any[]) => any) | false):
  JQuery;
}

declare module "bluejax" {
  export type Pair = {
    promise: Promise<any>;
    xhr: JQueryXHR;
  };
  export type AjaxCall = (...params: any[]) => Promise<any>;
  export type AjaxCall$ = (...params: any[]) => Pair;

  export function ajax(...params: any[]): Promise<any>;
  export function make(options: any): AjaxCall$;
  export function make(options: any, field: "promise"): AjaxCall;

  export const ConnectivityError: Error;
}

type RequireJSCall = (deps: string[],
                      callback?: (...args: any[]) => void,
                      errback?: (...args: any[]) => void) => void;
declare var requirejs: RequireJSCall;
declare var require: RequireJSCall;

interface Window {
  DOMParser: {
    prototype: DOMParser;
    new(): DOMParser;
  }
}

declare var __WED_TESTING: any;

//  LocalWords:  bluejax jQuery jquery
