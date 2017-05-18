define({
  config: {
    schema: "/build/schemas/tei-simplified-rng.js",
    mode: {
      path: "wed/modes/generic/generic",
      options: {
        meta: {
          path: "wed/modes/generic/metas/tei-meta",
          options: {
            metadata: "/build/schemas/tei-metadata.json",
          },
        },
      },
    },
    // You certainly do not want this in actual deployment.
    ajaxlog: {
      url: "/build/ajax/log.txt",
    },
    // You certainly do not want this in actual deployment.
    save: {
      path: "wed/savers/ajax",
      options: {
        url: "/build/ajax/save.txt",
      },
    },
  },
});
