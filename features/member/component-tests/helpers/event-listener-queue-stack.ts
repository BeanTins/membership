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

    const queueName = "TestListenerQueueName" + props.stageName

    new CfnOutput(this, queueName, {
      value: this.queue.queueName,
      exportName: queueName, 
      description: 'name of the queue used during testing for listening to events'
    })

    const queueArn = "TestListenerQueueArn" + props.stageName

    new CfnOutput(this, queueArn, {
      value: this.queue.queueArn,
      exportName: queueArn, 
      description: 'ARN of the queue used during testing for listening to events'
    })

  }
}