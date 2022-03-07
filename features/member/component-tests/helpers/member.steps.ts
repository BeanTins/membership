
import logger from "./component-test-logger"
import { StepDefinitions } from "jest-cucumber"
import { signupMember } from "./signup.client"
import {MemberTableAccessor} from "./member-table-accessor"
import {MemberCredentialsAccessor} from "./member-credentials-accessor"

let name: string | null
let email: string | null
let responseCode: number
let responseMessage: string
let memberCredentials: MemberCredentialsAccessor
let memberTable: MemberTableAccessor

beforeAll(async()=> {
  memberCredentials = new MemberCredentialsAccessor("us-east-1")
  memberTable = new MemberTableAccessor()
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

  given(/a member (.+) with invalid details$/, async (enteredName: string) => {
    name = enteredName
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
    await expect(memberTable.isActiveMember(email!)).resolves.toBe(true)
  })

  then("their signup request is rejected as it was invalid", () => {
    expect(responseCode).toBe(400)
    expect(responseMessage).toBe("no email specified for signup")
  })

  then("they are not signed up", () => {
  })

}

function generateEmailFromName(enteredName: string): string {
  return enteredName.replace(/ /g, ".") + "@gmail.com"
}

