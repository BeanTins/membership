import * as path from "path"
import { MessageConsumerPact, synchronousBodyHandler, Matchers } from "@pact-foundation/pact"

const {like, term} = Matchers

const activeMemberHandler = function (dog: any) {
  if (!dog.id && !dog.name && !dog.email) {
    throw new Error("missing fields")
  }

  // do some other things to dog...
  // e.g. dogRepository.save(dog)
  return
}

const messagePact = new MessageConsumerPact({
  consumer: "networkingservice",
  dir: path.resolve(process.cwd(), "pacts"),
  pactfileWriteMode: "update",
  provider: "membershipservice",
})

test("consume active member notification event successfully", () => {
  return (
    messagePact
      .expectsToReceive("notify member has become active")
      .withContent({
        id: like(1),
        name: like("biffo"),
        email: term({ generate: "biffo@beano.com", matcher: "^[a-zA-Z]+@[a-zA-Z]+\.[a-zA-Z]+$" }),
      })
      .withMetadata({
        "content-type": "application/json",
      })

      .verify(synchronousBodyHandler(activeMemberHandler))
  )
})

