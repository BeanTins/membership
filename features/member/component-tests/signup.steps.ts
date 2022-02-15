
import logger from "./logger"
import { StepDefinitions } from "jest-cucumber"
import { signupMember } from "./signup.client"
import {MemberTableSetup} from "./member-table-setup"

let name: string | null
let email: string | null
let responseCode: number
let responseMessage: string

beforeEach(async () => {
  name = null
  email = null
  await MemberTableSetup.clear()
})

export const SignupSteps: StepDefinitions = ({ given, and, when, then }) => {

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
    await MemberTableSetup.addMember("123", name, email, "active")
  })

  when("they try to signup", async() => {
    logger.verbose("signup member " + name + " with email " + email)
    let response = await signupMember(name, email)
    if (response != null)
    {
      const responseMessageBody = JSON.parse(response.body)

      logger.verbose("responseCode - " + response.statusCode + ",message - " + responseMessageBody.message)
      responseCode = response.statusCode;
      responseMessage = responseMessageBody.message;
    }
  })

  then("they are confirmed as a new member", () => {
    expect(responseCode).toBe(201)
    expect(responseMessage).toBe("member created")
  })

  then("their signup request is rejected as they are already a member", () => {
    expect(responseCode).toBe(409)
    expect(responseMessage).toBe("member already signed up")
  })

  then("their signup request is rejected as it was invalid", () => {
    expect(responseCode).toBe(400)
    expect(responseMessage).toBe("no email specified for signup")
  })
}

function generateEmailFromName(enteredName: string): string | null {
  return enteredName.replace(/ /g, ".") + "@gmail.com"
}

