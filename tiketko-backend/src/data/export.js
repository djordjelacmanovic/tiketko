import { badRequest, success, unauthorized } from "../lib/response";
import { json2xml } from "xml-js";
import XLSX from "xlsx";
import getStream from "get-stream";
import PDFDocument from "pdfkit";
import AWS from "aws-sdk";
import { User } from "../domain/user";
import { Ticket } from "../domain/ticket";
import { Message } from "../domain/message";
const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
  const { headers, requestContext } = event;

  let group = requestContext.authorizer.jwt.claims["cognito:groups"];
  if (!group.includes("admin")) return unauthorized();

  const { Items: userDtos } = await dynamodb
    .scan({
      TableName: process.env.USERS_TABLE,
    })
    .promise();

  let data = await Promise.all(
    userDtos.map(async (ud) => {
      let user = User.fromDto(ud);
      let { Items: ticketDtos } = await dynamodb
        .query({
          TableName: process.env.TICKETS_TABLE,
          IndexName: "TicketsByUserAndTime",
          KeyConditionExpression: "user_id = :user_id",
          ExpressionAttributeValues: {
            ":user_id": user.id,
          },
        })
        .promise();

      let tickets = await Promise.all(
        ticketDtos.map(async (td) => {
          let { Items: messageDtos } = await dynamodb
            .query({
              TableName: process.env.MESSAGES_TABLE,
              KeyConditionExpression: "ticket_id = :ticket_id",
              ExpressionAttributeValues: {
                ":ticket_id": td.id,
              },
            })
            .promise();

          let messages = messageDtos.map((d) => Message.fromDto(d));
          return {
            ...Ticket.fromDto(td),
            messages,
          };
        })
      );

      return { ...user, tickets };
    })
  );

  switch (headers.accept) {
    case "application/json":
      return success(exportToJson(data), {
        "Content-Type": "application/json",
      });
    case "text/xml":
    case "application/xml":
      return success(exportToXml(data), { "Content-Type": headers.accept });
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.ms-excel":
      return success(exportToXls(data).toString("utf-8"), {
        "Content-Type": headers.accept,
      });
    case "application/pdf":
      return success(await exportToPdf(data), {
        "Content-Type": headers.accept,
      });
  }

  return badRequest({ message: "invalid Accept header value." });
};

function exportToJson(data) {
  return JSON.stringify(data);
}

function exportToXml(data) {
  let xmlData = {
    _declaration: {
      _attributes: {
        version: "1.0",
        encoding: "utf-8",
      },
    },
    dataDump: {
      _attributes: {
        exportedOn: new Date().toISOString(),
      },
      user: data.map(({ username, email, id, group, tickets }) => ({
        _attributes: {
          id,
          username,
          email,
          group,
        },
        ticket: tickets.map(
          ({ title, details, status, createdAt, messages }) => ({
            _attributes: { status, createdAt },
            title: { _text: title },
            details: { _text: details },
            message: messages.map(
              ({ user: { username }, timestamp, text }) => ({
                _attributes: { username, timestamp },
                _text: text,
              })
            ),
          })
        ),
      })),
    },
  };

  return json2xml(xmlData, { compact: true, ignoreComment: true, spaces: 4 });
}

function exportToXls(data) {
  let users = data.map(({ id, username, group, email }) => ({
    id,
    username,
    group,
    email,
  }));

  let tickets = data
    .map(({ tickets }) =>
      tickets.map(
        ({
          id,
          user: { id: userId, username },
          title,
          details,
          createdAt,
          status,
        }) => ({
          id,
          userId,
          username,
          title,
          details,
          createdAt,
          status,
        })
      )
    )
    .flat();

  let messages = data
    .map(({ tickets }) => tickets.map(({ messages }) => messages))
    .flat(3)
    .map(({ ticketId, user: { id: userId, username }, text, timestamp }) => ({
      ticketId,
      userId,
      username,
      text,
      timestamp,
    }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(users), "Users");
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(tickets),
    "Tickets"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(messages),
    "Messages"
  );
  return XLSX.write(wb, {
    bookType: "biff8",
    type: "base64",
  });
}

async function exportToPdf(data) {
  const doc = new PDFDocument();

  doc.fontSize(20);
  doc.text(
    `Data Dump on ${new Date().toDateString()} @ ${new Date().toTimeString()}`,
    { width: 410, align: "center" }
  );

  doc.moveDown();

  data.forEach(({ username, email, id, group, tickets }) => {
    doc.fontSize(16);
    let y = doc.y;
    let x = doc.x;
    doc.text(`User: ${username}`, { width: 410, align: "center" });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Email: ${email} (ID: ${id}), Group: ${group}`, {
      align: "center",
      width: 410,
    });
    doc.moveDown();
    if (tickets.length == 0) doc.text("Has no tickets.");
    else {
      tickets.forEach(({ id, createdAt, title, details, status }, i) => {
        doc.text(
          `${i + 1}. [${status}] Ticket ID: ${id}, created on ${createdAt}.`,
          {
            width: 410,
            align: "left",
          }
        );
        doc.moveDown();
        doc.text(title, { width: 410, align: "left", underline: true });
        doc.moveDown();
        doc.fontSize(10);
        doc.text(details, { width: 410, align: "left" });
        doc.moveDown(2);
      });
    }

    doc.rect(x, y, 410, doc.y - y).stroke();
    doc.moveDown();
  });
  doc.end();

  const pdfBuffer = await getStream.buffer(doc);

  return pdfBuffer.toString("base64");
}
