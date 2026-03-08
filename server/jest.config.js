const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    transform: {
        ...tsJestTransformCfg,
    },
    moduleNameMapper: {
        "@shared/(.*)$": "<rootDir>/../shared/$1"
    }
};
