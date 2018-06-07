
// This is a minimal json plugin. The existing plugins drop back to eval if
// JSON.parse is not available, which is a security hole. I'd rather have the
// plugin fail than open a hole. They also contain dubious "features".
define("json", ["text"], function factory(text) {
  "use strict";

  return {
    load: function load(name, req, onLoad, config) {
      // We do not yet do anything special for builds. That is, if the plugin is
      // used in a build, we do not inline anything but let the whole thing be
      // loaded dynamically at run time. Eventually, we may want to optimize
      // this but we may move on from RequireJS before then.
      if (config && config.isBuild) {
        onLoad();
        return;
      }


      text.get(req.toUrl(name),
               function loaded(jsonText) {
                 onLoad(JSON.parse(jsonText));
               },
               onLoad.error);
    },
  };
});
