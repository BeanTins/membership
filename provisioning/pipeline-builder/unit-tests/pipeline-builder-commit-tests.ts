import { SCM } from "../pipeline-stack"
import { PipelineBuilder } from "../pipeline-builder"
import { Template, Match, Capture } from "@aws-cdk/assertions"
import { App } from "@aws-cdk/core"
import { TestStageFactory } from "./helpers/test-stage-factory"
import { expectAndFindPipelineStage, 
         expectActionsToContainPartialMatch, 
         expectCommandsToContain } from "./helpers/pipeline-expect"

let stageFactory: TestStageFactory
let pipelineBuilder: PipelineBuilder
let app: App

beforeEach(() => {
  app = new App();
  stageFactory = new TestStageFactory()
  pipelineBuilder = new PipelineBuilder(app, stageFactory)
})

test("Pipeline without name reports exception", () => {
  expect(() => {
    pipelineBuilder.build()
  }).toThrow("pipeline must have a name")
})

test("Pipeline without commit stage reports exception", () => {
  expect(() => {
    pipelineBuilder.withName("MembershipPipeline")
    pipelineBuilder.build()
  }).toThrow("pipeline must have a commit stage")
})

test("Pipeline with source from github", () => {
  pipelineBuilder.withName("MembershipPipeline")
  pipelineBuilder.withCommitStage(
    {extractingSourceFrom: {provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main"},
     executingCommands: []})

  const stack = pipelineBuilder.build()

  const stageActions = expectAndFindPipelineStage(stack, "Source")

  expectActionsToContainPartialMatch(stageActions, "ActionTypeId", {Provider: "GitHub"})
  expectActionsToContainPartialMatch(stageActions, "Configuration", 
                                     {Owner: "BeanTins", Repo: "membership", Branch: "main"})
})

test("Pipeline with stage export", () => {
  pipelineBuilder.withName("MembershipPipeline")
  pipelineBuilder.withCommitStage({extractingSourceFrom: {provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main"},
                                   executingCommands: []})

  const stack = pipelineBuilder.build()

  expectCommandsToContain(stack, ["export PipelineStage=commit"])

})

test("Pipeline with commands to build", () => {
  pipelineBuilder.withName("MembershipPipeline")
  pipelineBuilder.withCommitStage({extractingSourceFrom: {provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main"},
                                   executingCommands: ["npm ci"]})

  const stack = pipelineBuilder.build()

  expectCommandsToContain(stack, ["npm ci"])
})

test("Pipeline with unit test reports", () => {
  pipelineBuilder.withName("MembershipPipeline")
  pipelineBuilder.withCommitStage(
    {
      extractingSourceFrom: {provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main"},
      executingCommands: ["npm ci"],
      reporting: {fromDirectory: "reports/unit-tests", withFiles: ["test-results.xml"]}
    }
  )

  const template = Template.fromStack(pipelineBuilder.build())

  const reportingString = new Capture()
  
  template.hasResourceProperties("AWS::CodeBuild::Project", {
    Source: Match.objectLike({
      BuildSpec: Match.objectLike({
        "Fn::Join": reportingString
      })
    })
  }) 

  let buildSpecText = reportingString.asArray().toString()
  expect(buildSpecText).toEqual(expect.stringMatching(/files.+test-results.xml/sm))
  expect(buildSpecText).toEqual(expect.stringMatching(/base-directory.+reports[/]unit-tests/sm))
})

test("Pipeline with report creation permissions", () => {
  pipelineBuilder.withName("MembershipPipeline")
  pipelineBuilder.withCommitStage(
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
          "Action": [
            "codebuild:CreateReport", 
            "codebuild:UpdateReport",
            "codebuild:BatchPutTestCases"],
          "Resource":  {
            "Fn::GetAtt": Match.arrayWith([
              reportGroupName])
            }
          })
        ])
      })
    })
})

function pipelineWithNameAndCommitStagePopulated() {
  pipelineBuilder.withName("MembershipPipeline")
  pipelineBuilder.withCommitStage(
    {
      extractingSourceFrom: { provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main" },
      executingCommands: []
    })
}

