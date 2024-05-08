import type {Config} from '@jest/types';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    "testMatch": [
        "**/__tests__/**/*.[jt]s?(x)",
        "**/?(*.)+(spec|test|tests).[tj]s?(x)" // This now includes .tests.ts
    ],
    clearMocks: true,
    verbose: true, // Optional: for more detailed test output
    collectCoverage: true, // Optional: if you want Jest to collect coverage
    coverageDirectory: "coverage", // Optional: directory where Jest will output coverage files
    coveragePathIgnorePatterns: ['/node_modules/'], // Optional: paths to ignore during coverage collection
};

export default config;
