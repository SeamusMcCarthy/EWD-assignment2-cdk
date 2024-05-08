import { Aws } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as node from "aws-cdk-lib/aws-lambda-nodejs";
import { Table } from "aws-cdk-lib/aws-dynamodb";

type AppApiProps = {
  userPoolId: string;
  userPoolClientId: string;
  tableName1: Table;
  tableName2: Table;
  tableName3: Table;
};

export class AppApi extends Construct {
  constructor(scope: Construct, id: string, props: AppApiProps) {
    super(scope, id);

    const appApi = new apig.RestApi(this, "Assignment2Api", {
      description: "Assignment2 RestApi",
      endpointTypes: [apig.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: apig.Cors.ALL_ORIGINS,
      },
    });

    const appCommonFnProps = {
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      environment: {
        USER_POOL_ID: props.userPoolId,
        CLIENT_ID: props.userPoolClientId,
        REGION: cdk.Aws.REGION,
      },
    };

    const authorizerFn = new node.NodejsFunction(this, "AuthorizerFn", {
      ...appCommonFnProps,
      entry: "./lambdas/auth/authorizer.ts",
    });

    const requestAuthorizer = new apig.RequestAuthorizer(
      this,
      "RequestAuthorizer",
      {
        identitySources: [apig.IdentitySource.header("cookie")],
        handler: authorizerFn,
        resultsCacheTtl: cdk.Duration.minutes(0),
      }
    );

    //  Functions .....
    const getMovieReviewsFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieReviewsFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getMovieReviews.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: props.tableName1.tableName,
          REGION: "eu-west-1",
        },
      }
    );

    const newMovieReviewFn = new lambdanode.NodejsFunction(
      this,
      "AddMovieReviewFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/addMovieReview.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: props.tableName1.tableName,
          REGION: "eu-west-1",
        },
      }
    );

    const updateMovieReviewFn = new lambdanode.NodejsFunction(
      this,
      "UpdateMovieReviewFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/updateMovieReview.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: props.tableName1.tableName,
          REGION: "eu-west-1",
        },
      }
    );

    const getMovieReviewNameFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieReviewNameFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getMovieReviewName.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: props.tableName1.tableName,
          REGION: "eu-west-1",
        },
      }
    );

    const getMovieReviewsByNameFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieReviewsByNameFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getMovieReviewsByName.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: props.tableName1.tableName,
          REGION: "eu-west-1",
        },
      }
    );

    const role1 = cdk.aws_iam.Role.fromRoleArn(
      this,
      "translator",
      "arn:aws:iam::637423196898:role/translator",
      {
        mutable: true,
      }
    );
    const getMovieReviewTranslatedFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieReviewTranslatedFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getMovieReviewTranslated.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: props.tableName1.tableName,
          REGION: "eu-west-1",
        },
        role: role1,
      }
    );

    const getMovieReviewsURL = getMovieReviewsFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["*"],
      },
    });

    // Permissions ......
    props.tableName1.grantReadData(getMovieReviewsFn);
    props.tableName1.grantReadWriteData(newMovieReviewFn);
    props.tableName1.grantReadWriteData(updateMovieReviewFn);
    props.tableName1.grantReadData(getMovieReviewNameFn);
    props.tableName1.grantReadData(getMovieReviewsByNameFn);
    props.tableName1.grantReadData(getMovieReviewTranslatedFn);

    // Routes
    const moviesEndpoint = appApi.root.addResource("movies"); // /movies
    const moviesReviewsEndpoint = moviesEndpoint.addResource("reviews"); // /movies/reviews   PUT

    const movieEndpoint = moviesEndpoint.addResource("{movieId}"); // /movies/{movieId}
    const movieReviewsEndpoint = movieEndpoint.addResource("reviews"); // /movies/{movieId}/reviews   GET
    const movieReviewsNameEndpoint =
      movieReviewsEndpoint.addResource("{reviewerName}"); // /movies/{movieId}/reviews/{reviewerName}  GET PUT

    const reviewsEndpoint = appApi.root.addResource("reviews"); // /reviews
    const reviewsNameEndpoint = reviewsEndpoint.addResource("{reviewerName}"); // /reviews/{reviewerName}
    const reviewsNameMovieEndpoint =
      reviewsNameEndpoint.addResource("{movieId}"); // /reviews/{reviewerName}/{movieId}
    const reviewsNameMovieTranslateEndpoint =
      reviewsNameMovieEndpoint.addResource("translation"); // /reviews/{reviewerName}/{movieId}/translation

    // Add lambdas to routes
    movieReviewsEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getMovieReviewsFn, { proxy: true })
    );

    moviesReviewsEndpoint.addMethod(
      "POST",
      new apig.LambdaIntegration(newMovieReviewFn),
      {
        authorizer: requestAuthorizer,
        authorizationType: apig.AuthorizationType.CUSTOM,
      }
    );

    movieReviewsNameEndpoint.addMethod(
      "PUT",
      new apig.LambdaIntegration(updateMovieReviewFn),
      {
        authorizer: requestAuthorizer,
        authorizationType: apig.AuthorizationType.CUSTOM,
      }
    );

    movieReviewsNameEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getMovieReviewNameFn, { proxy: true })
    );

    reviewsNameEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getMovieReviewsByNameFn, { proxy: true })
    );

    reviewsNameMovieTranslateEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getMovieReviewTranslatedFn, { proxy: true })
    );
  }
}
