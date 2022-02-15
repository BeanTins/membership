import {Table, AttributeType} from "@aws-cdk/aws-dynamodb"
import {CfnOutput, Stack} from "@aws-cdk/core"

export class EnvvarsStack extends Stack {
  private _envvars: Record<string, CfnOutput> = {}

  get envvars() : Record<string, CfnOutput> {
    return this._envvars
  }

  addEnvvar(key: string, value: string)
  {
    this._envvars[key] = new CfnOutput(this, key, {value: value})
  }
}

