import { SignupStack } from "../features/member/signup-stack"
import { VerifyStack } from "../features/member/verify-stack"
import { MemberTable } from "./member-table"
import { DeploymentStage } from "./pipeline-builder/deployment-stage"
import { CfnOutput, Construct, StageProps, Stage } from "@aws-cdk/core"
import {StringParameter} from "@aws-cdk/aws-ssm"

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
     userPoolId: this.fetchUserPoolId(props.stageName)})
    
    this.memberTable.grantAccessTo(this.signup.lambda.grantPrincipal)
    this.memberTable.grantAccessTo(this.verify.lambda.grantPrincipal)
  }

  fetchUserPoolId(stageName: string): string{
    const importedUserPoolId = StringParameter.fromStringParameterAttributes(
      this,
      "userPoolId_" + stageName,
      {
        parameterName: "userPoolId_" + stageName,
        simpleName: false,
      },
    )

    return importedUserPoolId.stringValue
  }
}

