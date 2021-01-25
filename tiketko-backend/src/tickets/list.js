import AWS from "aws-sdk";
import { Ticket } from "../domain/ticket";
import { success, unauthorized } from "../lib/response";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async ({
  requestContext,
  queryStringParameters = {},
}) => {
  let userId = requestContext.authorizer.jwt.claims.sub;
  let group = requestContext.authorizer.jwt.claims["cognito:groups"];
  let { startDate, endDate, status } = queryStringParameters;

  if (group.includes("user")) {
    let { Items: ticketDtos } = await dynamodb
      .query({
        TableName: process.env.TICKETS_TABLE,
        IndexName: "TicketsByUserAndTime",
        KeyConditionExpression: "user_id = :user_id",
        ExpressionAttributeValues: {
          ":user_id": userId,
        },
        ScanIndexForward: false,
      })
      .promise();

    return success(ticketDtos.map((dto) => Ticket.fromDto(dto)));
  } else if (group.includes("admin")) {
    let keyConditions = [];
    let exprAttribValues = {};

    if (startDate && endDate) {
      keyConditions.push(
        "created_at >= :start_date and created_at <= :end_date"
      );
      exprAttribValues[":start_date"] = startDate;
      exprAttribValues[":end_date"] = endDate;
    }

    if (status) {
      keyConditions.push("ticket_status = :ticket_status");
      exprAttribValues[":ticket_status"] = status;
    }
    let ticketDtos = [];

    if (keyConditions.length > 0) {
      let { Items } = await dynamodb
        .query({
          TableName: process.env.TICKETS_TABLE,
          IndexName: "TicketsByStatusAndTime",
          KeyConditionExpression: keyConditions.join(" and "),
          ExpressionAttributeValues: exprAttribValues,
          ScanIndexForward: false,
        })
        .promise();
      ticketDtos = Items;
    } else {
      let { Items } = await dynamodb
        .scan({
          TableName: process.env.TICKETS_TABLE,
        })
        .promise();
      ticketDtos = Items;
    }

    return success(ticketDtos.map((dto) => Ticket.fromDto(dto)));
  } else return unauthorized();
};
