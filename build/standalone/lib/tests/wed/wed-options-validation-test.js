define(["require", "exports", "chai", "wed/wed-options-validation"], function (require, exports, chai_1, wed_options_validation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // tslint:disable-next-line:missing-jsdoc
    describe("wed-options-validation", function () {
        describe("processOptions", function () {
            it("returns cleaned options when done", function () {
                var options = {
                    metadata: {
                        name: "Test",
                        authors: ["Louis-Dominique Dubeau"],
                        description: "TEST MODE. DO NOT USE IN PRODUCTION!",
                        license: "MPL 2.0",
                        copyright: "Mangalam Research Center for Buddhist Languages",
                    },
                    label_levels: {
                        max: 2,
                        initial: 1,
                    },
                    attributes: {
                        handling: "edit",
                        autohide: {
                            method: "selector",
                            elements: [{
                                    selector: "a",
                                    attributes: [
                                        "moo",
                                    ],
                                }],
                        },
                    },
                };
                var result = wed_options_validation_1.processWedOptions(options);
                chai_1.expect(result).is.not.instanceof(Array);
            });
            it("cleans a missing attributes option", function () {
                var options = {
                    metadata: {
                        name: "Test",
                        authors: ["Louis-Dominique Dubeau"],
                        description: "TEST MODE. DO NOT USE IN PRODUCTION!",
                        license: "MPL 2.0",
                        copyright: "Mangalam Research Center for Buddhist Languages",
                    },
                    label_levels: {
                        max: 2,
                        initial: 1,
                    },
                };
                var result = wed_options_validation_1.processWedOptions(options);
                chai_1.expect(result).is.not.instanceof(Array);
                chai_1.expect(result).to.have.nested.property("attributes.handling")
                    .equal("hide");
            });
            it("cleans a string attributes option", function () {
                var options = {
                    metadata: {
                        name: "Test",
                        authors: ["Louis-Dominique Dubeau"],
                        description: "TEST MODE. DO NOT USE IN PRODUCTION!",
                        license: "MPL 2.0",
                        copyright: "Mangalam Research Center for Buddhist Languages",
                    },
                    label_levels: {
                        max: 2,
                        initial: 1,
                    },
                    attributes: "edit",
                };
                var result = wed_options_validation_1.processWedOptions(options);
                chai_1.expect(result).is.not.instanceof(Array);
                chai_1.expect(result).to.have.nested.property("attributes.handling")
                    .equal("edit");
            });
            it("reports an error if the options are not in the right format", function () {
                var options = {
                    metadata: {
                        name: "Test",
                        authors: ["Louis-Dominique Dubeau"],
                        description: "TEST MODE. DO NOT USE IN PRODUCTION!",
                        license: "MPL 2.0",
                        copyright: "Mangalam Research Center for Buddhist Languages",
                    },
                    label_levels: {
                        max: 2,
                        initial: 1,
                    },
                    attributes: "moo",
                };
                var result = wed_options_validation_1.processWedOptions(options);
                chai_1.expect(result).to.be.instanceof(Array);
                chai_1.expect(result).to.have.nested.property("[0]").equal(".attributes should be equal to one of the allowed values");
            });
            it("reports an error if the initial label level > the max", function () {
                var options = {
                    metadata: {
                        name: "Test",
                        authors: ["Louis-Dominique Dubeau"],
                        description: "TEST MODE. DO NOT USE IN PRODUCTION!",
                        license: "MPL 2.0",
                        copyright: "Mangalam Research Center for Buddhist Languages",
                    },
                    label_levels: {
                        max: 2,
                        initial: 3,
                    },
                    attributes: "edit",
                };
                var result = wed_options_validation_1.processWedOptions(options);
                chai_1.expect(result).to.be.instanceof(Array);
                chai_1.expect(result).to.have.nested.property("[0]").equal("label_levels.initial must be <= label_levels.max");
            });
        });
    });
});
//# sourceMappingURL=wed-options-validation-test.js.map