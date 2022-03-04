
import "source-map-support/register"
import {App} from "@aws-cdk/core"
import { MembershipStage } from "./membership-stage"
import { resolveOutput} from "../features/member/infrastructure/output-resolver"

const userPoolId = resolveOutput("MemberCredentialsDev", "userPoolId")

const app = new App()
new MembershipStage(app, "MembershipDevStage", {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  stageName: "dev",
  externalResources: {userPoolId}
})

app.synth()