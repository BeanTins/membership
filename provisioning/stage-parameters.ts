import {Stack, StackProps } from "aws-cdk-lib"
import { Construct } from "constructs"
import {StringParameter} from "aws-cdk-lib/aws-ssm"

interface StageParametersProps extends StackProps {
  stageName: string;
}

export class StageParameters extends Stack {

  public readonly userPoolId

  constructor(scope: Construct, id: string, props: StageParametersProps)
  {
    super (scope, id, props)
    const importedUserPoolId = StringParameter.fromStringParameterAttributes(
      this,
      "userPoolId_" + props.stageName,
      {
        parameterName: "userPoolId_" + props.stageName
      },
    )

    this.userPoolId = importedUserPoolId.stringValue
  }
}

