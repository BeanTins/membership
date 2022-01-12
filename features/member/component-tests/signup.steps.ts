
import logger from "./logger"

import { StepDefinitions } from "jest-cucumber"
import { signupMember } from "./signup.client"

let name: string | null
let email: string | null
let responseCode: number
let responseMessage: string

beforeEach(() => {
  name = null
  email = null
});

export const SignupSteps: StepDefinitions = ({ given, and, when, then }) => {

  given("I am not registered", () => {
    
  })

  when(/I enter my name as (\w+)/, (enteredName: string) => {
    name = enteredName
  })
  
  when(/I enter my email as \"([\w@.]+)\"/, (enteredEmail: string) => {
    email = enteredEmail
  })
  
  when("I signup", async () => {
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
  
  then(/I receive a (\d+) response code/,  expectedResponseCode => {
    expect(responseCode).toBe(Number(expectedResponseCode));
  })

  then(/I receive the message "(.+)"/,  expectedResponseMessage => {
    expect(responseMessage).toBe(expectedResponseMessage);
  })
}

