import AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB.DocumentClient();
const apiGateway = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WEBSOCKET_API_ENDPOINT,
});

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
    const message = AWS.DynamoDB.Converter.unmarshall(NewImage);

    let { Item: ticket } = await dynamodb
      .get({
        TableName: process.env.TICKETS_TABLE,
        Key: { id: message.ticket_id },
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

async function sendMessage(connectionId, payload) {
  try {
    await apiGateway
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(payload),
      })
      .promise();
  } catch (error) {
    console.error("Unable to generate socket message", error);
  }
}
