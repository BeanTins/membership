import AWS from "aws-sdk"

export class StageParameters {
  private ssm: AWS.SSM

  constructor(region: string){
    this.ssm = new AWS.SSM({region: region})
  }

  async retrieve(name: string): Promise<string>
  {
    return await this.retrieveFromStage(name, this.getStage())
  }

  async retrieveFromStage(name: string, stage: string): Promise<string>
  {
    const parameterName = this.buildStageParameterName(name, stage)
    var options = {
      Name: parameterName,
      WithDecryption: false
    }

    const result = await this.ssm.getParameter(options).promise()

    return result.Parameter!.Value!
  }

  buildStageParameterName(name: string, stage: string): string
  {
    return name + "_" + stage
  }

  private getStage() {
    let stage = process.env["PipelineStage"]

    if (stage == undefined) {
      stage = "dev"
    }
    return stage
  }

}