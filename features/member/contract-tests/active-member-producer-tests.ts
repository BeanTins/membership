import * as path from "path"
import { MessageProviderPact } from "@pact-foundation/pact"

const activeMemberNotificationClient = {
    notify: () => {
    return new Promise((resolve, reject) => {
      resolve({
        id: 1,
        name: "biffo",
        email: "biffo@beano.com",
      })
    })
  },
}

describe("membership provider tests", () => {
  const p = new MessageProviderPact({
    messageProviders: {
      "notify member has become active": () => activeMemberNotificationClient.notify(),
    },
    provider: "membershipservice",
    providerVersion: "1.0.0",
    pactUrls: [
      path.resolve(
        process.cwd(),
        "pacts",
        "networkingservice-membershipservice.json"
      ),
    ],
  })

  // 3 Verify the interactions
  describe("event publisher", () => {
    it("notifies a member being activated", () => {
      return p.verify()
    })
  })
})