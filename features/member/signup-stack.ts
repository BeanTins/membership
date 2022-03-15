
import { Construct, StackProps } from "@aws-cdk/core"
import * as path from "path"
import { specBuilder} from "./signup"
import { LambdaEndpoint } from "../../provisioning/lambda-endpoint"

interface SignupStackProps extends StackProps {
  memberTable: string;
  stageName: string
}

export class SignupStack extends LambdaEndpoint {
  
  constructor(scope: Construct, id: string, props: SignupStackProps) {

    super(scope, id, 
      {name: "MemberSignup",
       environment: {MemberTable: props.memberTable},
       stageName: props.stageName,
       entry: path.join(__dirname, "signup.ts"),
       openAPISpec: specBuilder})
  }
} 

