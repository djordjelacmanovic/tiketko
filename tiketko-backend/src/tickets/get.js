import AWS from "aws-sdk";
import { Message } from "../domain/message";
import { Ticket } from "../domain/ticket";
import { notFound, success, unauthorized } from "../lib/response";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async ({ requestContext, pathParameters: { id } }) => {
  console.log(requestContext);

  let { Item: ticketDto } = await dynamodb
    .get({
      TableName: process.env.TICKETS_TABLE,
      Key: { id },
    })
    .promise();

  if (!ticketDto) return notFound();

  let ticket = Ticket.fromDto(ticketDto);
  let group = requestContext.authorizer.jwt.claims["cognito:groups"];
  let invokerUserId = requestContext.authorizer.jwt.claims.sub;

  if (!group.includes("admin") && ticket.user.id !== invokerUserId)
    return unauthorized({ message: "you cannot access this ticket" });

  let { Items: messageDtos } = await dynamodb
    .query({
      TableName: process.env.MESSAGES_TABLE,
      KeyConditionExpression: "ticket_id = :ticket_id",
      ExpressionAttributeValues: {
        ":ticket_id": id,
      },
    })
    .promise();

  let messages = messageDtos.map((d) => Message.fromDto(d));

  return success({ ...ticket, messages });
};
