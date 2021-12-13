
import "source-map-support/register"
import * as cdk from "@aws-cdk/core"
import { MembershipStage } from "./membership-stage"

const app = new cdk.App()
new MembershipStage(app, "MembershipDevStage", {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
})

app.synth()