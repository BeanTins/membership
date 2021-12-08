import { Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core'
import { CodePipeline, CodePipelineSource, ShellStep } from "@aws-cdk/pipelines"
import * as ssm from '@aws-cdk/aws-ssm'

/**
 * The stack that defines the application pipeline
 */
export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, "Pipeline", {
      // The pipeline name
      pipelineName: "MembershipPipeline",

       // How it will be built and synthesized
       synth: new ShellStep("Synth", {
         input: CodePipelineSource.gitHub("BeanTins/membership", "main"),
         
         // Install dependencies, build and run cdk synth
         commands: [
           "npm install",
           "echo HELLO"
          //  "npm run test",
          //  "npx cdk synth"
         ],
       }),
    });

    // This is where we add the application stages
    // ...
  }
}
