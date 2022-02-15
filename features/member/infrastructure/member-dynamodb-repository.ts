import { Member } from "../domain/member"
import { MemberRepository } from "../domain/member-repository"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { MemberSnapshot} from "./member-snapshot"
import { DataMapperFactory } from "./data-mapper-factory"
import { DataMapper, DynamoDbTable} from "@aws/dynamodb-data-mapper"

export class MemberDynamoDBRepository implements MemberRepository
{
  dynamoDB: DocumentClient
  dataMapper: DataMapper
  constructor() {
    this.dynamoDB = new DocumentClient({region: "us-east-1"})
    this.dataMapper = DataMapperFactory.create()
  }

  async save(member: Member)
  {
    const snapshot = MemberSnapshot.createFromMember(member)
    await this.dataMapper.put(snapshot)
  }
  async load(id: string): Promise<Member|null>
  {
    return Member.create("","")
  }

  private buildTableEntry(snapshot: MemberSnapshot){
    const TableName = process.env.MemberTable!
    const Item: any = {}
    Item["name"] = snapshot.name
    Item["email"] = snapshot.email
    Item["id"] = snapshot.id
    Item["status"] = snapshot.status

    return {TableName, Item}
  }
}

