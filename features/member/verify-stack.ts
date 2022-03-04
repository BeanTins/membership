import {UserPool} from "@aws-cdk/aws-cognito"
import {Construct, Stack, StackProps, Duration } from "@aws-cdk/core"
import { Function, Runtime } from "@aws-cdk/aws-lambda"
import {AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId} from "@aws-cdk/custom-resources"
import {NodejsFunction} from "@aws-cdk/aws-lambda-nodejs"
import * as path from "path"
import {ServicePrincipal} from "@aws-cdk/aws-iam"

interface VerifyStackProps extends StackProps {
  memberTable: string;
  userPoolId: string
}

export class VerifyStack extends Stack {

  public readonly lambda: Function

  constructor(scope: Construct, id: string, props: VerifyStackProps) {
    super(scope, id, props)

    this.lambda = new NodejsFunction(this, "VerifyFunction", {
      memorySize: 1024,
      timeout: Duration.seconds(5),
      runtime: Runtime.NODEJS_14_X,
      handler: "lambdaHandler",
      entry: path.join(__dirname, "verify.ts"),
      environment: {
         MemberTable: props.memberTable
      }
    })

    this.registerSignupCallback(this.lambda.functionArn, props.userPoolId)
  }

  registerSignupCallback(functionArn: string, userPoolId: string)
  {
    const userPool = UserPool.fromUserPoolId(this, "UserPool", userPoolId);

    this.lambda.addPermission("AllowCognitoAccessToPostConfirmationLambda", {
      action: "lambda:InvokeFunction",
      principal: new ServicePrincipal("cognito-idp.amazonaws.com"),
      sourceArn: userPool.userPoolArn
    })

    const custom = new AwsCustomResource(this, "UpdateUserPool", {
      resourceType: "Custom::UpdateUserPool",
      onCreate: {
        region: this.region,
        service: "CognitoIdentityServiceProvider",
        action: "updateUserPool",
        parameters: {
          UserPoolId: userPool.userPoolId,
          LambdaConfig: {
            PostConfirmation: functionArn
          },
        },
        physicalResourceId: PhysicalResourceId.of(userPool.userPoolId),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: AwsCustomResourcePolicy.ANY_RESOURCE }),
    })
   
  }
}