import AWS from "aws-sdk";
import { Ticket } from "../domain/ticket";
import { sendMessage } from "../lib/api-gateway-ws";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async ({ Records }) => {
  let { Items: adminSessions } = await dynamodb
    .query({
      TableName: process.env.SESSIONS_TABLE,
      IndexName: "SessionsByUserType",
      KeyConditionExpression: "user_type = :user_type",
      ExpressionAttributeValues: {
        ":user_type": "admin",
      },
    })
    .promise();

  for (const {
    eventName,
    dynamodb: { NewImage },
  } of Records) {
    console.log("eventName", eventName);
    console.log("NewImage", NewImage);
    if (eventName != "INSERT" && eventName != "MODIFY") continue;
    const ticketDto = AWS.DynamoDB.Converter.unmarshall(NewImage);
    const ticket = Ticket.fromDto(ticketDto);

    let {
      Items: [userSession],
    } = await dynamodb
      .query({
        TableName: process.env.SESSIONS_TABLE,
        IndexName: "SessionsByUserId",
        KeyConditionExpression: "user_id = :user_id",
        ExpressionAttributeValues: {
          ":user_id": ticket.user.id,
        },
      })
      .promise();
    if (userSession)
      await sendMessage(userSessions[0].connection_id, {
        type: "STORE_TICKET",
        data: ticket,
      });

    await Promise.all(
      adminSessions.map(
        async ({ connection_id }) =>
          await sendMessage(connection_id, {
            type: "STORE_TICKET",
            data: ticket,
          })
      )
    );
  }
};
