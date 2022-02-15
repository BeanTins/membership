import { Member } from "./member"

export interface MemberRepository
{
  save(member: Member): void
  load(id: string): Promise<Member|null>
}

