import { Construct, Stack, StackProps } from '@aws-cdk/core'
import { CodePipeline, CodePipelineSource, CodeBuildStep, ManualApprovalStep } from "@aws-cdk/pipelines"
import { ReportGroup, LinuxBuildImage, BuildSpec} from "@aws-cdk/aws-codebuild"
import { MembershipStage } from "./membership-stage"
import { Bucket } from "@aws-cdk/aws-s3"

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const jestUnitTestReportGroup = new ReportGroup(this, 'JestUnitReportGroup', {})

    const sourceCode = CodePipelineSource.gitHub("BeanTins/membership", "main")

    const synthStep = new CodeBuildStep("Synth", {
      input: sourceCode,
      buildEnvironment: {
       buildImage: LinuxBuildImage.STANDARD_5_0
     },
     partialBuildSpec: BuildSpec.fromObject({
       version: '0.2',
       reports: {
         [jestUnitTestReportGroup.reportGroupArn]: {
           files: ['test-results.xml'],
           'file-format': 'JUNITXML',
           'base-directory': 'reports/unit-tests'
         }
       }
     }),

      commands: [
        "npm ci",
        "npm run build",
        "npm run test:unit",
        "npx cdk synth"
      ],
    })
    
    const pipeline = new CodePipeline(this, "Pipeline", {
       pipelineName: "MembershipPipeline",
       synth: synthStep,
    })

    const testApp = new MembershipStage(this, 'ComponentTest',{
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    })

    const componentReportExports = new Bucket(this, "ComponentTestReportExports", {})

    const jestComponentTestReportGroup = new ReportGroup(this, 'JestComponentReportGroup', {exportBucket: componentReportExports})

    const testStep = new CodeBuildStep("RunComponentTests", {
      input: sourceCode,
      envFromCfnOutputs: {member_signup_endpoint: testApp.signupEndpoint},
      partialBuildSpec: BuildSpec.fromObject({
        version: '0.2',
        reports: {
          [jestComponentTestReportGroup.reportGroupArn]: {
            files: ["test-results.xml","tests.log"],
            "file-format": "JUNITXML",
            "base-directory": "reports/component-tests"
          }
        },
        
      }),
      commands: ["export memberSignupEndpoint=$member_signup_endpoint",
      "npm ci",
      "npm run test:component"]
    })
    
    pipeline.addStage(testApp,
      { post: [testStep] } )

    const prodApp = new MembershipStage(this, 'Production',{
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    })
  
    pipeline.addStage(prodApp,{
      pre: [
        new ManualApprovalStep('PromoteToProduction'),
      ]
    })

    pipeline.buildPipeline()

    jestUnitTestReportGroup.grantWrite(synthStep.grantPrincipal)
    jestComponentTestReportGroup.grantWrite(testStep.grantPrincipal)
  }
}


