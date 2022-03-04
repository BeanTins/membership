import { Context, PostConfirmationConfirmSignUpTriggerEvent } from "aws-lambda"
import { Member } from "./domain/member"
import { MemberDynamoDBRepository } from "./infrastructure/member-dynamodb-repository"
import { MemberQuery} from "./infrastructure/member-query"
import logger from "./infrastructure/logger"

export const lambdaHandler = async (event: PostConfirmationConfirmSignUpTriggerEvent, context: Context): Promise<any> => {
  var handler: VerifyCommandHandler = new VerifyCommandHandler()
  
  try{
    const command = new VerifyCommand(event.userName)
    await handler.handle(command)
  }
  catch(error)
  {
    logger.error((error as Error).message)
  }
  return event
}

export class VerifyCommandHandler {

  private repository: MemberDynamoDBRepository
  private memberQuery: MemberQuery

  public constructor() {
    this.repository = new MemberDynamoDBRepository()
    this.memberQuery = new MemberQuery()
  }

  async handle(command: VerifyCommand) {

    var member: Member|undefined = await this.memberQuery.withEmail(command.email)

    if (member == undefined)
    {
      throw new UnknownMemberVerify("trying to verify unknown member: " + command.email)
    }

    member.verify()

    await this.repository.save(member)
  }
}

class UnknownMemberVerify extends Error {}

export class VerifyCommand {
   email: string

   constructor(email: string){
     this.email = email
   }
}
