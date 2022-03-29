import { lambdaHandler } from "../event-publisher"
import { Context, DynamoDBStreamEvent } from "aws-lambda"
import { EventBridge } from "aws-sdk"

let event: DynamoDBStreamEvent, context: Context

const mockPutEventPromise = jest.fn()
const mocKPutEvent = jest.fn().mockImplementation(() => {
  return {promise: mockPutEventPromise}
});

jest.mock('aws-sdk', () => {
  return {EventBridge: jest.fn().mockImplementation(() => {
      return {putEvents: mocKPutEvent}})
    }
  })

test("event is sent", async () => {
  memberIsActivatedChangeOccurs("bob", "bob@gmail.com", "1213")

  await lambdaHandler(event, context)

  expectSentEventToContain({Detail: JSON.stringify({
    email: "bob@gmail.com",
    id: "1213"
  })})
})

test("event type is sent", async () => {
  memberIsActivatedChangeOccurs("bob", "bob@gmail.com", "1213")

  await lambdaHandler(event, context)

  expectSentEventToContain({
    DetailType: "MemberActivatedEvent",
  })
})

test("event bus name is sent", async () => {
  memberIsActivatedChangeOccurs("bob", "bob@gmail.com", "1213")
  process.env.eventBusName = "testEventBus"

  await lambdaHandler(event, context)

  expectSentEventToContain({
    EventBusName: "testEventBus",
  })
})

test("source is sent", async () => {
  memberIsActivatedChangeOccurs("bob", "bob@gmail.com", "1213")
  process.env.eventBusName = "testEventBus"

  await lambdaHandler(event, context)

  expectSentEventToContain({
    Source: "membership.beantins.com",
  })
})

function memberIsActivatedChangeOccurs(name: string, email: string, id: string){
  event = 
   {Records: [{
    eventName: "MODIFY",
    dynamodb: {
      NewImage: {
        name: {
          S: name
        },
        id: {
          S: id
        },
        email: {
          S: email
        },
        status: {
          S: "active"
        }
      },
      OldImage: {
        name: {
          S: name
        },
        id: {
          S: id
        },
        email: {
          S: email
        },
        status: {
          S: "pendingverification"
        }
      }
    }
  }]
  }
}

function expectSentEventToContain(matchingContent: any)
{
  expect(mocKPutEvent).toBeCalledWith(
    expect.objectContaining({
      Entries:expect.arrayContaining([
          expect.objectContaining(matchingContent)
      ])
    })
  )
}
