import { Member } from "../domain/member"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { MemberSnapshot} from "./member-snapshot"
import { DataMapperFactory } from "./data-mapper-factory"
import { DataMapper } from "@aws/dynamodb-data-mapper"

export class MemberQuery
{
  dynamoDB: DocumentClient
  dataMapper: DataMapper
  constructor() {
    this.dynamoDB = new DocumentClient({region: "us-east-1"})
    this.dataMapper = DataMapperFactory.create()
  }

  public async withEmail(email: string): Promise<Member|undefined> {
    var member: Member|undefined = undefined
    const matchingItemIterator = this.dataMapper.query(MemberSnapshot, { email: email }, {indexName: "emailIndex"})

    for await (const matchingMember of matchingItemIterator)
    {
      member = matchingMember.toMember()
      break
    }

    return Promise.resolve(member)
  }
}

