import { Stage, Construct, Stack } from "@aws-cdk/core"
import { StageFactory } from "../../stage-factory"
import { Bucket } from "@aws-cdk/aws-s3"

export class TestStageFactory implements StageFactory {

  private _createdStacks: string[] = new Array()

  public get createdStacks(){
    return this._createdStacks
  }

  public create(scope: Construct, name: string): Stage {
    this.createdStacks.push(name)

    return new TestStage(scope, name)
  }
}

class TestStage extends Stage {

  constructor(scope: Construct, id: string) {
    super(scope, id)
    new TestStack(this, "TestStack")
  }
}

class TestStack extends Stack {
    
  constructor(scope: Construct, id: string) {
    super(scope, id)
    new Bucket(this, "TestBucket", {})
  }
}




