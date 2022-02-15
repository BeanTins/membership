import { SignupStack } from "../features/member/signup-stack"
import { MemberTableStack } from "./member-table-stack"

import { CfnOutput, Construct, StageProps, Stage } from "@aws-cdk/core"

export class MembershipStage extends Stage {
  private readonly signupEndpoint: CfnOutput;
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
}

