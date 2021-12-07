
import "source-map-support/register"
import * as cdk from "@aws-cdk/core"
import { SignupStack } from "../features/member/signup-stack"

const app = new cdk.App();
new SignupStack(app, "MemberSignupStack", {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
})

