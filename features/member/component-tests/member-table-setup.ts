
import logger from "./logger"
import {resolveOutput} from "./output-resolver"
import {DocumentClient} from "aws-sdk/clients/dynamodb"

let name: string | null
let email: string | null
let responseCode: number
let responseMessage: string

export class MemberTableSetup {
  
  static async clear()
  {
    const memberTableName = resolveOutput("MembershipDevStage-MemberTable", "MemberTable")
    const queryTableName = {
        TableName: memberTableName
    }
    var dynamoDB = new DocumentClient({region: "us-east-1"})
    const items =  await dynamoDB.scan(queryTableName).promise()
  
    if (items.Items) {
      items.Items.forEach(async function(item) {
  
          var memberRecord = {
              TableName: memberTableName,
              Key: {"id": item["id"]}
          };
  
          logger.verbose("Clearing member - " + JSON.stringify(memberRecord))
          
          try
          {
              await dynamoDB.delete(memberRecord).promise()
          }
          catch(error)
          {
              logger.error("Failed to clear record from " + memberTableName + " - " + error)
          }
      })
    }
  } 

  static async addMember(id: string, name: string, email: string, status: string)
  {
    const memberTableName = resolveOutput("MembershipDevStage-MemberTable", "MemberTable")
    var dynamoDB = new DocumentClient({region: "us-east-1"})
    const items =  await dynamoDB.put({
        TableName: memberTableName,
        Item: {
          'id' : id,
          'name' : name,
          "email" : email,
          "status" : status
        }
      }).promise()
  }
}

