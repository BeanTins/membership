import {Stack, StackProps, Construct, CfnOutput, Duration} from "@aws-cdk/core"
import {EventBus, Rule } from "@aws-cdk/aws-events"
import {SqsQueue} from "@aws-cdk/aws-events-targets"
import {Queue} from "@aws-cdk/aws-sqs"

interface EventBusProps extends StackProps {
  stageName: string
}

export class MembershipEventBus extends Stack {
  public readonly Arn: string
  private eventBus: EventBus
  constructor(scope: Construct, id: string, props: EventBusProps) {
    super(scope, id, props)

    this.eventBus = new EventBus(this, "EventBus" + props.stageName)

    this.Arn = this.eventBus.eventBusArn
    new CfnOutput(this, "EventBusArn" + props.stageName, {
      value: this.eventBus.eventBusArn,
    })
  }

  listenOnQueueFor(queueArn: string){

    const queue = Queue.fromQueueArn(this, "listenerQueue", queueArn)

   
    new Rule(this, "ListenerQueueRule", {
      eventBus: this.eventBus,
      eventPattern: {detailType: ["MemberActivatedEvent"]},
      targets: [new SqsQueue(queue)]
    })
  }
}
