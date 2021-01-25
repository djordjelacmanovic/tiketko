import { success } from "../lib/response";
import AWS from "aws-sdk";
import { parseToken } from "../lib/jwt";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event, context) => {
  console.log(event);
  console.log(context);
  let { requestContext } = event;

  if (requestContext.eventType === "CONNECT") {
    const { payload } = parseToken(event.queryStringParameters.token);
    let userType = payload["cognito:groups"][0] || "user";

    await dynamodb
      .put({
        TableName: process.env.SESSIONS_TABLE,
        Item: {
          connection_id: requestContext.connectionId,
          user_id: requestContext.authorizer.principalId,
          user_type: userType,
        },
      })
      .promise();
  } else if (event.requestContext.eventType === "DISCONNECT") {
    await dynamodb
      .delete({
        TableName: process.env.SESSIONS_TABLE,
        Key: {
          connection_id: requestContext.connectionId,
        },
      })
      .promise();
  }

  return success({
    input: event,
  });
};
