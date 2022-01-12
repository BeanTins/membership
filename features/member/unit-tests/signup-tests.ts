

import { lambdaHandler } from "../signup"
import { APIGatewayEvent, Context,APIGatewayProxyResult } from "aws-lambda"

var event: APIGatewayEvent, context: Context

test("signup successful for new user", async () => {
    event = {
      body: JSON.stringify(
      {  
        name: "Bob",    
        email: "bob@gmail.com"
      })
    } as APIGatewayEvent
  
    const result:APIGatewayProxyResult  = await lambdaHandler(event, context)
  
    expect(result.statusCode).toBe(201)
})

test("signup fails when command is undefined", async () => {

    event = {
    } as APIGatewayEvent

    const result:APIGatewayProxyResult  = await lambdaHandler(event, context)
  
    expect(result.statusCode).toBe(400)
    expect(result.body).toBe(JSON.stringify({message: "no command specified for signup"}))
})

test("signup fails when name is undefined", async () => {

    event = {
      body: JSON.stringify(
      {  
        email: "bob@gmail.com"
      })
    } as APIGatewayEvent

    const result:APIGatewayProxyResult  = await lambdaHandler(event, context)
  
    expect(result.statusCode).toBe(400)
    expect(result.body).toBe(JSON.stringify({message: "no name specified for signup"}))
})

test("signup fails when email is undefined", async () => {

    event = {
      body: JSON.stringify(
      {  
        name: "bob"
      })
    } as APIGatewayEvent

    const result:APIGatewayProxyResult  = await lambdaHandler(event, context)
  
    expect(result.statusCode).toBe(400)
    expect(result.body).toBe(JSON.stringify({message: "no email specified for signup"}))
})

