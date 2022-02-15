import { ValueObject } from "./value-object"

export class InvalidName extends Error {}

export class Name implements ValueObject<string>{

  private name: string

  public constructor(name: string){

    if (name.length < 2)
    {
      throw new InvalidName("name too short: \"" + name + "\"")
    }

    if (name.length > 256)
    {
      throw new InvalidName("name too long: \"" + name + "\"")
    }

    this.name = name
  }

  public get value() {
    return this.name
  }
}


