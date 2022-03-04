import { lambdaHandler } from "../verify"
import { Context, PostConfirmationConfirmSignUpTriggerEvent, BasePostConfirmationTriggerEvent } from "aws-lambda"
import { DataMapperFactory } from "../infrastructure/data-mapper-factory"
import { MembersDataMapperMock} from "./helpers/members-data-mapper-mock"
import { Status } from "../domain/member"
import logger from "../infrastructure/logger"

let membersDataMapper: MembersDataMapperMock
let event: PostConfirmationConfirmSignUpTriggerEvent, context: Context

const mockUUid = jest.fn()
jest.mock('uuid', () => ({ v4: () => mockUUid() }))

beforeEach(() => {
  jest.clearAllMocks()
  DataMapperFactory.create = membersDataMapper.map()
  membersDataMapper.queryResponse([])
})

test("verify activates member", async () => {
  signupMember("bob", "bob@gmail.com", Status.PendingVerification, "456")
  confirmMember("bob@gmail.com")

  await lambdaHandler(event, context)

  expect(membersDataMapper.put).toBeCalledWith(
    expect.objectContaining({
      email: "bob@gmail.com",
      name: "bob",
      id: "456",
      status: "active"
    })
  )
})

test("verify failure logged when member unknown", async () => {
  const loggerVerboseSpy = jest.spyOn(logger, "verbose")
  membersDataMapper.queryResponse([])
  confirmMember("bob@gmail.com")

  await lambdaHandler(event, context)

  expect(loggerVerboseSpy).lastCalledWith("trying to verify unknown member: bob@gmail.com")
})

function confirmMember(email: string){
  event = {
    userName: email,
    version: "",
    region: "",
    userPoolId: "",
    triggerSource: "PostConfirmation_ConfirmSignUp",
    callerContext: {
      awsSdkVersion: "",
      clientId: ""
    },
    request: {userAttributes: {}},
    response: {}
  } 
}

function signupMember(name: string, email: string, status: Status, id: string){
  membersDataMapper.queryResponse([
    {name: name, 
     email: email, 
     status: status, 
     id: id}])
}


