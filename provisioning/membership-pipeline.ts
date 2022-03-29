#!/usr/bin/env node
import { App, Fn } from "@aws-cdk/core"
import { ExportType, SCM } from "./pipeline-builder/pipeline-stack"
import { PipelineBuilder } from "./pipeline-builder/pipeline-builder"
import { MembershipFactory} from "./membership-factory"
import { StageParameters } from "../infrastructure/stage-parameters"
import { MemberCredentials, StoreType} from "./member-credentials"
import { EventListenerQueueStack } from "../features/member/component-tests/helpers/event-listener-queue-stack"

interface StageConfiguration
{
  memberTableArn: string
  memberTableArnIndexes: string
  userPoolArn: string
  userPoolId: string
}

async function main(): Promise<void> 
{
  const membershipFactory = new MembershipFactory()

  const app = new App()

  provisionTestResources(app)

  const testConfig = getTestConfig()
  const prodConfig = await getProdConfig()

  const pipeline = new PipelineBuilder(app, membershipFactory)

  pipeline.withName("MembershipPipeline")

  pipeline.withCommitStage(
    {
      extractingSourceFrom: { provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main" },
      executingCommands: ["npm ci", "npm run build", "npm run test:unit", "npx cdk synth"],
      reporting: {fromDirectory: "reports/unit-tests", withFiles: ["test-results.xml"]}
    })
  pipeline.withAcceptanceStage(
    {
      extractingSourceFrom: {provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main"},
      executingCommands: ["npm ci", 
      "export testQueueName=" + Fn.importValue("testListenerQueueNametest"),
      "npm run test:component"],
      reporting: {fromDirectory: "reports/component-tests", withFiles: ["test-results.xml", "tests.log"], exportingTo: ExportType.S3},
      exposingEnvVars: true,
      withPermissionToAccess: [
        {resource: testConfig.memberTableArn, withAllowableOperations: ["dynamodb:*"]},
        {resource: testConfig.memberTableArnIndexes, withAllowableOperations: ["dynamodb:*"]},
        {resource: testConfig.userPoolArn, withAllowableOperations: ["cognito-idp:*"]},
        {resource: Fn.importValue("testListenerQueueArntest"), withAllowableOperations: ["sqs:*"]}],
      withCustomDefinitions: {userPoolId: testConfig.userPoolId, 
                              eventListenerQueueArn: Fn.importValue("testListenerQueueArntest")} 
    }
  )

  pipeline.withProductionStage(
    {
      manualApproval: true,
      withPermissionToAccess: [
        {resource: prodConfig.memberTableArn, withAllowableOperations: ["dynamodb:*"]},
        {resource: prodConfig.memberTableArnIndexes, withAllowableOperations: ["dynamodb:*"]},
        {resource: "*", withAllowableOperations: ["ssm:GetParameter"]},
        {resource: prodConfig.userPoolArn, withAllowableOperations: ["cognito-idp:*"]}],
      withCustomDefinitions: {userPoolId: prodConfig.userPoolId} 
    }
  )

  pipeline.build()

  app.synth()
}

main().catch(console.error)

function provisionTestResources(app: App) {
  const testListenerQueue = new EventListenerQueueStack(app, "TestListenerQueuetest", {
    stageName: "test",
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  })

  const memberCredentials = new MemberCredentials(app, "MemberCredentialsTest", {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    stageName: "test",
    storeTypeForSettings: StoreType.Output
  })
}

function getTestConfig()
{
  const memberTableArn = Fn.importValue("MemberTableArntest")
  return {memberTableArn: memberTableArn,
          memberTableArnIndexes: memberTableArn + "\/index\/*",
          userPoolArn: Fn.importValue("userPoolArntest"),
          userPoolId: Fn.importValue("userPoolIdtest")}
}

async function getProdConfig()
{
  const memberTableArn = Fn.importValue("MemberTableArnprod")

  return {memberTableArn: memberTableArn,
          memberTableArnIndexes: memberTableArn + "\/index\/*",
          userPoolArn: await new StageParameters("us-east-1").retrieveFromStage("userPoolArn", "prod"),
          userPoolId: await new StageParameters("us-east-1").retrieveFromStage("userPoolId", "prod")}
}

