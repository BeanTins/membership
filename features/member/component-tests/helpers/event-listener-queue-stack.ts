import { Queue } from "@aws-cdk/aws-sqs"
import { Stack, App, StackProps, CfnOutput, Duration} from "@aws-cdk/core"
import {ServicePrincipal} from "@aws-cdk/aws-iam"

interface EventListenerQueueProps extends StackProps {
  stageName: string
}

export class EventListenerQueueStack extends Stack {
  public readonly queue: Queue
  constructor(scope: App, id: string, props: EventListenerQueueProps) {
    super(scope, id, props)

    this.queue = new Queue(this, "TestListenerQueue" + props.stageName, {retentionPeriod: Duration.hours(1)});

    this.queue.grantSendMessages(new ServicePrincipal("events.amazonaws.com"))

    const testListenerQueueName = "testListenerQueueName" + props.stageName

    new CfnOutput(this, testListenerQueueName, {
      value: this.queue.queueName,
      exportName: testListenerQueueName, 
      description: 'name of the queue used during testing for listening to events'
    })

    const testListenerQueueArn = "testListenerQueueArn" + props.stageName

    new CfnOutput(this, testListenerQueueArn, {
      value: this.queue.queueArn,
      exportName: testListenerQueueArn, 
      description: 'ARN of the queue used during testing for listening to events'
    })

  }
}