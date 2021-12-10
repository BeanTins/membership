import { SignupStack } from "../features/member/signup-stack"

import { CfnOutput, Construct, StackProps, Stage } from '@aws-cdk/core';

export class MembershipStage extends Stage {
  public readonly signupEndpoint: CfnOutput;
  private signup: SignupStack

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.signup = new SignupStack(this, "MemberSignup")

    this.signupEndpoint = this.signup.endpoint
  }
}

