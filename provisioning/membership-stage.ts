import "source-map-support/register"
import * as cdk from "@aws-cdk/core"
import { SignupStack } from "../features/member/signup-stack"

const app = new cdk.App();

import { CfnOutput, Construct, StackProps, Stage } from '@aws-cdk/core';

export class MembershipStage extends Stage {
  public readonly signupEndpoint: CfnOutput;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const signup = new SignupStack(app, "MemberSignup", {
        env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
      })

    this.signupEndpoint = signup.endpoint
  }
}

