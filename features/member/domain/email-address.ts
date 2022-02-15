import { ValueObject } from "./value-object"

export class InvalidEmailAddress extends Error {}

export class EmailAddress implements ValueObject<string>{

  private email: string

  public constructor(email: string){

    if (!email.match("^[a-zA-Z0-9]+([-._][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.][a-zA-Z0-9]+)+$"))
    {
      throw new InvalidEmailAddress("invalid email: " + email)
    }
    this.email = email
  }

  public get value() {
    return this.email
  }
}


