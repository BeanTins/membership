import { Construct } from "@aws-cdk/core"
import { MembershipStage } from "./membership-stage"
import { StageFactory } from "./pipeline-builder/stage-factory"
import { DeploymentStage } from "./pipeline-builder/deployment-stage"

export class MembershipFactory implements StageFactory {
  create(scope: Construct, name: string, postfixIdentifier: string, externalResources: any): DeploymentStage {
    return new MembershipStage(scope, name, {stageName: postfixIdentifier, externalResources: externalResources})
  }
}

