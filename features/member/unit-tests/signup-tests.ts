import { lambdaHandler } from "../signup"
import { APIGatewayEvent, Context,APIGatewayProxyResult } from "aws-lambda"
import { DataMapperFactory } from "../../member/infrastructure/data-mapper-factory"
import { Status } from "../domain/member"
import { MembersDataMapperMock} from "./helpers/members-data-mapper-mock"

const mockUUid = jest.fn()

jest.mock('uuid', () => ({ v4: () => mockUUid() }))

let event: APIGatewayEvent, context: Context
let membersDataMapper: MembersDataMapperMock

beforeEach(() => {
  jest.clearAllMocks()

  membersDataMapper = new MembersDataMapperMock()
  DataMapperFactory.create = membersDataMapper.map()

  membersDataMapper.queryResponse([])
})

test("signup successful for new user", async () => {
  requestSignupOf("Bob", "bob@gmail.com")

  const result:APIGatewayProxyResult  = await lambdaHandler(event, context)

  expect(result.statusCode).toBe(201)
  expect(result.body).toBe(JSON.stringify({message: "member created"}))
})

test("signup successful for user that has already initiated signup", async () => {
  membersDataMapper.queryResponse([
    {name: "Bob", 
     email:"bob@gmail.com", 
     status: Status.PendingVerification, 
     id: "123e4567-e89b-12d3-a456-426614174000"}])

  requestSignupOf("Bob", "bob@gmail.com")

  const result:APIGatewayProxyResult  = await lambdaHandler(event, context)

  expect(result.statusCode).toBe(201)
  expect(result.body).toBe(JSON.stringify({message: "member created"}))
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

  expect(membersDataMapper.put).toBeCalledWith(
    expect.objectContaining({
      email: "jim@gmail.com",
      name: "jim",
      id: "456",
      status: "pendingverification"
    })
  )
})

test("signup fails when pre-existing member past signup stage", async () => {

  membersDataMapper.queryResponse([
    {name: "jim", 
     email: "jim@gmail.com", 
     status: Status.Active, 
     id: "123e4567-e89b-12d3-a456-426614174000"}])

  requestSignupOf("jim", "jim@gmail.com")

  const result:APIGatewayProxyResult = await lambdaHandler(event, context)

  expect(result.statusCode).toBe(409)
  expect(result.body).toBe(JSON.stringify({message: "member already signed up"}))
})

function requestSignupOf(name: string|null, email: string|null){
  event = {
    body: JSON.stringify(
    {  
      name: name,    
      email: email
    })
  } as APIGatewayEvent
}

