import { SignupStack } from "../features/member/signup-stack"
import { VerifyStack } from "../features/member/verify-stack"
import { MemberTable } from "./member-table"
import { DeploymentStage } from "./pipeline-builder/deployment-stage"
import { CfnOutput, Construct, StageProps, Stage } from "@aws-cdk/core"

interface MembershipStageProps extends StageProps{
  stageName: string,
  externalResources: any
}

export class MembershipStage extends Stage implements DeploymentStage{
  private readonly signup: SignupStack
  private readonly verify: VerifyStack
  private readonly memberTable: MemberTable

  get envvars(): Record<string, CfnOutput> {
    return {...this.memberTable.envvars, ...this.signup.envvars}
  }
  
  constructor(scope: Construct, id: string, props: MembershipStageProps) {
    super(scope, id, props)

    this.memberTable = new MemberTable(this, "Members", {postfixIdentifier: props.stageName})

    this.signup = new SignupStack(this, "MemberSignup", {memberTable: this.memberTable.name, stageName: props.stageName})
    this.verify = new VerifyStack(this, "MemberVerify", 
    {memberTable: this.memberTable.name,
     userPoolId: props.externalResources["userPoolId"]})
    
    this.memberTable.grantAccessTo(this.signup.lambda.grantPrincipal)
    this.memberTable.grantAccessTo(this.verify.lambda.grantPrincipal)
  }
}

