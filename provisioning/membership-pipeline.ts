#!/usr/bin/env node
import { App } from '@aws-cdk/core'
import { SCM } from './pipeline-builder/pipeline-stack'
import { PipelineBuilder } from "./pipeline-builder/pipeline-builder"
import { MembershipFactory} from "./membership-factory"

const membershipFactory = new MembershipFactory()

const app = new App()

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
    executingCommands: ["npm ci", "npm run test:component"],
    reporting: {fromDirectory: "reports/component-tests", withFiles: ["test-results.xml"]},
    exposingEndpointsAsEnvVars: true
  }
)

pipeline.build()

app.synth()
