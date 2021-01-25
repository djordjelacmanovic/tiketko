import AWS from "aws-sdk";
import { Ticket } from "../domain/ticket";
import { badRequest, unauthorized, success, notFound } from "../lib/response";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async ({
  requestContext,
  body,
  pathParameters: { id },
}) => {
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

  let { status } = JSON.parse(body);
  if (!Object.values(Ticket.Status).includes(status))
    return badRequest({ message: `status '${status}' is not valid.` });

  ticket.status = status;

  await dynamodb
    .put({
      TableName: process.env.TICKETS_TABLE,
      Item: ticket.toDto(),
    })
    .promise();

  return success(ticket);
};
