import  { SQSClient, 
  
  ReceiveMessageCommand, 
  GetQueueUrlCommand, 
  ReceiveMessageResult,
  DeleteMessageCommand } from "@aws-sdk/client-sqs"
import logger from "./component-test-logger"

export interface EventResponse
{
  type: string
  data: object
}

export class EventListenerQueueClient {
  public readonly sqsClient: SQSClient
  private url: string
  constructor(region: string) {
    this.sqsClient = new SQSClient({ region: region })
  }

  async getUrl()
  {
    if (this.url == undefined)
    {
      const input = {
        QueueName: process.env.testQueueName
      }
  
      try {
  
        const command = new GetQueueUrlCommand(input)
        const response = await this.sqsClient.send(command)
    
        logger.verbose("event listener queue url response - " + JSON.stringify(response))
        this.url = response.QueueUrl!
      }
      catch(error)
      {
        logger.error("Failed to get event listener queue url -  " + error)
        throw error
      }
    }

    return this.url
  }

  async popEvent(): Promise<EventResponse|undefined>
  {
    let event: EventResponse|undefined
    const url = await this.getUrl()

    try {
      const params = {
        QueueUrl: url,
        WaitTimeSeconds: 10
      }   
    
      const command = new ReceiveMessageCommand(params)
      const response: ReceiveMessageResult = await this.sqsClient.send(command)
  
      logger.verbose("event listener queue response - " + JSON.stringify(response))

      if (response.Messages != undefined && response.Messages.length > 0)
      {
        const message = response.Messages[0]

        const body = message.Body!

        const bodyObject = JSON.parse(body)

        event = {type: bodyObject["detail-type"],
                 data: bodyObject["detail"]}

        await this.deleteMessage(message.ReceiptHandle!)
      }
    }
    catch(error)
    {
      logger.error("Failed to receive event -  " + error)
      throw error
    }

    return event
  }

  async deleteMessage(receiptHandle: string)
  {
    const url = await this.getUrl()

    try {
      const params = {
        QueueUrl: url,
        ReceiptHandle: receiptHandle
      }   
  
      const command = new DeleteMessageCommand(params)

      const response = await this.sqsClient.send(command)

      logger.verbose("event listener delete message response - " + JSON.stringify(response))
    }
    catch(error)
    {
      logger.error("Failed to delete message -  " + error)
      throw error
    }

    return event
  }  
}