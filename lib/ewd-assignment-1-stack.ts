import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";

import { Construct } from "constructs";

export class EwdAssignment1Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const EwdAssignment1Fn = new lambdanode.NodejsFunction(
      this,
      "EwdAssignment1Fn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/EwdAssignment1.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
      }
    );

    const EwdAssignment1FnURL = EwdAssignment1Fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.AWS_IAM,
      cors: {
        allowedOrigins: ["*"],
      },
    });

    new cdk.CfnOutput(this, "Simple Function Url", {
      value: EwdAssignment1FnURL.url,
    });
  }
}
