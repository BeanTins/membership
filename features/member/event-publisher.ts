import { Context, DynamoDBStreamEvent } from "aws-lambda"
import { Status, MemberActivatedEvent } from "./domain/member"
import { MemberSnapshot } from "./infrastructure/member-snapshot"
import { unmarshall } from "@aws-sdk/util-dynamodb"
import { EventBridge, config } from "aws-sdk"
import { AttributeValue} from "aws-sdk/clients/dynamodb"

//config.region = process.env.AWS_REGION || 'us-east-1'

export const lambdaHandler = async (event: DynamoDBStreamEvent, context: Context): Promise<any> => {
  
  const record = event.Records[0];
  const {
    // @ts-ignore
    dynamodb: { NewImage, OldImage },
    eventName,
  } = record

  if (eventName == "MODIFY")
  {
    var oldMember: MemberSnapshot = resolveSnapshot(OldImage)
    var newMember: MemberSnapshot = resolveSnapshot(NewImage)

    if ((oldMember.status == Status.PendingVerification) &&
        (newMember.status == Status.Active))
    {
      const event = new MemberActivatedEvent(newMember.email, newMember.id)

      const eventbridge = new EventBridge()

      const params = {
      Entries: [
        {
          Detail: JSON.stringify(event),
          DetailType: event.constructor.name,
          EventBusName: process.env.eventBusName,
          Source: "membership.beantins.com",
        },
      ]
      }

      const result = await eventbridge.putEvents(params).promise()     
    }
  }
}

function resolveSnapshot(image: any)
{
  const unmarshalledImage = unmarshall(
    image as {
      [key: string]: AttributeValue
    }
  )

  return <MemberSnapshot>unmarshalledImage

}

