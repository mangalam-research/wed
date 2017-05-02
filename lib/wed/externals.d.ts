/// <reference types="jquery"/>

// Fix the incorrect declaration of jQuery.data. The documentation only mentions
// Element as the type of element but the code clearly allows Document and
// Element.
interface JQueryStatic {
  data<T>(element: Document | Element, key: string, value: T): T;
  data(element: Document | Element, key: string): any;
  data(element: Document | Element): any;
}

interface JQuery {
  on(events: string, handler: false): JQuery;
}
