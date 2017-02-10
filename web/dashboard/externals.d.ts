module "wed/mode-map" {
  const modes: {[name: string]: string};
}

module "wed/meta-map" {
  const metas: {[name: string]: string};
}

//
// As of 2017/02/16 the file provided by @types/blueimp-md5 is borked.
// Contrarily to what the test file hosted with DefinitelyTyped
// (https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/blueimp-md5/blueimp-md5-tests.ts)
// pretends, doing:
//
// import blueimp = require('blueimp-md5');
// blueimp.md5('hello world');
//
// Definitely does not work.
//
module "blueimp-md5" {
  function md5(value: string, key?: string, raw?: boolean): string;
  export = md5;
}
