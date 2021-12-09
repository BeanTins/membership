
import type {Config} from "@jest/types";

// Sync object
const config: Config.InitialOptions = {
verbose: true,
name: "unit",
displayName: "Unit Tests",
preset: "ts-jest",
testMatch: ["**/unit-tests/*tests.ts"],
reporters: [
    'default',
    [ 'jest-junit', {
      outputDirectory: "./reports/unit-test",
      outputName: "unit-test-results.xml",
    } ]
  ]
};
export default config;

