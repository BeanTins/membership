
import { APIGatewayEvent, Context, APIGatewayProxyResult } from "aws-lambda"
import { Member, InvalidMemberOperation } from "./domain/member"
import { InvalidName } from "./domain/name"
import { InvalidEmailAddress } from "./domain/email-address"
import { MemberDynamoDBRepository } from "./infrastructure/member-dynamodb-repository"
import { MemberQuery} from "./infrastructure/member-query"
import { HttpResponse } from "./infrastructure/http-response"
import logger from "./infrastructure/logger"
import { OpenAPISpecBuilder, HttpMethod} from "../../infrastructure/open-api-spec"

export const specBuilder = function() { 

  const specBuilder = new OpenAPISpecBuilder("3.0.0")

  specBuilder.describedAs("member signup", "allows signup of a new member to the BeanTins service", "1.9.0")
  const endpoint = specBuilder.withEndpoint("/member/signup", HttpMethod.Post)

  endpoint.withRequestBodyStringProperty({name: "email", required: true})
  endpoint.withRequestBodyStringProperty({name: "name", minLength: 2, maxLength: 256, required: true})

  endpoint.withResponse("201", "member created")
  endpoint.withResponse("400", "member not created due to invalid request")
  endpoint.withResponse("409", "member already signed up")

  return specBuilder
}()

export const lambdaHandler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  var signupController: SignupController = new SignupController()

  return await signupController.signup(event.body)
}

export class SignupController {

  async signup(signupDTO: any) {
    var response: any

    try {
      const command = JSON.parse(signupDTO)

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
