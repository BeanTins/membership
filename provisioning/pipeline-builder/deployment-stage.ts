import {IPrincipal} from "@aws-cdk/aws-iam"
import {Stage, CfnOutput} from "@aws-cdk/core"

export interface DeploymentStage extends Stage
{
  readonly envvars: Record<string, CfnOutput> 
  grantAccessTo(accessor: string): void
}

