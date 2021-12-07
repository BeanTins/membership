
import { APIGatewayEvent, Context, APIGatewayProxyResult } from "aws-lambda"

export const lambdaHandler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => { 

    var statusCode: number
    var body: string

    try {
        statusCode = 201
        body = "member created"
    } catch (err) {
        statusCode = 500
        body = "member signup failed"
        console.log(err);
    }

    return {
        statusCode: statusCode,
        body: body
    }
};
