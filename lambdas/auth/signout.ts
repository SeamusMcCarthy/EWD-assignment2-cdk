import { APIGatewayProxyResult } from "aws-lambda";

exports.handler = async function (): Promise<APIGatewayProxyResult> {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Content-Type": "application/json",
      "Set-Cookie":
        "token=x; SameSite=None; Secure; HttpOnly; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;",
    },
    body: JSON.stringify({
      message: "Signout successful",
    }),
  };
};
