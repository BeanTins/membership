import { Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core'
import { CodePipeline, CodePipelineSource, CodeBuildStep } from "@aws-cdk/pipelines"
import { ReportGroup, LinuxBuildImage, BuildSpec} from "@aws-cdk/aws-codebuild"

/**
 * The stack that defines the application pipeline
 */
export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const jestReportGroup = new ReportGroup(this, 'JestReportGroup', {})

    const pipeline = new CodePipeline(this, "Pipeline", {
      // The pipeline name
      pipelineName: "MembershipPipeline",

       // How it will be built and synthesized
       synth: new CodeBuildStep("Synth", {
         input: CodePipelineSource.gitHub("BeanTins/membership", "main"),
         buildEnvironment: {
          buildImage: LinuxBuildImage.STANDARD_5_0
        },
        partialBuildSpec: BuildSpec.fromObject({
          version: '0.2',
          // Make sure your jest config outputs to locations that match what's here
          reports: {
            [jestReportGroup.reportGroupArn]: {
              files: ['unit-test-results.xml'],
              'file-format': 'JUNITXML',
              'base-directory': 'reports/unit-test'
            }
          }
        }),
  
        // Install dependencies, build and run cdk synth
         commands: [
           "npm ci",
           "npm run build",
           "npm run test:unit",
           "npx cdk synth"
         ],
       }),
    });

    // This is where we add the application stages
    // ...
    pipeline.buildPipeline()

    jestReportGroup.grantWrite(pipeline.synthProject)

  }
}
