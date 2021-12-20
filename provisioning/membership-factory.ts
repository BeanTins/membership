import { App, Stage } from "@aws-cdk/core"
import { Construct } from "@aws-cdk/core"
import { MembershipStage } from "./membership-stage"
import { StageFactory } from "./pipeline-builder/stage-factory"

export class MembershipFactory implements StageFactory {
  create(scope: Construct, name: string): Stage {
    return new MembershipStage(scope, name)
  }
}

