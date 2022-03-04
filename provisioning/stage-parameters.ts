import {Stack, StackProps, Construct} from "@aws-cdk/core"
import {StringParameter} from "@aws-cdk/aws-ssm"

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

