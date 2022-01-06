import { SignupStack } from "../features/member/signup-stack"

import { CfnOutput, Construct, StageProps, Stage } from '@aws-cdk/core';

export class MembershipStage extends Stage {
  private readonly signupEndpoint: CfnOutput;
  private signup: SignupStack

  get endpoints(): Record<string, CfnOutput> {return {memberSignupEndpoint: this.signupEndpoint} }

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    this.signup = new SignupStack(this, "MemberSignup")

    this.signupEndpoint = this.signup.endpoint
  }
}

