import {Table, AttributeType, ProjectionType} from "@aws-cdk/aws-dynamodb"
import {Construct, StackProps, RemovalPolicy, Fn} from "@aws-cdk/core"
import {IPrincipal} from "@aws-cdk/aws-iam"
import {EnvvarsStack} from "./envvars-stack" 
import { Role } from "@aws-cdk/aws-iam"


export class MemberTable extends EnvvarsStack {
  private readonly memberTable: Table
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)
    this.memberTable = new Table(this, "Table", {
      partitionKey: { name: "id", type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
    })

    this.memberTable.addGlobalSecondaryIndex({
      indexName: "emailIndex",
      partitionKey: {name: "email", type: AttributeType.STRING},
      readCapacity: 1,
      writeCapacity: 1,
      projectionType: ProjectionType.ALL,
    })

    this.addEnvvar("MemberTable", this.memberTable.tableName)
  }

  get name(): string {
    return this.memberTable.tableName
  }

  grantAccessTo(accessor: IPrincipal){
    this.memberTable.grantReadWriteData(accessor)
  }

  grantAccessToExternalRole(accessor: string){
    const importedIamRole = Fn.importValue(accessor)
    console.log("externalRoleArn - " + importedIamRole)

    const role = Role.fromRoleArn(this, "ExternalRole", importedIamRole, {
      mutable: true,
    });
  
    console.log("grant - " + role.grantPrincipal)

    this.memberTable.grantReadWriteData(role.grantPrincipal)

    console.log("role - " + role)
    console.log("end")
  }

  
}

