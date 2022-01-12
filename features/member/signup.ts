
import { APIGatewayEvent, Context, APIGatewayProxyResult } from "aws-lambda"

export const lambdaHandler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => { 
  var signupController: SignupController = new SignupController()

  return signupController.signup(event.body)
}

export class SignupController {

  signup(signupDTO: any) {
    var statusCode: number
    var message: string

    try {
      const signupCommand = this.parseCommand(signupDTO)

      statusCode = 201
      message = "member created"
    } 
    catch (error) {
        if (error instanceof InvalidSignupCommand)
        {
          statusCode = 400
          message = error.message
        }
        else
        {
          statusCode = 500
          message = "member signup failed"
        }
    }

    return {
      statusCode: statusCode,
      body: JSON.stringify({
        message: message
      })
    }
  }

  parseCommand(serialisedObject: string | null): SignupCommand {
    if (serialisedObject == null) {
      throw new InvalidSignupCommand("no command specified for signup")
    }

    const command = JSON.parse(serialisedObject)
    if (command.name == null) {
      throw new InvalidSignupCommand("no name specified for signup")
    }

    if (command.email == null) {
      throw new InvalidSignupCommand("no email specified for signup")
    }
      
    return command
  }

}

class InvalidSignupCommand extends Error {}

export class SignupCommand {
  name: string
  email: string
}

