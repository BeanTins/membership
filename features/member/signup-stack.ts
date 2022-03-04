
import { Construct, Duration, StackProps } from "@aws-cdk/core"
import { LambdaIntegration, RestApi } from "@aws-cdk/aws-apigateway"
import { Function, Runtime } from "@aws-cdk/aws-lambda"
import {NodejsFunction} from "@aws-cdk/aws-lambda-nodejs"
import {EnvvarsStack} from "../../provisioning/envvars-stack"
import * as path from "path"

interface SignupStackProps extends StackProps {
  memberTable: string;
  stageName: string
}

export class SignupStack extends EnvvarsStack {
  private restApi: RestApi
  public readonly lambda: Function
    
  constructor(scope: Construct, id: string, props: SignupStackProps) {
    super(scope, id, props)
  
    this.lambda = new NodejsFunction(this, "SignupFunction", {
      memorySize: 1024,
      timeout: Duration.seconds(5),
      runtime: Runtime.NODEJS_14_X,
      handler: "lambdaHandler",
      entry: path.join(__dirname, "signup.ts"),
      environment: {
         MemberTable: props.memberTable
      }
    })

    this.restApi = new RestApi(this, "Api", {
      deployOptions: {
        stageName: props.stageName,
      }
    })

    const member = this.restApi.root.addResource("member")
    const memberSignup = member.addResource("signup")

    memberSignup.addMethod("POST", new LambdaIntegration(this.lambda, {}))

    this.addEnvvar("MemberSignupEndpoint", this.restApi.url + "member/signup")
  }
} 

