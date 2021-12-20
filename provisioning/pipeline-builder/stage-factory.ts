import { Construct, Stage } from "@aws-cdk/core"

export interface StageFactory {
  create(scope: Construct, name: string): Stage;
}
