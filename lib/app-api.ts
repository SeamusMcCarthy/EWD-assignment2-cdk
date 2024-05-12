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
  public readonly apiUrl: string;
  constructor(scope: Construct, id: string, props: AppApiProps) {
    super(scope, id);

    const appApi = new apig.RestApi(this, "Assignment2Api", {
      description: "Assignment2 RestApi",
      endpointTypes: [apig.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: apig.Cors.ALL_ORIGINS,
        allowHeaders: ["*"],
        allowCredentials: true,
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "DELETE", "PATCH"],
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

    const getPlaylistsFn = new lambdanode.NodejsFunction(
      this,
      "GetPlaylistsFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getPlaylists.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: props.tableName2.tableName,
          REGION: "eu-west-1",
        },
      }
    );

    // const getPlaylistFn = new lambdanode.NodejsFunction(this, "GetPlaylistFn", {
    //   architecture: lambda.Architecture.ARM_64,
    //   runtime: lambda.Runtime.NODEJS_16_X,
    //   entry: `${__dirname}/../lambdas/getPlaylist.ts`,
    //   timeout: cdk.Duration.seconds(10),
    //   memorySize: 128,
    //   environment: {
    //     TABLE_NAME: props.tableName2.tableName,
    //     REGION: "eu-west-1",
    //   },
    // });

    const getPlaylistEntriesFn = new lambdanode.NodejsFunction(
      this,
      "GetPlaylistEntriesFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getPlaylistEntries.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: props.tableName3.tableName,
          REGION: "eu-west-1",
        },
      }
    );

    // const getPlaylistEntryFn = new lambdanode.NodejsFunction(
    //   this,
    //   "GetPlaylistEntryFn",
    //   {
    //     architecture: lambda.Architecture.ARM_64,
    //     runtime: lambda.Runtime.NODEJS_16_X,
    //     entry: `${__dirname}/../lambdas/getPlaylistEntry.ts`,
    //     timeout: cdk.Duration.seconds(10),
    //     memorySize: 128,
    //     environment: {
    //       TABLE_NAME: props.tableName3.tableName,
    //       REGION: "eu-west-1",
    //     },
    //   }
    // );

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

    const newPlaylistFn = new lambdanode.NodejsFunction(this, "AddPlaylistFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/addPlaylist.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: props.tableName2.tableName,
        REGION: "eu-west-1",
      },
    });

    const newPlaylistEntryFn = new lambdanode.NodejsFunction(
      this,
      "AddPlaylistEntryFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/addPlaylistEntry.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: props.tableName3.tableName,
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

    const deletePlaylistFn = new lambdanode.NodejsFunction(
      this,
      "DeletePlaylistFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/deletePlaylist.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: props.tableName2.tableName,
          REGION: "eu-west-1",
        },
      }
    );

    const deletePlaylistEntryFn = new lambdanode.NodejsFunction(
      this,
      "DeletePlaylistEntryFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/deletePlaylistEntry.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: props.tableName3.tableName,
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

    props.tableName2.grantReadData(getPlaylistsFn);
    // props.tableName2.grantReadData(getPlaylistFn);
    props.tableName2.grantReadWriteData(newPlaylistFn);
    props.tableName2.grantReadWriteData(deletePlaylistFn);

    props.tableName3.grantReadData(getPlaylistEntriesFn);
    // props.tableName3.grantReadData(getPlaylistEntryFn);
    props.tableName3.grantReadWriteData(newPlaylistEntryFn);
    props.tableName3.grantReadWriteData(deletePlaylistEntryFn);

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

    const usersEndpoint = appApi.root.addResource("users");
    const userNameEndpoint = usersEndpoint.addResource("{userName}"); // /users/{userName}
    const userPlaylistsEndpoint = userNameEndpoint.addResource("playlists"); // /users/{userName}/playlists
    const userPlaylistEndpoint =
      userPlaylistsEndpoint.addResource("{playlistName}"); // /users/{userName}/playlists/{playlistName}

    const playlistsEndpoint = appApi.root.addResource("playlists"); // /playlists
    const playlistEndpoint = playlistsEndpoint.addResource("{playlistName}"); // /playlists/{playlistName}
    const playlistEntriesEndpoint = playlistEndpoint.addResource("entries"); // /playlists/{playlistName}/entries
    const playlistEntryEndpoint =
      playlistEntriesEndpoint.addResource("{movieId}"); // /playlists/{playlistName}/entries/{movieId}

    // Add lambdas to routes
    userPlaylistsEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getPlaylistsFn, { proxy: true })
      // {
      //   authorizer: requestAuthorizer,
      //   authorizationType: apig.AuthorizationType.CUSTOM,
      // }
    );

    // userPlaylistEndpoint.addMethod(
    //   "GET",
    //   new apig.LambdaIntegration(getPlaylistFn, { proxy: true }),
    //   {
    //     authorizer: requestAuthorizer,
    //     authorizationType: apig.AuthorizationType.CUSTOM,
    //   }
    // );

    userPlaylistsEndpoint.addMethod(
      "POST",
      new apig.LambdaIntegration(newPlaylistFn)
      // {
      //   authorizer: requestAuthorizer,
      //   authorizationType: apig.AuthorizationType.CUSTOM,
      // }
    );

    userPlaylistEndpoint.addMethod(
      "DELETE",
      new apig.LambdaIntegration(deletePlaylistFn)
      // {
      //   authorizer: requestAuthorizer,
      //   authorizationType: apig.AuthorizationType.CUSTOM,
      // }
    );

    playlistEntriesEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getPlaylistEntriesFn, { proxy: true })
      // {
      //   authorizer: requestAuthorizer,
      //   authorizationType: apig.AuthorizationType.CUSTOM,
      // }
    );

    // playlistEntryEndpoint.addMethod(
    //   "GET",
    //   new apig.LambdaIntegration(getPlaylistEntryFn),
    //   {
    //     authorizer: requestAuthorizer,
    //     authorizationType: apig.AuthorizationType.CUSTOM,
    //   }
    // );

    playlistEntriesEndpoint.addMethod(
      "POST",
      new apig.LambdaIntegration(newPlaylistEntryFn)
      // {
      //   authorizer: requestAuthorizer,
      //   authorizationType: apig.AuthorizationType.CUSTOM,
      // }
    );

    playlistEntryEndpoint.addMethod(
      "DELETE",
      new apig.LambdaIntegration(deletePlaylistEntryFn)
      // {
      //   authorizer: requestAuthorizer,
      //   authorizationType: apig.AuthorizationType.CUSTOM,
      // }
    );

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

    this.apiUrl = appApi.url;
  }
}
