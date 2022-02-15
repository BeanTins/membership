
import { Template, Match } from "@aws-cdk/assertions"
import { App} from "@aws-cdk/core"
import { SignupStack } from "../signup-stack"

let template: Template

beforeEach(() => {
  const app = new App();

  const stack = new SignupStack(app, "MemberSignupStack",{memberTable: ""});
    
  template = Template.fromStack(stack);
})

test("lambda setup", () => {
  
  template.hasResourceProperties("AWS::Lambda::Function", {
    Handler: "index.lambdaHandler"
  })
})

test("endpoint connected to lambda", () => {

  template.hasResourceProperties("AWS::ApiGateway::Resource", {
    PathPart: "member"
  })
  template.hasResourceProperties("AWS::ApiGateway::Resource", {
    PathPart: "signup"
  })
  template.hasResourceProperties("AWS::ApiGateway::Method", {
    HttpMethod: "POST"
  })
})

test("endpoint url output", () => {
  template.hasOutput("MemberSignupEndpoint", {
    Value: Match.anyValue()
  })

})

