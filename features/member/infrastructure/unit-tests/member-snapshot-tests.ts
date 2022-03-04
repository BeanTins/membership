import { Member} from "../../domain/member"
import { MemberSnapshot} from "../member-snapshot"

test("snapshot to member", async() => {

  const memberSnapshot = new MemberSnapshot()
  memberSnapshot.id = "123e4567-e89b-12d3-a456-426614174000"
  memberSnapshot.name = "jim"
  memberSnapshot.email = "jim@gmail.com"
  memberSnapshot.status = "active"

  var member = memberSnapshot.toMember()
  expect(member["name"]["value"]).toBe("jim")
  expect(member["email"]["value"]).toBe("jim@gmail.com")
  expect(member["status"]).toBe("active")
  expect(member["id"]).toBe("123e4567-e89b-12d3-a456-426614174000")
})

test("member to snapshot", async() => {
  
  var member: Member = Member.create("bob", "bob@gmail.com")

  const snapshot = MemberSnapshot.createFromMember(member)

  expect(snapshot.name).toBe("bob")
  expect(snapshot.email).toBe("bob@gmail.com")
})

test("snapshot has identical set of properties to member", async() => {
  
  const member = Member.create("bob", "bob@gmail.com")
  const malformedMemberSnapshot = new MalformedMemberSnapshot()
  const snapshot = MemberSnapshot.createFromMember(member)

  const memberKeys = Object.keys(member) as Array<keyof Member>
  const memberSnapshotKeys = Object.keys(snapshot) as Array<keyof MemberSnapshot>
  const malformedMemberSnapshotKeys = Object.keys(malformedMemberSnapshot) as Array<keyof MalformedMemberSnapshot>

  expect(memberKeys).toEqual(memberSnapshotKeys)
  expect(memberSnapshotKeys).not.toEqual(malformedMemberSnapshotKeys)
})

class MalformedMemberSnapshot extends MemberSnapshot{
  private spuriousProperty: string = ""
}



