require.config({
    "bundles": {
        "wed/wed": [
            "wed/log",
            "wed/onerror",
            "wed/savers/localforage",
            "wed/browsers"
        ]
    }
});
define("wed/config", {
    "config": {
        "schema": "../../../schemas/tei-simplified-rng.js",
        "mode": {
            "path": "wed/modes/generic/generic",
            "options": {
                "meta": {
                    "path": "wed/modes/generic/metas/tei_meta",
                    "options": {
                        "metadata": "../../../../../schemas/tei-metadata.json"
                    }
                }
            }
        }
    }
});
