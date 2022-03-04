import { v4 as uuidv4 } from "uuid"
import { Name } from "./name"
import { EmailAddress } from "./email-address"

export enum Status {
  New = "new",
  PendingVerification = "pendingverification",
  Active = "active"
}

export class Entity{
  
  readonly id: string

  constructor (id: string|null){
    if (id == null)
    {
      this.id = uuidv4()
    }
    else
    {
      this.id = id
    }
  }
}

export class InvalidMemberOperation extends Error {}

export class Member extends Entity {

  private name: Name
  private email: EmailAddress
  private status: Status

  private constructor(name: string, email: string, status: Status, id:string|null = null) {
    super(id)
    this.name = new Name(name)
    this.email = new EmailAddress(email)
    this.status = status
  }

  public static create(name: string, email: string): Member
  {
    return new Member(name, email, Status.New)
  }

  public signup()
  {
    if ((this.status != Status.New) &&
        (this.status != Status.PendingVerification))
    {
      throw new InvalidMemberOperation("member already signed up")
    }
    this.status = Status.PendingVerification
  }

  public verify()
  {
    if (this.status == Status.New)
    {
      throw new InvalidMemberOperation("member has not signed up")
    }
    this.status = Status.Active
  }
}


