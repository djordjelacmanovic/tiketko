import AWS from "aws-sdk";
import { Message } from "../domain/message";

const dynamodb = new AWS.DynamoDB.DocumentClient();
import { sendMessage } from "../lib/api-gateway-ws";

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

  console.log(adminSessions);

  for (const {
    eventName,
    dynamodb: { NewImage },
  } of Records) {
    if (eventName != "INSERT" && eventName != "MODIFY") continue;
    const messageDto = AWS.DynamoDB.Converter.unmarshall(NewImage);

    const message = Message.fromDto(messageDto);

    let { Item: ticket } = await dynamodb
      .get({
        TableName: process.env.TICKETS_TABLE,
        Key: { id: message.ticketId },
      })
      .promise();

    if (!ticket) {
      console.error(`Ticket ${message.ticket_id} does not exist.`);
      continue;
    }

    let { Items: userSessions } = await dynamodb
      .query({
        TableName: process.env.SESSIONS_TABLE,
        IndexName: "SessionsByUserId",
        KeyConditionExpression: "user_id = :user_id",
        ExpressionAttributeValues: {
          ":user_id": ticket.user.id,
        },
      })
      .promise();

    console.log(message);
    console.log(ticket);
    console.log(userSessions);

    await Promise.all(
      [...adminSessions, ...userSessions].map(({ connection_id }) =>
        sendMessage(connection_id, {
          type: "NEW_MESSAGE",
          data: message,
        })
      )
    );
  }
};
