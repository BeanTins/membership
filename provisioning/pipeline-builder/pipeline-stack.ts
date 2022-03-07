import { Construct, Stack, RemovalPolicy, CfnOutput, Fn } from "@aws-cdk/core"
import { CodePipeline, CodePipelineSource, CodeBuildStep, ManualApprovalStep } from "@aws-cdk/pipelines"
import { ReportGroup, BuildSpec } from "@aws-cdk/aws-codebuild"
import { Bucket } from "@aws-cdk/aws-s3"
import { StageFactory } from "./stage-factory"
import { DeploymentStage } from "./deployment-stage"
import { Role, ServicePrincipal, PolicyStatement, Effect } from "@aws-cdk/aws-iam"

export enum SCM {
  GitHub = 1
}

export enum ExportType {
  S3 = 1
}

export interface SourceCodeRepoProperties {
  readonly owner: string
  readonly repository: string
  readonly branch: string
}

export interface SourceCodeProperties extends SourceCodeRepoProperties {
  readonly provider: SCM
}

export interface ReportingProperties {
  readonly fromDirectory: string
  readonly withFiles: string[]
  readonly exportingTo?: ExportType
}

export interface ExecutionStageProperties {
  readonly extractingSourceFrom: SourceCodeProperties
  readonly executingCommands: string[]
  readonly reporting?: ReportingProperties
  readonly withPermissionToAccess?: ResourceAccess[]
}

export interface ResourceAccess {
  readonly resource: string
  readonly withAllowableOperations: string[]
}

export interface CommitStageProperties extends ExecutionStageProperties {
}

export interface AcceptanceStageProperties extends ExecutionStageProperties{
  readonly exposingEnvVars?: boolean
}

export interface ProductionStageProperties{
  readonly manualApproval?: boolean
}

export interface PipelineProperties {
  readonly name: string
  readonly commitStage: CommitStageProperties
  readonly acceptanceStage?: AcceptanceStageProperties
  readonly productionStage?: ProductionStageProperties
}

interface DeferredPermissionChange {
  (): void
}

export class PipelineStack extends Stack {
  private stageFactory: StageFactory
  private deferredReportGroupPermissionChanges: DeferredPermissionChange[]
  private cachedSources: Map<string, CodePipelineSource> = new Map()

