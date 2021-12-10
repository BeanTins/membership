import { Construct, Stack, StackProps, Stage, StageProps } from '@aws-cdk/core'
import { CodePipeline, CodePipelineSource, CodeBuildStep } from "@aws-cdk/pipelines"
import { ReportGroup, LinuxBuildImage, BuildSpec} from "@aws-cdk/aws-codebuild"
import { MembershipStage } from "./membership-stage"

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
          reports: {
            [jestReportGroup.reportGroupArn]: {
              files: ['unit-test-results.xml'],
              'file-format': 'JUNITXML',
              'base-directory': 'reports/unit-test'
            }
          }
        }),
  
         commands: [
           "npm ci",
           "npm run build",
           "npm run test:unit",
           "npx cdk synth"
         ],
       }),
    });

    const testApp = new MembershipStage(this, 'ComponentTest',{
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    })

    pipeline.addStage(testApp)


    pipeline.buildPipeline()

    jestReportGroup.grantWrite(pipeline.synthProject)

  }
}


