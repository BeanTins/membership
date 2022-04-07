import {DocumentClient} from "aws-sdk/clients/dynamodb"
import {Status} from "../../domain/member"
import logger from "./component-test-logger"

export class MemberTableAccessor {
  
  private dynamoDB: DocumentClient
  private memberTableName: string

  constructor(region: string)
  {
    this.dynamoDB = new DocumentClient({region: region})
    this.memberTableName = process.env.MemberTable!
  }

  async clear()
  {
    const queryTableName = {
        TableName: this.memberTableName
    }
    
    const items =  await this.dynamoDB.scan(queryTableName).promise()
    const tableName = this.memberTableName
    const dynamoDB = this.dynamoDB
  
    if (items.Items) {
      for await (const item of items.Items){
  
          var memberRecord = {
              TableName: tableName,
              Key: {"id": item["id"]}
          };
  
          logger.verbose("Clearing member - " + JSON.stringify(memberRecord))
          
          try
          {
              await dynamoDB.delete(memberRecord).promise()
          }
          catch(error)
          {
            logger.error("Failed to clear record from " + tableName + " - " + error)
          }
      }
    }
  } 

  async addMember(id: string, name: string, email: string, status: string)
  {
    const items =  await this.dynamoDB.put({
        TableName: this.memberTableName,
        Item: {
          'id' : id,
          'name' : name,
          "email" : email,
          "status" : status
        }
      }).promise()
  }

  async isActiveMember(email: String): Promise<boolean>
  {
    var params = {
      IndexName: "emailIndex",
      KeyConditionExpression: "#email = :email",
      ExpressionAttributeValues: { ":email": email},
      ExpressionAttributeNames: {"#email": "email"},
      TableName: this.memberTableName
    }
    let activeMember = false
    try{
        let result = await this.dynamoDB.query(params).promise()
        logger.verbose("active member querey result - " + result)
        if((result.Count != null) && result.Count > 0)
        {
          const item = result.Items![0]
          if(item.status == Status.Active)
          {
            activeMember = true
          }
        }
    }
    catch(err){
      logger.error(err)
    }
 
    return (activeMember)
  }

}

