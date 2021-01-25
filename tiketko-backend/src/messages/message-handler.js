import { success } from "../lib/response";
import AWS from "aws-sdk";
import { Message } from "../domain/message";
import { User } from "../domain/user";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event, context) => {
  let { requestContext, body } = event;
  let { ticketId, text } = JSON.parse(body);

  const { Item: userDto } = await dynamodb
    .get({
      TableName: process.env.USERS_TABLE,
      Key: {
        id: requestContext.authorizer.principalId,
      },
    })
    .promise();

  let message = new Message(ticketId, User.fromDto(userDto), text);

  await dynamodb
    .put({
      TableName: process.env.MESSAGES_TABLE,
      Item: message.toDto(),
    })
    .promise();

  return success({ event });
};
