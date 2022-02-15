import {App} from "@aws-cdk/core"
import {MemberTableStack} from "../member-table-stack"
import {Template, Match} from "@aws-cdk/assertions"

let template: Template

beforeEach(() => {
  const app = new App();

  const stack = new MemberTableStack(app, "MyTestStack");
    
  template = Template.fromStack(stack);
})

test('Stack contains member table', () => {
    template.hasResourceProperties("AWS::DynamoDB::Table", {})
})


test('Stack outputs tablename', () => {
  template.hasOutput("MemberTable", {
    Value: Match.anyValue()
  })
})