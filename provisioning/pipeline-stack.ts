import { Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core'
import { CodePipeline, CodePipelineSource, CodeBuildStep } from "@aws-cdk/pipelines"
import * as codebuild from "@aws-cdk/aws-codebuild"

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
       synth: new CodeBuildStep("Synth", {
         input: CodePipelineSource.gitHub("BeanTins/membership", "main"),
         buildEnvironment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_5_0
        },
  
        // Install dependencies, build and run cdk synth
         commands: [
           "npm ci",
           "npm run build",
           "npx cdk synth"
         ],
       }),
    });

    // This is where we add the application stages
    // ...
  }
}
