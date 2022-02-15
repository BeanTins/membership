import { Construct, Stage, CfnOutput } from "@aws-cdk/core"

export interface DeploymentStage extends Stage
{
  readonly envvars: Record<string, CfnOutput>  
}

export interface StageFactory {
  create(scope: Construct, name: string): DeploymentStage;
}
