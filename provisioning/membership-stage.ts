import { SignupStack } from "../features/member/signup-stack"
import { MemberTable } from "./member-table"
import { DeploymentStage } from "./pipeline-builder/deployment-stage"

import { CfnOutput, Construct, StageProps, Stage, Fn } from "@aws-cdk/core"

export class MembershipStage extends Stage implements DeploymentStage{
  private readonly signup: SignupStack
  private readonly memberTable: MemberTable

  get envvars(): Record<string, CfnOutput> {
    return {...this.memberTable.envvars, ...this.signup.envvars}
  }
  
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props)

    this.memberTable = new MemberTable(this, "Members")

    this.signup = new SignupStack(this, "MemberSignup", {memberTable: this.memberTable.name})
    
    this.memberTable.grantAccessTo(this.signup.lambda.grantPrincipal)
  }
}

