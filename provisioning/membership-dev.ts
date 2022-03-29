
import "source-map-support/register"
import {App, Fn} from "@aws-cdk/core"
import { MembershipStage } from "./membership-stage"
import { MemberCredentials, StoreType} from "./member-credentials"
import { EventListenerQueueStack } from "../features/member/component-tests/helpers/event-listener-queue-stack"

const app = new App()

const testListenerQueue = new EventListenerQueueStack(app, "TestListenerQueueDev", {
  stageName: "dev",
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
})

const memberCredentials = new MemberCredentials(app, "MemberCredentialsDev", {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  stageName: "dev",
  storeTypeForSettings: StoreType.Output 
})

const membershipStage = new MembershipStage(app, "MembershipDev", {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  stageName: "dev",
  eventListenerQueueArn: Fn.importValue("testListenerQueueArndev"),
  userPoolId: Fn.importValue("userPoolIddev")
})

app.synth()
