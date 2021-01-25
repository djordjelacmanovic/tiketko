import XLSX from "xlsx";
import AWS from "aws-sdk";
import { success } from "../lib/response";
const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async ({ requestContext, body }) => {
  console.log(requestContext);
  let wb = XLSX.read(body, { type: "base64", cellDates: true });

  console.log(wb.SheetNames);
  let users = XLSX.utils.sheet_to_json(wb.Sheets["Users"]);
  let tickets = XLSX.utils.sheet_to_json(wb.Sheets["Tickets"]);
  let messages = XLSX.utils.sheet_to_json(wb.Sheets["Messages"]);

  console.log(users);
  console.log(tickets);
  console.log(messages);

  let usersMap = usersArrToMap(users);

  await Promise.all([
    importUsers(users),
    importTickets(tickets, usersMap),
    importMessages(messages, usersMap),
  ]);

  return success();
};

async function importUsers(users) {
  await Promise.all(
    users.map(
      async (u) =>
        await dynamodb
          .put({
            TableName: process.env.USERS_TABLE,
            Item: u,
          })
          .promise()
    )
  );
}

async function importTickets(tickets, usersMap) {
  await Promise.all(
    tickets.map(async (t) => {
      let user = usersMap[t.userId];
      await dynamodb
        .put({
          TableName: process.env.TICKETS_TABLE,
          Item: {
            id: t.id,
            user_id: user.id,
            user,
            title: t.title,
            details: t.details,
            ticket_status: t.status,
            created_at: toIsoStringIfNeeded(t.createdAt),
          },
        })
        .promise();
    })
  );
}

async function importMessages(messages, usersMap) {
  await Promise.all(
    messages.map(async (m) => {
      let user = usersMap[m.userId];
      await dynamodb
        .put({
          TableName: process.env.MESSAGES_TABLE,
          Item: {
            ticket_id: m.ticketId,
            text: m.text,
            timestamp: toIsoStringIfNeeded(m.timestamp),
            user,
          },
        })
        .promise();
    })
  );
}

function toIsoStringIfNeeded(date) {
  return typeof date === "string" ? date : date.toISOString();
}

function usersArrToMap(users) {
  let m = {};
  for (let u of users) {
    m[u.id] = u;
  }
  return m;
}
