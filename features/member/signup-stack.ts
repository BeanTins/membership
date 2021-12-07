
import { Construct, Duration, Stack, StackProps, CfnOutput } from "@aws-cdk/core"
import { LambdaIntegration, RestApi } from "@aws-cdk/aws-apigateway"
import { Function, Runtime } from "@aws-cdk/aws-lambda"
import {NodejsFunction} from "@aws-cdk/aws-lambda-nodejs"
import * as path from "path"

export class SignupStack extends Stack {
  private restApi: RestApi
  private lambda: Function
    
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  
    this.lambda = new NodejsFunction(this, "SignupFunction", {
      memorySize: 1024,
      timeout: Duration.seconds(5),
      runtime: Runtime.NODEJS_14_X,
      handler: "lambdaHandler",
      entry: path.join(__dirname, "signup.ts")
    })

    this.restApi = new RestApi(this, "Api", {
    })

    const member = this.restApi.root.addResource("member")
    const memberSignup = member.addResource("signup")

    memberSignup.addMethod("POST", new LambdaIntegration(this.lambda, {}))

    new CfnOutput(this, "endpoint", {value: this.restApi.url + "member/signup"})
  }
} 

