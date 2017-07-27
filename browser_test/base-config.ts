/**
 * Common configuration for tests.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Options } from "wed/options";

export const config: Options = {
  schema: "../schemas/tei-simplified-rng.js",
  mode: {
    path: "wed/modes/generic/generic",
    options: {
      metadata: "../schemas/tei-metadata.json",
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
};