  constructor(scope: Construct, stageFactory: StageFactory, id: string, props: PipelineProperties) {
    super(scope, id)
    this.stageFactory = stageFactory
    this.deferredReportGroupPermissionChanges = new Array()

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: props.name,
      synth: this.buildCommitStageStep(props.commitStage)
    })

    if (props.acceptanceStage != undefined){

      const acceptanceDeploymentStage = this.stageFactory.create(this, "AcceptanceTest", "test")
    
      const buildStep = this.buildAcceptanceStageStep(props.acceptanceStage, acceptanceDeploymentStage)

      pipeline.addStage(acceptanceDeploymentStage, { post: [buildStep] })
    }

    if (props.productionStage != undefined){
      let stepSetup: any = {}
 
      const productionDeploymentStage = this.stageFactory.create(this, "Production", "prod")
    
      if (props.productionStage.manualApproval)
      {
        stepSetup["pre"] = [new ManualApprovalStep('PromoteToProduction')]
      }

      stepSetup["commands"] = [this.buildStageEnvVarCommand("prod")]

      pipeline.addStage(productionDeploymentStage,stepSetup)
    }

    this.actionAnyDeferredPermissionChanges(pipeline)
  }

  private actionAnyDeferredPermissionChanges(pipeline: CodePipeline) {
    if (this.deferredReportGroupPermissionChanges.length > 0) {
      pipeline.buildPipeline()
      this.deferredReportGroupPermissionChanges.forEach((changePermission) => {
        changePermission()
      })
    }
  }

  private buildAcceptanceStageStep(props: AcceptanceStageProperties, deployedInfrastructure: DeploymentStage) {
    let buildStepSetup: any = {
      input: this.buildSourceCode(props),
      commands: props.executingCommands
    }

    let reportGroup: ReportGroup | undefined 

    if (props.reporting != undefined) {
      reportGroup = this.buildReportGroup(props.reporting.exportingTo, "Acceptance")
      buildStepSetup["partialBuildSpec"] = this.buildReportingSpec(reportGroup.reportGroupArn, props.reporting)
    }

    let commands: string[] = [this.buildStageEnvVarCommand("test"), ...props.executingCommands]

    if(props.exposingEnvVars){
      buildStepSetup["envFromCfnOutputs"] = deployedInfrastructure.envvars

      commands = commands.concat(this.buildEnvironmentVariableExportCommands(deployedInfrastructure.envvars))
    }

    buildStepSetup["commands"] = commands

    buildStepSetup["role"] = this.buildStagePermissionsRole("AcceptanceTestExecutionRole", 
                                                            props.withPermissionToAccess)

    return this.buildBuildStep("AcceptanceTest", buildStepSetup, reportGroup)
  }  

  private buildStagePermissionsRole(name: string, withPermissionToAccess: ResourceAccess[]|undefined) {
    const role = new Role(this, name, {
      assumedBy: new ServicePrincipal("codebuild.amazonaws.com"),
      roleName: name
    })

    if (withPermissionToAccess != undefined) {
      for (const accessingResources of withPermissionToAccess) {

        role.addToPolicy(new PolicyStatement(
          {
            effect: Effect.ALLOW,
            resources: [accessingResources.resource],
            actions: accessingResources.withAllowableOperations
          }))
      }
    }
    return role
  }

  private buildEnvironmentVariableExportCommands(envvars: Record<string, CfnOutput>) {
    let exportEnvCommands = Array()
    let envName: keyof Record<string, CfnOutput>
    for (envName in envvars) {
      exportEnvCommands.push("export " + envName + "=$" + envName)
    }
    return exportEnvCommands
  }

  private buildCommitStageStep(commitStageProps: CommitStageProperties) {
    
    const commands = [this.buildStageEnvVarCommand("commit"),...commitStageProps.executingCommands]

    let buildStepSetup: any = {
      input: this.buildSourceCode(commitStageProps),
      commands: commands
    }

    let reportGroup: ReportGroup | undefined 

    if (commitStageProps.reporting != undefined) {
      reportGroup = this.buildReportGroup(commitStageProps.reporting.exportingTo, "Commit")
      buildStepSetup["partialBuildSpec"] = this.buildReportingSpec(reportGroup.reportGroupArn, commitStageProps.reporting)
    }

    buildStepSetup["role"] = this.buildStagePermissionsRole("CommitStageTestExecutionRole", 
                                                           commitStageProps.withPermissionToAccess)

    return this.buildBuildStep("Commit", buildStepSetup, reportGroup)
  }

  private buildStageEnvVarCommand(stage: string) {
    return "export PipelineStage=" + stage
  }

  private buildSourceCode(commitStageProps: CommitStageProperties) {
    const sourceCodeProp = commitStageProps.extractingSourceFrom
    let sourceCode

    if (this.cachedSources.has(JSON.stringify(sourceCodeProp))){
      sourceCode = this.cachedSources.get(JSON.stringify(sourceCodeProp))
    }
    else
    {
      sourceCode = CodePipelineSource.gitHub(sourceCodeProp.owner + "/" + sourceCodeProp.repository,
        sourceCodeProp.branch)

      this.cachedSources.set(JSON.stringify(sourceCodeProp), sourceCode)
    }
    return sourceCode
  }

  private buildBuildStep(name: string, buildStepSetup: any, reportGroup: ReportGroup | undefined) {
    const buildStep = new CodeBuildStep(name, buildStepSetup)
    if (reportGroup != undefined) {
      this.deferredReportGroupPermissionChanges.push(() => {
        if (reportGroup != undefined)
          reportGroup.grantWrite(buildStep.grantPrincipal)
      })
    }
    return buildStep
  }

  private buildReportingSpec(reportGroupArn: string, reporting: ReportingProperties) {

    const reportBuildSpec = BuildSpec.fromObject({
      version: '0.2',
      reports: {
        [reportGroupArn]: {
          files: reporting.withFiles,
          'file-format': 'JUNITXML',
          'base-directory': reporting.fromDirectory
        }
      }
    })
    return reportBuildSpec
  }

  private buildReportGroup(exportType: ExportType | undefined, prependLabel: string) {
    let reportGroupSetup: any = {}
    if (exportType == ExportType.S3) {
      const reportBucket = new Bucket(this, prependLabel + "ReportExports", { removalPolicy: RemovalPolicy.DESTROY })

      reportGroupSetup["exportBucket"] = reportBucket
    }

    const jestReportGroup = new ReportGroup(this, prependLabel + "JestReportGroup", reportGroupSetup)
    return jestReportGroup
  }
}
