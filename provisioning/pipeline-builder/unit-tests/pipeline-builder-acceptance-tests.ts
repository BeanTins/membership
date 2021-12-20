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

test("Pipeline with source from github", () => {
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
  const stack = pipelineBuilder.build()

  const template = Template.fromStack(stack)

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
  const stack = pipelineBuilder.build()

  const template = Template.fromStack(stack)

  template.hasResourceProperties("AWS::CodeBuild::ReportGroup", {
    ExportConfig:
      Match.objectLike(
        {ExportConfigType: "S3"}
  )}) 

})



