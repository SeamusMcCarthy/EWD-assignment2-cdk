import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { generateBatch } from "../shared/util";
import { movieReviews } from "../seed/movieReviews";

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

    const movieReviewsTable = new dynamodb.Table(this, "MovieReviewsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "reviewerName", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "MovieReviews",
    });

    movieReviewsTable.addLocalSecondaryIndex({
      indexName: "dateIx",
      sortKey: { name: "reviewDate", type: dynamodb.AttributeType.STRING },
    });

    movieReviewsTable.addLocalSecondaryIndex({
      indexName: "ratingIx",
      sortKey: { name: "rating", type: dynamodb.AttributeType.NUMBER },
    });

    new custom.AwsCustomResource(this, "movieReviewsddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [movieReviewsTable.tableName]: generateBatch(movieReviews),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of(
          "movieReviewsddbInitData"
        ), //.of(Date.now().toString()),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [movieReviewsTable.tableArn],
      }),
    });

    new cdk.CfnOutput(this, "EwdAssignment1 Function Url", {
      value: EwdAssignment1FnURL.url,
    });
  }
}
