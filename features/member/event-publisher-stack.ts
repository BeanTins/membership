
import { StackProps, Stack, Duration } from "aws-cdk-lib"
import { Construct } from "constructs"
import { Function, Runtime, StartingPosition } from "aws-cdk-lib/aws-lambda"
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs"
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources"
import * as path from "path"
import {Table} from "aws-cdk-lib/aws-dynamodb"
import {EventBus} from "aws-cdk-lib/aws-events"

interface EventPublisherStackProps extends StackProps {
  memberTable: Table;
  eventBusArn: string
}

export class EventPublisherStack extends Stack {

  public readonly lambda: Function

  constructor(scope: Construct, id: string, props: EventPublisherStackProps) {
    super(scope, id, props)

    this.lambda = new NodejsFunction(this, "EventPublisherFunction", {
      environment: {eventBusArn: props.eventBusArn, eventBusName: "MembershipDevEventBusDevEventBusdevC8CB83CB"},
      memorySize: 1024,
      timeout: Duration.seconds(5),
      runtime: Runtime.NODEJS_14_X,
      handler: "lambdaHandler",
      entry: path.join(__dirname, "event-publisher.ts"),
    })

    const source = new DynamoEventSource(props.memberTable, {
      startingPosition: StartingPosition.LATEST,
      batchSize: 1
    })
    this.lambda.addEventSource(source)

    const eventBus = EventBus.fromEventBusArn(this, "EventBus", props.eventBusArn)

    eventBus.grantPutEventsTo(this.lambda)
  }
} 

