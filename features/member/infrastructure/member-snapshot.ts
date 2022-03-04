import { Member } from "../domain/member"
import {
  attribute,
  hashKey,
  table
} from "@aws/dynamodb-data-mapper-annotations"

@table(process.env.MemberTable!)
export class MemberSnapshot {
  @hashKey({type: 'String'})
  public id: string;

  @attribute({
    type: "String",
    indexKeyConfigurations: {
      emailIndex: "HASH"
    }
  })
  email: string;

  @attribute({type: "String"})
  name: string;

  @attribute({type: 'String'})
  status: string

  public static createFromMember(member: Member) : MemberSnapshot  {
    var memberSnapshot: MemberSnapshot = new MemberSnapshot()

    Object.assign(memberSnapshot, member, 
      {name: member["name"].value,
       email: member["email"].value})

       return memberSnapshot
  }

  public toMember() : Member {
    var member: Member = Member.create(this.name,this.email)

    Object.assign(member, {id: this.id, status: this.status})

    return member
  }
}
