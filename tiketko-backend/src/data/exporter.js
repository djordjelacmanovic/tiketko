import { json2xml } from "xml-js";
import XLSX from "xlsx";
import PDFDocument from "pdfkit";
import AWS from "aws-sdk";
import { User } from "../domain/user";
import { Ticket } from "../domain/ticket";
import { Message } from "../domain/message";
import uuid from "uuid/v4";

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

export default async ({ contentType, query: { startDate } }) => {
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
          KeyConditionExpression: startDate
            ? "created_at >= :start_date and user_id = :user_id"
            : "user_id = :user_id",
          ExpressionAttributeValues: {
            ":user_id": user.id,
            ":start_date": startDate,
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

  let outputData = exportToFormat(contentType, data);

  if (!outputData) return;

  let filename = createFileName(contentType);
  let s3Params = {
    Bucket: process.env.STORAGE_BUCKET,
    Key: filename,
  };

  await s3
    .upload({
      ...s3Params,
      Body: outputData,
      ContentType: contentType,
      ContentDisposition: `attachment; filename="${filename}"`,
    })
    .promise();

  return s3.getSignedUrl("getObject", {
    ...s3Params,
    Expires: 60 * 60 * 24,
  });
};

function createFileName(acceptHeader) {
  switch (acceptHeader) {
    case "application/json":
      return `data-export-${uuid()}.json`;
    case "text/xml":
    case "application/xml":
      return `data-export-${uuid()}.xml`;
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.ms-excel":
      return `data-export-${uuid()}.xls`;
    case "application/pdf":
      return `data-export-${uuid()}.pdf`;
  }
}

function exportToFormat(acceptHeader, data) {
  switch (acceptHeader) {
    case "application/json":
      return exportToJson(data);
    case "text/xml":
    case "application/xml":
      return exportToXml(data);
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.ms-excel":
      return exportToXls(data);
    case "application/pdf":
      return exportToPdf(data);
  }
}

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
    type: "buffer",
  });
}

function exportToPdf(data) {
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

  return doc;
}
