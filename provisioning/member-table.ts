import {Table, AttributeType, ProjectionType, StreamViewType} from "aws-cdk-lib/aws-dynamodb"
import { StackProps, RemovalPolicy, CfnOutput } from "aws-cdk-lib"
import { Construct } from "constructs"
import {IPrincipal} from "aws-cdk-lib/aws-iam"
import {EnvvarsStack} from "./envvars-stack" 

interface MemberTableProps extends StackProps {
  postfixIdentifier: string;
}

export class MemberTable extends EnvvarsStack {
  public readonly memberTable: Table
  constructor(scope: Construct, id: string, props?: MemberTableProps) {
    super(scope, id, props)
    this.memberTable = new Table(this, "Table", {
      partitionKey: { name: "id", type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
    })

    this.memberTable.addGlobalSecondaryIndex({
      indexName: "emailIndex",
      partitionKey: {name: "email", type: AttributeType.STRING},
      readCapacity: 1,
      writeCapacity: 1,
      projectionType: ProjectionType.ALL,
    })

    

    this.addEnvvar("MemberTable", this.memberTable.tableName)
    
    new CfnOutput(this, "MemberTableArn" + props?.postfixIdentifier, {
      value: this.memberTable.tableArn,
      exportName: "MemberTableArn" + props?.postfixIdentifier,
    })
  }

  get name(): string {
    return this.memberTable.tableName
  }

  grantAccessTo(accessor: IPrincipal){
    this.memberTable.grantReadWriteData(accessor)
  }
}

