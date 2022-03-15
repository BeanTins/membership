
import { Construct, Duration, StackProps } from "@aws-cdk/core"
import { SpecRestApi, ApiDefinition } from "@aws-cdk/aws-apigateway"
import { Function, Runtime } from "@aws-cdk/aws-lambda"
import {NodejsFunction} from "@aws-cdk/aws-lambda-nodejs"
import {EnvvarsStack} from "./envvars-stack"
import {OpenAPISpecBuilder, HttpMethod} from "../infrastructure/open-api-spec"
import { APIGatewayRequestValidator } from "../infrastructure/api-gateway-request-validator"
import { APIGatewayRequestValidators } from "../infrastructure/api-gateway-request-validators"
import { APIGatewayLambdaIntegration } from "../infrastructure/api-gateway-lambda-integration"
import { Role, ServicePrincipal, PolicyStatement } from "@aws-cdk/aws-iam"

interface LambdaEndpointProps extends StackProps {
  name: string
  environment: {[key: string]: string}
  stageName: string
  entry: string
  openAPISpec: OpenAPISpecBuilder
}

export class LambdaEndpoint extends EnvvarsStack {
  private restApi: SpecRestApi
  public readonly lambda: Function
    
  constructor(scope: Construct, id: string, props: LambdaEndpointProps) {
    super(scope, id, props)

    const specBuilder = props.openAPISpec
  
    this.lambda = new NodejsFunction(this, this.buildConstructName("Function", props), {
      memorySize: 1024,
      timeout: Duration.seconds(5),
      runtime: Runtime.NODEJS_14_X,
      handler: "lambdaHandler",
      entry: props.entry,
      environment: props.environment
    })

    const apiRole = this.creatIAMRoleForAPIAccessingLambda(props)    

    this.generateAWSOpenAPIExtensions(apiRole, specBuilder)

    this.restApi = new SpecRestApi(
      this, 
      this.buildConstructName("Api", props),
      {
        apiDefinition: ApiDefinition.fromInline(specBuilder.build()),
        deployOptions: {
          stageName: props.stageName
        }
      }
    ) 

    this.restApi.node.addDependency(this.lambda)
    
    this.addEnvvar(props.name + "Endpoint", this.restApi.urlForPath("\/") + "member/signup")
  }

  private buildConstructName(constructType: string, props: LambdaEndpointProps) {
    return (props.name + constructType + props.stageName)
  }

  private creatIAMRoleForAPIAccessingLambda(props: LambdaEndpointProps) {
    const apiRole = new Role(this, this.buildConstructName("RestApiRole", props), {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    })

    apiRole.addToPolicy(new PolicyStatement({
      resources: [this.lambda.functionArn],
      actions: ['lambda:InvokeFunction']
    }))
    return apiRole
  }

  private generateAWSOpenAPIExtensions(apiRole: Role, specBuilder: OpenAPISpecBuilder) {
    specBuilder.withExtension(new APIGatewayRequestValidators({
      "all": { validateRequestBody: true, validateRequestParameters: true }
    }))

    const [endpoint] = specBuilder.getEndpoints().values()

    endpoint.withExtension(new APIGatewayRequestValidator("all"))

    const integration = new APIGatewayLambdaIntegration(this.lambda.functionName, HttpMethod.Post, apiRole.roleArn)

    endpoint.withExtension(integration)
  }
} 

