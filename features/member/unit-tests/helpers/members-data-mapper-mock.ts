import { MemberSnapshot } from "../../infrastructure/member-snapshot"
import { Status } from "../../domain/member"

export interface MemberSnapshotInitialiser
{
  name: string
  email: string
  status: Status
  id: string
}

export class MembersDataMapperMock{

  public readonly put: jest.Mock
  public readonly query: jest.Mock

  constructor(){
    this.put = jest.fn()
    this.query = jest.fn()
  }

  map(){
    return jest.fn().mockImplementation(() => {
      return {
        put: (item: any) => this.put(item),
        query: () => this.query()
      }
    })
  }
  
  queryResponse(members: MemberSnapshotInitialiser[]){
    const buildSnapshot = this.buildSnapshot
    const myAsyncIterable = {
      *[Symbol.asyncIterator]() {
        for (const member of members)
        {
          yield buildSnapshot(member)
        }
      }
    }

    this.query.mockReturnValue(myAsyncIterable)
  }

  private buildSnapshot(memberSnapshotInit: MemberSnapshotInitialiser)
  {
    var snapshot = new MemberSnapshot()

    snapshot.name = memberSnapshotInit.name
    snapshot.email = memberSnapshotInit.email
    snapshot.status = memberSnapshotInit.status
    snapshot.id = memberSnapshotInit.id

    return snapshot
  }
}


