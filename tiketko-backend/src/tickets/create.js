import AWS from "aws-sdk";
import { failure, success } from "../lib/response";
import uuid from "uuid/v4";
import { User } from "../domain/user";
import { Ticket } from "../domain/ticket";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async ({ requestContext, body }) => {
  const data = JSON.parse(body);
  console.log(requestContext);
  console.log(data);

  let { title, details } = data;

  try {
    let { Item: userDto } = await dynamodb
      .get({
        TableName: process.env.USERS_TABLE,
        Key: {
          id: requestContext.authorizer.jwt.claims.sub,
        },
      })
      .promise();

    let ticket = new Ticket(uuid(), User.fromDto(userDto), title, details);

    await dynamodb
      .put({
        TableName: process.env.TICKETS_TABLE,
        Item: ticket.toDto(),
      })
      .promise();

    return success(ticket);
  } catch (err) {
    console.error(err);
    return failure();
  }
};
