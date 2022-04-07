#!/usr/bin/env node
import { App, Fn } from "aws-cdk-lib"
import { ExportType, SCM } from "./pipeline-builder/pipeline-stack"
import { PipelineBuilder } from "./pipeline-builder/pipeline-builder"
import { MembershipFactory} from "./membership-factory"
import { StageParameters } from "../infrastructure/stage-parameters"
import { MemberCredentials, StoreType} from "../../credentials/infrastructure/member-credentials"
import { EventListenerQueueStack } from "../features/member/component-tests/helpers/event-listener-queue-stack"
import {SSM} from "aws-sdk"

interface StageConfiguration
{
  memberTableArn: string
  memberTableArnIndexes: string
  userPoolArn: string
  userPoolId: string
}


interface TestResources
{
  testListenerQueue: EventListenerQueueStack
  memberCredentials: MemberCredentials
}

async function main(): Promise<void> 
{
  const membershipFactory = new MembershipFactory()

  const app = new App()

  const testResources = provisionTestResources(app)

  const testConfig = getTestConfig()
  const prodConfig = await getProdConfig()
  const sourceCodeArnConnection = await getSourceCodeArnConnection()

  const pipeline = new PipelineBuilder(app, membershipFactory)

  pipeline.withName("MembershipPipeline")

  pipeline.withCommitStage(
    {
      extractingSourceFrom: [
        { provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main", accessIdentifier: sourceCodeArnConnection },
        { provider: SCM.GitHub, owner: "BeanTins", repository: "credentials", branch: "main", accessIdentifier: sourceCodeArnConnection }],
      executingCommands: ["cd ..\/credentials", "npm ci", "npm run build", "cd - ", "npm ci", "npm run build", "npm run test:unit", "npx cdk synth"],
      reporting: {fromDirectory: "reports/unit-tests", withFiles: ["test-results.xml"]},
      withPermissionToAccess: [
        {resource: "*", withAllowableOperations: ["ssm:GetParameter"]}]
    })
  pipeline.withAcceptanceStage(
    {
      extractingSourceFrom: [{provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main", accessIdentifier: sourceCodeArnConnection},
                            { provider: SCM.GitHub, owner: "BeanTins", repository: "credentials", branch: "main", accessIdentifier: sourceCodeArnConnection }],
      executingCommands: ["cd ..\/credentials", "npm ci", "cd - ", "npm ci", "npm run test:component"],
      withEnvironmentVariables : {TestListenerQueueNametest: Fn.importValue("TestListenerQueueNametest"),
                                  userPoolIdtest: Fn.importValue("userPoolIdtest"),
                                  userPoolClientIdtest: Fn.importValue("userPoolClientIdtest")},
      reporting: {fromDirectory: "reports/component-tests", withFiles: ["test-results.xml", "tests.log"], exportingTo: ExportType.S3},
      exposingEnvVars: true,
      withPermissionToAccess: [
        {resource: testConfig.memberTableArn, withAllowableOperations: ["dynamodb:*"]},
        {resource: testConfig.memberTableArnIndexes, withAllowableOperations: ["dynamodb:*"]},
        {resource: testConfig.userPoolArn, withAllowableOperations: ["cognito-idp:*"]},
        {resource: Fn.importValue("TestListenerQueueArntest"), withAllowableOperations: ["sqs:*"]}],
      withCustomDefinitions: {userPoolId: testConfig.userPoolId, 
                              eventListenerQueueArn: Fn.importValue("TestListenerQueueArntest")} 
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

  const pipelineStack = pipeline.build()
  pipelineStack.addDependency(testResources.testListenerQueue)
  pipelineStack.addDependency(testResources.memberCredentials)

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

  return {testListenerQueue: testListenerQueue, memberCredentials: memberCredentials}
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

async function getSourceCodeArnConnection(): Promise<string>
{
  const ssm = new SSM({region: "us-east-1"})
  let parameterValue = ""
  var options = {
    Name: "SourceCodeConnectionArn",
    WithDecryption: true
  }

  try{
    const result = await ssm.getParameter(options).promise()
    parameterValue = result.Parameter!.Value!
  }
  catch (error)
  {
    console.error(error)
    throw error
  }

  return parameterValue
}

