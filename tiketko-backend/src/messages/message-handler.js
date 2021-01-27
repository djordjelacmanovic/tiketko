import { badRequest, success } from "../lib/response";
import AWS from "aws-sdk";
import { Message } from "../domain/message";
import { User } from "../domain/user";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event, context) => {
  let { requestContext, body } = event;
  let { ticketId, text } = JSON.parse(body);

  const { Item: ticket } = await dynamodb
    .get({
      TableName: process.env.TICKETS_TABLE,
      Key: { id: ticketId },
    })
    .promise();

  if (!ticket) {
    console.error(`ticket ${ticketId} does not exist`);
    return badRequest({ message: "ticket does not exist." });
  }

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
