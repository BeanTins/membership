
import { APIGatewayEvent, Context, APIGatewayProxyResult } from "aws-lambda"
import { Member, InvalidMemberOperation } from "./domain/member"
import { InvalidName } from "./domain/name"
import { InvalidEmailAddress } from "./domain/email-address"
import { MemberDynamoDBRepository } from "./infrastructure/member-dynamodb-repository"
import { MemberQuery} from "./infrastructure/member-query"
import { HttpResponse } from "./infrastructure/http-response"
import logger from "./infrastructure/logger"

export const lambdaHandler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  var signupController: SignupController = new SignupController()

  return await signupController.signup(event.body)
}

export class SignupController {

  async signup(signupDTO: any) {
    var response: any

    try {
      const command = this.parseCommand(signupDTO)

      const commandHandler = new SignupCommandHandler()

      await commandHandler.handle(command)

      response = HttpResponse.created("member")
    }
    catch (error) {

      const statusCodeMap = new Map<any, number>([
        [InvalidSignupCommand, 400],
        [InvalidName, 400],
        [InvalidEmailAddress, 400],
        [InvalidMemberOperation, 409]
      ])

      logger.error(error)

      response = HttpResponse.error(error, statusCodeMap)
    }

    return response
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

export class SignupCommandHandler {

  private repository: MemberDynamoDBRepository
  private memberQuery: MemberQuery

  public constructor() {
    this.repository = new MemberDynamoDBRepository()
    this.memberQuery = new MemberQuery()
  }

  async handle(command: SignupCommand) {

    var member: Member|undefined = await this.memberQuery.withEmail(command.email)

    if (member == undefined)
    {
      member = Member.create(command.name, command.email)
    }

    member.signup()

    await this.repository.save(member)
  }
}

class InvalidSignupCommand extends Error {}

export class SignupCommand {
  name: string
  email: string
}
