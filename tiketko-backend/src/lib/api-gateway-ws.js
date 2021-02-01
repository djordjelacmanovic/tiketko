import AWS from "aws-sdk";

const apiGateway = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WEBSOCKET_API_ENDPOINT,
});

export async function sendMessage(connectionId, payload) {
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
