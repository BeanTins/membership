

import { lambdaHandler } from "../signup"
import { APIGatewayEvent, Context,APIGatewayProxyResult } from "aws-lambda"
import { DataMapperFactory } from "../../member/infrastructure/data-mapper-factory"
import { MemberSnapshot } from "../infrastructure/member-snapshot"
import { Status } from "../domain/member"

const mockUUid = jest.fn()

jest.mock('uuid', () => ({ v4: () => mockUUid() }))

const mockDataMapperPut = jest.fn()
const mockDataMapperQuery = jest.fn()

var event: APIGatewayEvent, context: Context

beforeEach(() => {
  jest.clearAllMocks()
  DataMapperFactory.create = jest.fn().mockImplementation(() => {
    return {
      put: (item: any) => mockDataMapperPut(item),
      query: () => mockDataMapperQuery()
    }
  })

  mockDataMapperQueryResponse([])
})

test("signup successful for new user", async () => {
  requestSignupOf("Bob", "bob@gmail.com")

  const result:APIGatewayProxyResult  = await lambdaHandler(event, context)

  expect(result.statusCode).toBe(201)
  expect(result.body).toBe(JSON.stringify({message: "member created"}))
})

test("signup successful for user that has already initiated signup", async () => {
  mockDataMapperQueryResponse([
    buildSnapshot("Bob", "bob@gmail.com", Status.PendingVerification, "123e4567-e89b-12d3-a456-426614174000")])

  requestSignupOf("Bob", "bob@gmail.com")

  const result:APIGatewayProxyResult  = await lambdaHandler(event, context)

  expect(result.statusCode).toBe(201)
  expect(result.body).toBe(JSON.stringify({message: "member created"}))
})

test("signup fails when command is undefined", async () => {

    event = {} as APIGatewayEvent

    const result:APIGatewayProxyResult  = await lambdaHandler(event, context)
  
    expect(result.statusCode).toBe(400)
    expect(result.body).toBe(JSON.stringify({message: "no command specified for signup"}))
})

test("signup fails when name is undefined", async () => {

  requestSignupOf(null, "bob@gmail.com")

  const result:APIGatewayProxyResult  = await lambdaHandler(event, context)

  expect(result.statusCode).toBe(400)
  expect(result.body).toBe(JSON.stringify({message: "no name specified for signup"}))
})

function veryLongName(){
  return "bob".padStart(257, "b")
}

test.each([["a", "name too short: \"a\""],
           [veryLongName(), "name too long: \"" + veryLongName() + "\""]])
("signup fails with invalid name %s", async (name, errorMessage) => {

  requestSignupOf(name, "bob@gmail.com")

  const result:APIGatewayProxyResult  = await lambdaHandler(event, context)

  expect(result.statusCode).toBe(400)
  expect(result.body).toBe(JSON.stringify({message: errorMessage}))
})

test("signup fails when email is undefined", async () => {

  requestSignupOf("bob", null)

  const result:APIGatewayProxyResult  = await lambdaHandler(event, context)

  expect(result.statusCode).toBe(400)
  expect(result.body).toBe(JSON.stringify({message: "no email specified for signup"}))
})

test.each([["@gmail.com", "invalid email: @gmail.com"],
           ["bobgmail.com", "invalid email: bobgmail.com"],
           ["bob@.com", "invalid email: bob@.com"],
           ["bob@gmailcom", "invalid email: bob@gmailcom"],
           ["bob@gmail.", "invalid email: bob@gmail."],
           ["bob@gmail.co.", "invalid email: bob@gmail.co."],
           ["bob--bob@gmail.com", "invalid email: bob--bob@gmail.com"]])
("signup fails with invalid email %s", async (email, errorMessage) => {

  requestSignupOf("bob", email)

  const result:APIGatewayProxyResult  = await lambdaHandler(event, context)

  expect(result.statusCode).toBe(400)
  expect(result.body).toBe(JSON.stringify({message: errorMessage}))
})

test.each([["bob@gmail.co.uk"],
           ["bob-bob@gmail.co.uk"]])
("signup succeeds with valid email %s", async (email) => {
  requestSignupOf("Bob", email)

  const result:APIGatewayProxyResult  = await lambdaHandler(event, context)

  expect(result.statusCode).toBe(201)
})


test("signup stores the member", async () => {

  mockUUid.mockReturnValue("456")
  requestSignupOf("jim", "jim@gmail.com")

  const result:APIGatewayProxyResult = await lambdaHandler(event, context)

  expect(mockDataMapperPut).toBeCalledWith(
    expect.objectContaining({
      email: "jim@gmail.com",
      name: "jim",
      id: "456",
      status: "pendingverification"
    })
  )
})

test("signup fails when pre-existing member past signup stage", async () => {

  mockDataMapperQueryResponse([
    buildSnapshot("jim", "jim@gmail.com", Status.Active, "123e4567-e89b-12d3-a456-426614174000")])

  requestSignupOf("jim", "jim@gmail.com")

  const result:APIGatewayProxyResult = await lambdaHandler(event, context)

  expect(result.statusCode).toBe(409)
  expect(result.body).toBe(JSON.stringify({message: "member already signed up"}))
})

function mockDataMapperQueryResponse(members: MemberSnapshot[]) {
  const myAsyncIterable = {
    *[Symbol.asyncIterator]() {
      for (const member of members)
      {
        yield member
      }
    }
  }

  mockDataMapperQuery.mockReturnValue(myAsyncIterable)
}

function buildSnapshot(name: string, email: string, status: Status, id: string)
{
  var snapshot = new MemberSnapshot()

  snapshot.name = name
  snapshot.email = email
  snapshot.status = status
  snapshot.id = id

  return snapshot
}

function requestSignupOf(name: string|null, email: string|null){
  event = {
    body: JSON.stringify(
    {  
      name: name,    
      email: email
    })
  } as APIGatewayEvent
}

