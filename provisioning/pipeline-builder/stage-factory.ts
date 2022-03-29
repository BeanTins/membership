import { Construct } from "@aws-cdk/core"
import { DeploymentStage } from "./deployment-stage"
import { CustomDefinitions } from "./pipeline-stack"

export interface StageFactory {
  create(scope: Construct, name: string, stageName: string, customDefinitions?: CustomDefinitions): DeploymentStage;
}
