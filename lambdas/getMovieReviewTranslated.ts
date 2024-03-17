import { APIGatewayProxyHandlerV2, Handler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import {
  TranslateClient,
  TranslateTextCommand,
} from "@aws-sdk/client-translate";
const client = new TranslateClient({ region: "eu-west-1" });
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
    const queryParams = event.queryStringParameters;
    const lang = queryParams?.language ? queryParams.language : undefined;
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

    if (!lang) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing language value" }),
      };
    }

    let commandInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
    };

    commandInput = {
      ...commandInput,
      KeyConditionExpression: "movieId = :m and reviewerName = :r",
      ExpressionAttributeValues: {
        ":m": movieId,
        ":r": reviewerName,
      },
    };

    type Item = {
      movidId: number;
      reviewerName: string;
      content: string;
      reviewDate: string;
      rating: number;
    };

    const { Items } = (await ddbDocClient.send(
      new QueryCommand(commandInput)
    )) as Omit<QueryCommandOutput, "Items"> & {
      Items?: Item[];
    };

    const content = Items?.[0].content || "";
    console.log("Content to translate is ", content);

    const input = {
      // TranslateTextRequest
      Text: content.trim(), // required
      SourceLanguageCode: "en", // required
      TargetLanguageCode: lang, // required
    };

    const command = new TranslateTextCommand(input);
    const response = await client.send(command);

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        data: response,
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
