#!/usr/bin/env node
import { App } from '@aws-cdk/core'
import { PipelineStack } from './pipeline-stack'

const app = new App();

new PipelineStack(app, 'PipelineStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
})

app.synth();