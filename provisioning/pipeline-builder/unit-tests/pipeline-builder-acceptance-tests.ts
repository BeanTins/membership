import { SCM, ExportType } from "../pipeline-stack"
import { PipelineBuilder } from "../pipeline-builder"
import { App } from "@aws-cdk/core"
import { Template, Match, Capture } from "@aws-cdk/assertions"
import { TestStageFactory } from "./helpers/test-stage-factory"
import { expectAndFindPipelineStage, 
  expectActionsToContainPartialMatch, 
  expectCommandsToBe } from "./helpers/pipeline-expect"

let stageFactory: TestStageFactory
let pipelineBuilder: PipelineBuilder
let app: App

beforeEach(() => {
  app = new App();
  stageFactory = new TestStageFactory()
  pipelineBuilder = new PipelineBuilder(app, stageFactory)
  pipelineBuilder.withName("MembershipPipeline")
  pipelineBuilder.withCommitStage(
    {
      extractingSourceFrom: { provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main" },
      executingCommands: []
    })
})

test("Pipeline with own source from github", () => {
  pipelineBuilder.withAcceptanceStage(
    {extractingSourceFrom: {provider: SCM.GitHub, owner: "BeanTins", repository: "membership-e2e-tests", branch: "main"},
     executingCommands: []})

  const template = Template.fromStack(pipelineBuilder.build())

  template.hasResourceProperties("AWS::CodePipeline::Pipeline", {
    Stages: Match.arrayWith([
      Match.objectLike({
        "Name": "Source", 
        "Actions": Match.arrayWith([
          Match.objectLike({
            Configuration: Match.objectLike({
              Owner: "BeanTins",
              Repo: "membership-e2e-tests",
              Branch: "main"}),
            ActionTypeId: Match.objectLike({Provider: "GitHub"})
           })
         ])
       })
    ])
  })
})

test("Pipeline with same source as commit", () => {
  pipelineBuilder.withAcceptanceStage(
    {extractingSourceFrom: {provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main"},
     executingCommands: []})

  const stack = pipelineBuilder.build()

  const stageActions = expectAndFindPipelineStage(stack, "Source")

  expectActionsToContainPartialMatch(stageActions, "ActionTypeId", {Provider: "GitHub"})
  expectActionsToContainPartialMatch(stageActions, "Configuration", 
                                     {Owner: "BeanTins", Repo: "membership", Branch: "main"})
})

test("Pipeline with source from github", () => {
  pipelineBuilder.withName("MembershipPipeline")
  pipelineBuilder.withAcceptanceStage(
    {extractingSourceFrom: {provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main"},
     executingCommands: []})

  const stack = pipelineBuilder.build()

  const stageActions = expectAndFindPipelineStage(stack, "Source")

  expectActionsToContainPartialMatch(stageActions, "ActionTypeId", {Provider: "GitHub"})
  expectActionsToContainPartialMatch(stageActions, "Configuration", 
                                     {Owner: "BeanTins", Repo: "membership", Branch: "main"})
})

test("Pipeline with commands", () => {

  pipelineBuilder.withAcceptanceStage(
    {
      extractingSourceFrom: {provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main"},
      executingCommands: ["npm run test:component"],
    }
  )

  const stack = pipelineBuilder.build()

  expectCommandsToBe(stack, ["npm run test:component"])

})

test("Pipeline with deployment", () => {

  pipelineBuilder.withAcceptanceStage(
    {
      extractingSourceFrom: {provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main"},
      executingCommands: ["npm run test:component"],
    }
  )

  const stack = pipelineBuilder.build()

  const stageActions = expectAndFindPipelineStage(stack, "AcceptanceTest")

  expectActionsToContainPartialMatch(stageActions, "ActionTypeId", {Category: "Deploy"})

  expect(stageFactory.createdStacks[0]).toEqual("AcceptanceTest")

})

test("Pipeline with acceptance stage component test reporting", () => {
  pipelineBuilder.withAcceptanceStage(
    {
      extractingSourceFrom: {provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main"},
      executingCommands: ["npm run test:component"],
      reporting: {fromDirectory: "reports/component-tests", withFiles: ["test-results.xml"]}
    }
  )

  const template = Template.fromStack(pipelineBuilder.build())

  const reportingString = new Capture()

  template.hasResourceProperties("AWS::CodeBuild::Project", {
    Source:
      Match.objectLike(
        {BuildSpec: 
          Match.objectLike(
                {"Fn::Join": reportingString})})}) 

  let buildSpecText = reportingString.asArray().toString()
  expect(buildSpecText).toEqual(expect.stringMatching(/files.+test-results.xml/sm))
  expect(buildSpecText).toEqual(expect.stringMatching(/base-directory.+reports[/]component-tests/sm))
})

test("Pipeline with acceptance stage component test exporting", () => {
  pipelineBuilder.withAcceptanceStage(
    {
      extractingSourceFrom: {provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main"},
      executingCommands: ["npm run test:component"],
      reporting: 
      {fromDirectory: "reports/component-tests", withFiles: ["test-results.xml"], exportingTo: ExportType.S3}
    }
  )

  const template = Template.fromStack(pipelineBuilder.build())

  template.hasResourceProperties("AWS::CodeBuild::ReportGroup", {
    ExportConfig:
      Match.objectLike(
        {ExportConfigType: "S3"}
  )}) 

})

test("Pipeline with report creation permissions", () => {
  pipelineBuilder.withName("MembershipPipeline")
  pipelineBuilder.withAcceptanceStage(
    {
      extractingSourceFrom: {provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main"},
      executingCommands: ["npm ci"],
      reporting: {fromDirectory: "reports/unit-tests", withFiles: ["test-results.xml"]}
    }
  )

  const template = Template.fromStack(pipelineBuilder.build())

  const reportGroup = template.findResources("AWS::CodeBuild::ReportGroup")

  expect(reportGroup).toBeDefined()

  const reportGroupName = Object.keys(reportGroup)[0]

  expect(reportGroupName).toBeDefined()
  
  template.hasResourceProperties("AWS::IAM::Policy", {
    PolicyDocument: Match.objectLike({
      Statement: Match.arrayWith([
        Match.objectLike({
          "Action": ["codebuild:CreateReport", "codebuild:UpdateReport","codebuild:BatchPutTestCases"],
          "Resource": {
            "Fn::GetAtt": Match.arrayWith([reportGroupName])
          }
        })
      ])
    })
  })
})

test("Pipeline with endpoints as environment variables", () => {
  pipelineBuilder.withName("MembershipPipeline")
  pipelineBuilder.withAcceptanceStage(
    {
      extractingSourceFrom: { provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main" },
      executingCommands: ["npm run test:component"],
      exposingEnvVars: true
    })

  const template = Template.fromStack(pipelineBuilder.build())

  template.hasResourceProperties("AWS::CodePipeline::Pipeline", {
    Stages: Match.arrayWith([
      Match.objectLike({
        "Name": "AcceptanceTest", 
        "Actions": Match.arrayWith([
          Match.objectLike({
            Configuration: Match.objectLike({
              EnvironmentVariables: Match.serializedJson(Match.arrayWith([
                Match.objectLike({
                  name: "testFunction"
                })
              ]))
            })
          })
        ])
      })
    ])
  })
  
  template.hasResourceProperties("AWS::CodeBuild::Project", {
    Source: Match.objectLike({
      BuildSpec: Match.serializedJson(Match.objectLike({
        phases: Match.objectLike({
          build: Match.objectLike({ 
            commands: ["export testFunction=$testFunction", "npm run test:component"] 
          })
        })
      }))
    })
  }) 
})

test("Pipeline with access to test resources", () => {

  pipelineBuilder.withAcceptanceStage(
    {
      extractingSourceFrom: {provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main"},
      executingCommands: ["npm run test:component"],
      withPermissionToAccess: [{resource: "TestResource", withAllowableOperations: ["dynamodb:*"]}]
    }
  )

  const template = Template.fromStack(pipelineBuilder.build())

  template.hasResourceProperties("AWS::IAM::Policy", {
    PolicyDocument: Match.objectLike({
      Statement: Match.arrayWith([Match.objectLike({
        Action: "dynamodb:*",
        Resource: {"Fn::ImportValue": "TestResource"}
      })])
    })
  })
})




