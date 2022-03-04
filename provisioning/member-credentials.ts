import {UserPool, 
  AccountRecovery, 
  UserPoolClient, 
  UserPoolClientIdentityProvider, 
  ClientAttributes} from "@aws-cdk/aws-cognito"
import {Stack, App, StackProps, RemovalPolicy, CfnOutput} from "@aws-cdk/core"
import {StringParameter, ParameterType, ParameterTier} from "@aws-cdk/aws-ssm"

interface MemberCredentialsProps extends StackProps {
  stageName: string
}

export class MemberCredentials extends Stack {
  constructor(scope: App, id: string, props: MemberCredentialsProps) {
    super(scope, id, props)

    const userPool = this.buildUserPool(id, props.stageName)
  
    const client = this.buildUserPoolClient(userPool)
  }

  private buildUserPool(id: string, stageName: string) {
    const userPool = new UserPool(this, 'MemberCredentials', {
      userPoolName: id,
      selfSignUpEnabled: true,
      // signInAliases: {
      //   email: true,
      // },
      // autoVerify: {
      //   email: false,
      // },

      passwordPolicy: {
        minLength: 6,
        requireLowercase: true,
        requireDigits: true,
        requireUppercase: false,
        requireSymbols: false,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    new CfnOutput(this, 'userPoolId', {
      value: userPool.userPoolId,
    })

    new StringParameter(this, "userPoolId_" + stageName, {
      parameterName: "userPoolId_" + stageName,
      stringValue: userPool.userPoolId,
      description: "the member credentials Id for stage environment " + stageName,
      type: ParameterType.STRING,
      tier: ParameterTier.STANDARD,
      allowedPattern: ".*",
    })

    return userPool
  }

  private buildUserPoolClient(userPool: UserPool) {
    const standardCognitoAttributes = {
      email: true,
      emailVerified: true,
      locale: true,
      timezone: true,
      lastUpdateTime: true
    }
  
    const clientReadAttributes = new ClientAttributes()
      .withStandardAttributes(standardCognitoAttributes)
  
    const clientWriteAttributes = new ClientAttributes()
      .withStandardAttributes({
        ...standardCognitoAttributes,
        emailVerified: false,
      })
  
    const userPoolClient = new UserPoolClient(this, 'MemberCredentialsClient', {
      userPool,
      authFlows: {
        adminUserPassword: true,
        custom: true,
        userSrp: true,
      },
      supportedIdentityProviders: [
        UserPoolClientIdentityProvider.COGNITO,
      ],
      readAttributes: clientReadAttributes,
      writeAttributes: clientWriteAttributes,
    })
  
    new CfnOutput(this, 'userPoolClientId', {
      value: userPoolClient.userPoolClientId,
    })

    return userPoolClient
  }

}
