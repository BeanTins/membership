
import "source-map-support/register"
import {App} from "@aws-cdk/core"
import { MemberCredentials } from "./member-credentials"

const app = new App()
new MemberCredentials(app, "MemberCredentialsProd", {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  stageName: "prod"
})

app.synth()