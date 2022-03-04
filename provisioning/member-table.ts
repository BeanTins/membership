import {Table, AttributeType, ProjectionType} from "@aws-cdk/aws-dynamodb"
import {Construct, StackProps, RemovalPolicy, CfnOutput } from "@aws-cdk/core"
import {IPrincipal} from "@aws-cdk/aws-iam"
import {EnvvarsStack} from "./envvars-stack" 

interface MemberTableProps extends StackProps {
  postfixIdentifier: string;
}

export class MemberTable extends EnvvarsStack {
  private readonly memberTable: Table
  constructor(scope: Construct, id: string, props?: MemberTableProps) {
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
    
    new CfnOutput(this, "MemberTableArn", {
      value: this.memberTable.tableArn,
      exportName: "MemberTableArn-" + props?.postfixIdentifier,
    })
  }

  get name(): string {
    return this.memberTable.tableName
  }

  grantAccessTo(accessor: IPrincipal){
    this.memberTable.grantReadWriteData(accessor)
  }
}

