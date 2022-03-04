
import { loadFeatures, autoBindSteps } from "jest-cucumber";

import { MemberSteps } from "./helpers/member.steps";

const features = loadFeatures("**/*.feature");
autoBindSteps(features, [ MemberSteps ]);

