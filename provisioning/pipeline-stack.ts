import { Construct, Stack, StackProps, Stage, StageProps } from '@aws-cdk/core'
import { CodePipeline, CodePipelineSource, CodeBuildStep, ShellStep } from "@aws-cdk/pipelines"
import { ReportGroup, LinuxBuildImage, BuildSpec} from "@aws-cdk/aws-codebuild"
import { MembershipStage } from "./membership-stage"

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const jestReportGroup = new ReportGroup(this, 'JestReportGroup', {})

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "MembershipPipeline",

       synth: new CodeBuildStep("Synth", {
         input: CodePipelineSource.gitHub("BeanTins/membership", "main"),
         buildEnvironment: {
          buildImage: LinuxBuildImage.STANDARD_5_0
        },
        partialBuildSpec: BuildSpec.fromObject({
          version: '0.2',
          reports: {
            [jestReportGroup.reportGroupArn]: {
              files: ['test-results.xml'],
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

    pipeline.addStage(testApp,
      { post: [new CodeBuildStep("RunComponentTests", {
        partialBuildSpec: BuildSpec.fromObject({
          version: '0.2',
          reports: {
            [jestReportGroup.reportGroupArn]: {
              files: ["test-results.xml","tests.log"],
              "file-format": "JUNITXML",
              "base-directory": "reports/component-test"
            }
          }
        }),

        commands: ["npm run test:component"]})]})

    pipeline.buildPipeline()

    jestReportGroup.grantWrite(pipeline.synthProject)

  }
}


