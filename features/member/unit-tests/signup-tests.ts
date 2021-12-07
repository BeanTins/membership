

import { lambdaHandler } from "../signup"
import { APIGatewayEvent, Context,APIGatewayProxyResult  } from "aws-lambda"

var event: APIGatewayEvent, context: Context

test("signup successful for new user", async () => {
    const result:APIGatewayProxyResult  = await lambdaHandler(event, context)
  
    expect(result.statusCode).toBe(201)
})

