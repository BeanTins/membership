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
  pipelineBuilder.withAcceptanceStage(
    {
      extractingSourceFrom: {provider: SCM.GitHub, owner: "BeanTins", repository: "membership", branch: "main"},
      executingCommands: ["npm run test:component"],
    }
  )
})

test("Pipeline with approval required", () => {

  pipelineBuilder.withProductionStage({manualApproval: true})

  const stack = pipelineBuilder.build()

  const stageActions = expectAndFindPipelineStage(stack, "Production")

  expectActionsToContainPartialMatch(stageActions, "ActionTypeId", {Category: "Approval"})
})

test("Pipeline with deployment", () => {

  pipelineBuilder.withProductionStage({})

  const stack = pipelineBuilder.build()

  const stageActions = expectAndFindPipelineStage(stack, "Production")

  expect(stageFactory.createdStacks[1]).toEqual("Production")
})
