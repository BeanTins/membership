import { Stage, Construct, Stack, CfnOutput } from "@aws-cdk/core"
import { StageFactory } from "../../stage-factory"
import { DeploymentStage } from "../../deployment-stage"
import { Bucket } from "@aws-cdk/aws-s3"

export class TestStageFactory implements StageFactory {

  private _createdStacks: string[] = new Array()

  public get createdStacks(){
    return this._createdStacks
  }

  public create(scope: Construct, name: string): DeploymentStage {
    this.createdStacks.push(name)

    return new TestStage(scope, name)
  }
}

class TestStage extends Stage {
  private testEnvvars: CfnOutput
  get envvars(): Record<string, CfnOutput> {return {testFunction: this.testEnvvars} }
  constructor(scope: Construct, id: string) {
    super(scope, id)
    const testStack = new TestStack(this, "TestStack")
    this.testEnvvars = testStack.bucketName
  }
  grantAccessTo(iamRole: string){}
}

class TestStack extends Stack {
  private _bucketName: CfnOutput
  get bucketName(): CfnOutput {return this._bucketName}
  constructor(scope: Construct, id: string) {
    super(scope, id)
    const bucket = new Bucket(this, "TestBucket", {})
    
    this._bucketName = new CfnOutput(this, 'bucketName', {
      value: bucket.bucketName
    })
  }
}




