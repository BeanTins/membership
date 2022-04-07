
import logger from "./component-test-logger"
import { StepDefinitions } from "jest-cucumber"
import { signupMember } from "./signup.client"
import {MemberTableAccessor} from "./member-table-accessor"
import {MemberCredentialsAccessor} from "./member-credentials-accessor"
import { EventListenerQueueClient, EventResponse } from "./event-listener-queue-client"
import { MemberActivatedEvent } from "../../domain/member"
import {resolveOutput} from "./output-resolver"

let name: string | null
let email: string | null
let failureResponse: string | undefined
let responseCode: number
let responseMessage: string
let memberCredentials: MemberCredentialsAccessor
let memberTable: MemberTableAccessor
let listenerQueue: EventListenerQueueClient

function getStage()
{
  let stage:string

  if (process.env.PipelineStage != undefined)
  {
    stage = process.env.PipelineStage 
  }
  else 
  {
    stage = "dev"
  }

  return stage
}

beforeAll(async()=> {

  configureProvisionedResources()

  memberCredentials = new MemberCredentialsAccessor("us-east-1")
  memberTable = new MemberTableAccessor("us-east-1")
  listenerQueue = new EventListenerQueueClient("us-east-1")
})

beforeEach(async () => {
  name = null
  email = null
  await memberCredentials.clear()
  await memberTable.clear()
})

export const MemberSteps: StepDefinitions = ({ given, and, when, then }) => {

  given(/a new prospective member (.+)$/, async (enteredName: string) => {
    name = enteredName
    email = generateEmailFromName(enteredName)
  })

  given(/a member (.+) with missing details$/, async (enteredName: string) => {
    name = enteredName
    failureResponse = "Invalid request body"
  })

  given(/a member (.+) with invalid details$/, async (enteredName: string) => {
    name = enteredName
    email = generateInvalidEmailFromName(enteredName)
    failureResponse = "invalid email: " + email
  })

  given(/an existing member (.+)$/, async (enteredName: string) => {
    name = enteredName
    email = enteredName.replace(/ /g, ".") + "@gmail.com" 
    await memberTable.addMember("123", name, email, "active")
  })
  
  when("they verify", async() => {
    logger.verbose("verify member " + name + " with email " + email)
    await memberCredentials.confirmUser(email!)
  })

  when("they signup", async() => {
    logger.verbose("signup member " + name + " with email " + email)
    let response = await signupMember(name, email, logger)
    if (response != null)
    {
      const responseMessageBody = JSON.parse(response.body)

      logger.verbose("responseCode - " + response.statusCode + ",message - " + responseMessageBody.message)
      responseCode = response.statusCode;
      responseMessage = responseMessageBody.message;
    }

    if (email != null)
    {
      await memberCredentials.addMember(email!, "passw0rd")
    }
  })

  then("their signup request is approved", () => {
    expect(responseCode).toBe(201)
    expect(responseMessage).toBe("member created")
  })

  then("their signup request is rejected as they are already a member", () => {
    expect(responseCode).toBe(409)
    expect(responseMessage).toBe("member already signed up")
  })

  then("they become an active member", async() => {

    const activeMemberEmail = memberTable.isActiveMember(email!)
    const memberActivatedEvent = retrievePostedMemberActivatedEvent()

    await expect(activeMemberEmail).resolves.toBe(true)

    expect((await memberActivatedEvent).email).toBe(email)
  })

  then("they are an inactive member", async() => {
    await expect(memberTable.isActiveMember(email!)).resolves.not.toBe(true)
  })

  then("their signup request is rejected", () => {
    expect(responseCode).toBe(400)
    
    expect(responseMessage).toBe(failureResponse)
  })

  then("they are not signed up", () => {
  })

}

function configureStageEnvVar(envVarBaseName: string) {
  const envVarName = envVarBaseName + getStage()

  if (process.env[envVarName] == undefined) {
    process.env[envVarBaseName] = resolveOutput(envVarName)
  }
  else {
    process.env[envVarBaseName] = process.env[envVarName]
  }

}

function configureProvisionedResources() {

  if (process.env.MemberSignupEndpoint == undefined) {
    process.env.MemberSignupEndpoint = resolveOutput("MemberSignupEndpoint")
  }
  if (process.env.MemberTable == undefined) {
    process.env.MemberTable = resolveOutput("MemberTable")
  }

  configureStageEnvVar("TestListenerQueueName")
  configureStageEnvVar("userPoolId")
  configureStageEnvVar("userPoolClientId")
}

function generateEmailFromName(enteredName: string): string {
  return enteredName.replace(/ /g, ".") + "@gmail.com"
}

function generateInvalidEmailFromName(enteredName: string): string {
  return enteredName.replace(/ /g, ".") + "@gmail"
}

async function retrievePostedMemberActivatedEvent(): Promise<MemberActivatedEvent>
{
  let response: EventResponse|undefined = await listenerQueue.popEvent()

  expect(response?.type).toBe("MemberActivatedEvent")
  return response!.data as MemberActivatedEvent
}


