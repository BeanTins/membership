import { Construct, Stack, RemovalPolicy } from "@aws-cdk/core"
import { CodePipeline, CodePipelineSource, CodeBuildStep, ManualApprovalStep } from "@aws-cdk/pipelines"
import { ReportGroup, BuildSpec } from "@aws-cdk/aws-codebuild"
import { Bucket } from "@aws-cdk/aws-s3"
import { StageFactory } from "./stage-factory"

export enum SCM {
  GitHub = 1
}

export enum ExportType {
  S3 = 1
}

export interface SourceCodeProperties {
  readonly provider: SCM
  readonly owner: string
  readonly repository: string
  readonly branch: string
}

export interface ReportingProperties {
  readonly fromDirectory: string
  readonly withFiles: string[]
  readonly exportingTo?: ExportType
}

export interface CommitStageProperties {
  readonly extractingSourceFrom: SourceCodeProperties
  readonly executingCommands: string[]
  readonly reporting?: ReportingProperties
}

export interface AcceptanceStageProperties {
  readonly extractingSourceFrom: SourceCodeProperties
  readonly executingCommands: string[]
  readonly reporting?: ReportingProperties
}

export interface ProductionStageProperties {
  readonly manualApproval?: boolean
}

export interface PipelineProperties {
  readonly name: string
  readonly commitStage: CommitStageProperties
  readonly acceptanceStage?: AcceptanceStageProperties
  readonly productionStage?: ProductionStageProperties
}

export class PipelineStack extends Stack {
  private stageFactory: StageFactory

  constructor(scope: Construct, stageFactory: StageFactory, id: string, props: PipelineProperties) {
    super(scope, id)
    this.stageFactory = stageFactory

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: props.name,
      synth: this.buildCommitStage(props.commitStage)
    })

    if (props.acceptanceStage != undefined){

      const acceptanceDeploymentStage = this.stageFactory.create(this, "AcceptanceTest")
    
      pipeline.addStage(acceptanceDeploymentStage,
      { post: [this.buildAcceptanceStage(props.acceptanceStage)] })
    }

    if (props.productionStage != undefined){
      let stepSetup: any = {}
 
      const productionDeploymentStage = this.stageFactory.create(this, "Production")
    
      if (props.productionStage.manualApproval)
      {
        stepSetup["pre"] = [new ManualApprovalStep('PromoteToProduction')]
      }

      pipeline.addStage(productionDeploymentStage,stepSetup)
    }

  }

  private buildAcceptanceStage(props: AcceptanceStageProperties) {
    let acceptanceSetup: any = {
      commands: props.executingCommands
    }

    if (props.reporting != undefined) {
      acceptanceSetup["partialBuildSpec"] = this.buildReportingSpec(props.reporting, "Acceptance")
    }
        //envFromCfnOutputs: {member_signup_endpoint: testApp.signupEndpoint},
          
        // }),
        // commands: ["export memberSignupEndpoint=$member_signup_endpoint",

    const acceptanceStage = new CodeBuildStep("AcceptanceTests", acceptanceSetup)
    return acceptanceStage
  }

  private buildCommitStage(commitStageProps: CommitStageProperties) {
    const sourceCodeProp = commitStageProps.extractingSourceFrom

    const sourceCode = CodePipelineSource.gitHub(sourceCodeProp.owner + "/" + sourceCodeProp.repository, 
                                                 sourceCodeProp.branch)

    let buildStepSetup: any = {
      input: sourceCode,
      commands: commitStageProps.executingCommands
    }

    if (commitStageProps.reporting != undefined) {
      buildStepSetup["partialBuildSpec"] = this.buildReportingSpec(commitStageProps.reporting, "Commit")
    }

    return new CodeBuildStep("Commit", buildStepSetup)
  }

  private buildReportingSpec(reporting: ReportingProperties, prependLabel: string) {

    let reportGroupSetup: any = {}
    if (reporting.exportingTo != undefined)
    {
      const reportBucket = new Bucket(this, prependLabel + "ReportExports", {removalPolicy: RemovalPolicy.DESTROY})

      reportGroupSetup["exportBucket"] = reportBucket
    }

    const jestReportGroup = new ReportGroup(this, prependLabel + "JestReportGroup", reportGroupSetup)

    const reportBuildSpec = BuildSpec.fromObject({
      version: '0.2',
      reports: {
        [jestReportGroup.reportGroupArn]: {
          files: reporting.withFiles,
          'file-format': 'JUNITXML',
          'base-directory': reporting.fromDirectory
        }
      }
    })
    return reportBuildSpec
  }
}
