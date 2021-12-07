
import { loadFeatures, autoBindSteps } from "jest-cucumber";

import { SignupSteps } from "./signup.steps";

const features = loadFeatures("**/*.feature");
autoBindSteps(features, [ SignupSteps ]);

