import { SignupStack } from "../features/member/signup-stack"
import { VerifyStack } from "../features/member/verify-stack"
import { EventPublisherStack } from "../features/member/event-publisher-stack"
import { MembershipEventBus } from "./event-bus"
import { MemberTable } from "./member-table"
import { DeploymentStage } from "./pipeline-builder/deployment-stage"
import { CfnOutput, StageProps, Stage } from "aws-cdk-lib"
import { Construct } from "constructs"

interface MembershipStageProps extends StageProps{
  stageName: string
  userPoolId: string
  eventListenerQueueArn: string|undefined
}

export class MembershipStage extends Stage implements DeploymentStage{
  private signup: SignupStack
  private verify: VerifyStack
  private eventPublisher: EventPublisherStack
  private eventBus: MembershipEventBus
  private memberTable: MemberTable
  get envvars(): Record<string, CfnOutput> {
    return {...this.memberTable.envvars, ...this.signup.envvars}
  }
  
  constructor(scope: Construct, id: string, props: MembershipStageProps) {
    super(scope, id, props)

    this.memberTable = new MemberTable(this, "Members", {postfixIdentifier: props.stageName})
    
    this.signup = new SignupStack(this, "MemberSignup", {memberTable: this.memberTable.name, stageName: props.stageName})
    this.verify = new VerifyStack(this, "MemberVerify", 
    {memberTable: this.memberTable.name,
     userPoolId: props.userPoolId})

    this.eventBus = new MembershipEventBus(this, "EventBusDev", {
      stageName: props.stageName 
    })

    if (props.eventListenerQueueArn != undefined)
    {
      this.eventBus.listenOnQueueFor(props.eventListenerQueueArn)
    }

    this.eventPublisher = new EventPublisherStack(this, "MemberEventPublisher", 
    {memberTable: this.memberTable.memberTable,
    eventBusArn: this.eventBus.Arn})
    
    this.memberTable.grantAccessTo(this.signup.lambda.grantPrincipal)
    this.memberTable.grantAccessTo(this.verify.lambda.grantPrincipal)
  }

}

