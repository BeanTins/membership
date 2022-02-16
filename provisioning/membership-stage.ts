import { SignupStack } from "../features/member/signup-stack"
import { MemberTableStack } from "./member-table-stack"
import {IPrincipal} from "@aws-cdk/aws-iam"
import { DeploymentStage } from "./pipeline-builder/deployment-stage"

import { CfnOutput, Construct, StageProps, Stage } from "@aws-cdk/core"

export class MembershipStage extends Stage implements DeploymentStage{
  private readonly signup: SignupStack
  private readonly memberTable: MemberTableStack

  get envvars(): Record<string, CfnOutput> {
    return {...this.memberTable.envvars, ...this.signup.envvars}
  }
  
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    this.memberTable = new MemberTableStack(this, "MemberTable")

    this.signup = new SignupStack(this, "MemberSignup", {memberTable: this.memberTable.name})
    
    this.memberTable.grantAccessTo(this.signup.lambda.grantPrincipal)
  }

  grantAccessTo(accessor: IPrincipal)
  {
    this.memberTable.grantAccessTo(accessor)
  }
}

