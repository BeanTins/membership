import { Construct } from "@aws-cdk/core"
import { MembershipStage } from "./membership-stage"
import { StageFactory } from "./pipeline-builder/stage-factory"
import { DeploymentStage } from "./pipeline-builder/deployment-stage"
import { CustomDefinitions } from "./pipeline-builder/pipeline-stack"

export class MembershipFactory implements StageFactory {
  create(scope: Construct, name: string, stageName: string, customDefinitions?: CustomDefinitions): DeploymentStage {
    return new MembershipStage(scope, name, 
      {stageName: stageName, 
       userPoolId: customDefinitions!["userPoolId"],
      eventListenerQueueArn: customDefinitions!["eventListenerQueueArn"]})
  }
}

