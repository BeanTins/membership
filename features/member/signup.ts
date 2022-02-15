
import { APIGatewayEvent, Context, APIGatewayProxyResult } from "aws-lambda"
import { DataMapperFactory } from "./infrastructure/data-mapper-factory"
import { Member, InvalidMemberOperation } from "./domain/member"
import { InvalidName } from "./domain/name"
import { InvalidEmailAddress } from "./domain/email-address"
import { MemberDynamoDBRepository } from "./infrastructure/member-dynamodb-repository"
import { DataMapper } from "@aws/dynamodb-data-mapper"
import { MemberSnapshot } from "./infrastructure/member-snapshot"
import { HttpResponse } from "./infrastructure/http-response"
import logger from "./infrastructure/logger"

export const lambdaHandler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  var signupController: SignupController = new SignupController()

  return await signupController.signup(event.body)
}

export class SignupController {

  async signup(signupDTO: any) {
    var response: APIGatewayProxyResult

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
  private dynamoDBDataMapper: DataMapper

  public constructor() {
    this.repository = new MemberDynamoDBRepository()
    this.dynamoDBDataMapper = DataMapperFactory.create()
  }

  async handle(command: SignupCommand) {

    var member: Member|undefined = await this.loadMemberFromEmail(command.email)

    if (member == undefined)
    {
      member = Member.create(command.name, command.email)
    }

    member.signup()

    await this.repository.save(member)
  }

  private async loadMemberFromEmail(email: string): Promise<Member|undefined> {
    var member: Member|undefined = undefined
    const matchingItemIterator = this.dynamoDBDataMapper.query(MemberSnapshot, { email: email }, {indexName: "emailIndex"})

    for await (const matchingMember of matchingItemIterator)
    {
      member = matchingMember.toMember()
      break
    }

    return Promise.resolve(member)
  }
}

class InvalidSignupCommand extends Error {}

export class SignupCommand {
  name: string
  email: string
}
