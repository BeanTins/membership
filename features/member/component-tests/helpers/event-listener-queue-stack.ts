import { Queue } from "aws-cdk-lib/aws-sqs"
import { Stack, App, StackProps, CfnOutput, Duration} from "aws-cdk-lib"
import {ServicePrincipal} from "aws-cdk-lib/aws-iam"

interface EventListenerQueueProps extends StackProps {
  stageName: string
}

export class EventListenerQueueStack extends Stack {
  public readonly queue: Queue
  constructor(scope: App, id: string, props: EventListenerQueueProps) {
    super(scope, id, props)

    this.queue = new Queue(this, "TestListenerQueue" + props.stageName, {retentionPeriod: Duration.hours(1)});

    this.queue.grantSendMessages(new ServicePrincipal("events.amazonaws.com"))

    new CfnOutput(this, "TestListenerQueueName", {
      value: this.queue.queueName,
      exportName: "TestListenerQueueName", 
      description: 'name of the queue used during testing for listening to events'
    })

    new CfnOutput(this, "TestListenerQueueArn", {
      value: this.queue.queueArn,
      exportName: "TestListenerQueueArn", 
      description: 'ARN of the queue used during testing for listening to events'
    })

  }
}