
import {resolveOutput} from "../../infrastructure/output-resolver"
import CognitoIdentityServiceProvider from "aws-sdk/clients/cognitoidentityserviceprovider"
import AWS from "aws-sdk"
import logger from "./component-test-logger"

export class MemberCredentialsAccessor {
  
  private client: CognitoIdentityServiceProvider
  private userPoolId: string
  private clientId: string

  constructor()
  {
    AWS.config.update({region: "us-east-1"})
    this.client = new CognitoIdentityServiceProvider()
    this.userPoolId = resolveOutput("MemberCredentialsDev", "userPoolId")
    this.clientId = resolveOutput("MemberCredentialsDev", "userPoolClientId")
  }

  async clear()
  {
    var listParams = {
      "UserPoolId": this.userPoolId
   }

   try
   {
     const response = await this.client.listUsers(listParams).promise()

     for (const user of response.Users!)
     {
       await this.deleteMember(this.client, user.Username!)
     }
   }
   catch(error)
   {
    logger.error("Failed to clear member credentials: " + error)
   }

  } 

  private async deleteMember(client: CognitoIdentityServiceProvider, username: string) {
    const params = {
      Username: username,
      UserPoolId: this.userPoolId
    }

    try {
      const response = await client.adminDeleteUser(params).promise()
      logger.verbose("deleting user response - " + JSON.stringify(response))
    }
    catch (error) {
      logger.error("Failed to delete member credentials for " + name + " - " + error)
    }
  }

  public async confirmUser(email: string)
  {
    try
    {
      var confirmSignupParams = {
        Username: email,
        UserPoolId: this.userPoolId
      }
      const response = await this.client.adminConfirmSignUp(confirmSignupParams).promise()
      logger.verbose("confirmUser response - " + JSON.stringify(response))
    }
    catch(error)
    {
      logger.error("Failed to confirm signup for " + name + " - " + error)
    }

  }

  async addMember(email: string, password: string)
  {
    try
    {
      var params = {
        ClientId: this.clientId,
        Username: email,
        Password: password
      }
  
      await this.client.signUp(params).promise()
    }
    catch(error)
    {
      logger.error("Failed to signup member credentials for " + email + " - " + error)
    }
  }

  async addConfirmedMember(email: string, password: string)
  {
    await this.addMember(email, password)

    await this.confirmUser(email)
  }
}
