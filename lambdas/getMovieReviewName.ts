import { APIGatewayProxyHandlerV2, Handler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";

const ajv = new Ajv({ coerceTypes: true });
const isValidQueryParams = ajv.compile(
  schema.definitions["MovieReviewQueryParameters"] || {}
);

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", event);
    const parameters = event?.pathParameters;
    const movieId = parameters?.movieId
      ? parseInt(parameters.movieId)
      : undefined;
    const reviewerName = parameters?.reviewerName
      ? decodeURI(parameters?.reviewerName)
      : undefined;

    if (!movieId) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing movie Id" }),
      };
    }

    if (!reviewerName) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing reviewer name" }),
      };
    }

    // const queryParams = event.queryStringParameters;
    // const rating = queryParams?.minRating
    //   ? parseInt(queryParams.minRating)
    //   : undefined;

    // if (queryParams) {
    //   // if (!isValidQueryParams(queryParams) || rating === undefined) {
    //   if (!isValidQueryParams(queryParams)) {
    //     return {
    //       statusCode: 500,
    //       headers: {
    //         "content-type": "application/json",
    //       },
    //       body: JSON.stringify({
    //         message: `Incorrect type. Must match Query parameters schema`,
    //         schema: schema.definitions["MovieReviewQueryParameters"],
    //       }),
    //     };
    //   }
    // }

    let commandInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
    };

    // if (queryParams) {
    //   commandInput = {
    //     ...commandInput,
    //     IndexName: "ratingIx",
    //     KeyConditionExpression: "movieId = :m and rating >= :r ",
    //     ExpressionAttributeValues: {
    //       ":m": movieId,
    //       ":r": queryParams.minRating,
    //     },
    //   };
    // } else {
    commandInput = {
      ...commandInput,
      KeyConditionExpression: "movieId = :m and reviewerName = :r",
      ExpressionAttributeValues: {
        ":m": movieId,
        ":r": reviewerName,
      },
    };
    // }

    const commandOutput = await ddbDocClient.send(
      new QueryCommand(commandInput)
    );

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        data: commandOutput.Items,
      }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
