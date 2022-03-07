import { Construct } from "@aws-cdk/core"
import { DeploymentStage } from "./deployment-stage"

export interface StageFactory {
  create(scope: Construct, name: string, stageName: string): DeploymentStage;
}
