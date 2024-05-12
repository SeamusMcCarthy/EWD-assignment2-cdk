import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as s3 from "aws-cdk-lib/aws-s3";
import { FrontendApp } from "../frontend";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfront_origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { CfnOutput, Duration, RemovalPolicy } from "aws-cdk-lib";

import {
  generateBatch,
  generatePlaylistBatch,
  generatePlaylistEntryBatch,
} from "../../shared/util";
import { movieReviews, playlists, playlistEntries } from "../../seed/seedData";
import { Construct } from "constructs";

import { UserPool } from "aws-cdk-lib/aws-cognito";
import { AuthApi } from "../auth-api";
import { AppApi } from "../app-api";

export class EwdAssignment2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new UserPool(this, "EWD1_UserPool", {
      signInAliases: { username: true, email: true },
      selfSignUpEnabled: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolId = userPool.userPoolId;

    const appClient = userPool.addClient("AppClient", {
      authFlows: { userPassword: true },
    });

    const userPoolClientId = appClient.userPoolClientId;

    // Create movieReviews table
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

    movieReviewsTable.addGlobalSecondaryIndex({
      indexName: "reviewerNameIx",
      partitionKey: {
        name: "reviewerName",
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Create playlist table
    const playlistsTable = new dynamodb.Table(this, "PlaylistsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "userName", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "playlistName", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Playlists",
    });

    // Create playlistEntries table
    const playlistEntriesTable = new dynamodb.Table(
      this,
      "PlaylistEntriesTable",
      {
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        partitionKey: {
          name: "playlistName",
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        tableName: "PlaylistEntries",
      }
    );

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
        ),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [movieReviewsTable.tableArn],
      }),
    });

    new custom.AwsCustomResource(this, "playlistsddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [playlistsTable.tableName]: generatePlaylistBatch(playlists),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of(
          "playlistsddbInitData"
        ),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [playlistsTable.tableArn],
      }),
    });

    new custom.AwsCustomResource(this, "playlistEntriesddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [playlistEntriesTable.tableName]:
              generatePlaylistEntryBatch(playlistEntries),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of(
          "playlistEntriesddbInitData"
        ),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [playlistEntriesTable.tableArn],
      }),
    });

    const authApi = new AuthApi(this, "AuthServiceApi", {
      userPoolId: userPoolId,
      userPoolClientId: userPoolClientId,
    });

    const appApi = new AppApi(this, "AppApi", {
      userPoolId: userPoolId,
      userPoolClientId: userPoolClientId,
      tableName1: movieReviewsTable,
      tableName2: playlistsTable,
      tableName3: playlistEntriesTable,
    });

    new FrontendApp(this, "FrontendApp", {
      apiUrl: appApi.apiUrl,
      authUrl: authApi.apiUrl,
    });
  }
}
