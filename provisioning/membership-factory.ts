import { Construct } from "@aws-cdk/core"
import { MembershipStage } from "./membership-stage"
import { StageFactory, DeploymentStage } from "./pipeline-builder/stage-factory"

export class MembershipFactory implements StageFactory {
  create(scope: Construct, name: string): DeploymentStage {
    return new MembershipStage(scope, name)
  }
}

