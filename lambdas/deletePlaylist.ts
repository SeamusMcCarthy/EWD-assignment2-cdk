import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";

const ajv = new Ajv({ coerceTypes: true });
const isValidBodyParams = ajv.compile(schema.definitions["Playlist"] || {});

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // Print Event
    console.log("Event: ", event);
    const parameters = event?.pathParameters;
    const userName = parameters?.userName
      ? parseInt(parameters.userName)
      : undefined;
    const playlistName = parameters?.playlistName
      ? decodeURI(parameters?.playlistName)
      : undefined;
    const body = event.body ? JSON.parse(event.body) : undefined;

    if (!userName) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing user name" }),
      };
    }

    if (!playlistName) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing playlist name" }),
      };
    }

    if (!body) {
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }
    const data = { userName, playlistName };
    if (!isValidBodyParams(data)) {
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: `Incorrect type. Must match Playlist schema`,
          schema: schema.definitions["Playlist"],
        }),
      };
    }

    const commandOutput = await ddbDocClient.send(
      new DeleteCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          userName: data.userName,
          playlistName: data.playlistName,
        },
      })
    );
    return {
      statusCode: 204,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: "Playlist deleted" }),
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
