import { badRequest, success, unauthorized } from "../lib/response";
import uuid from "uuid/v4";
import AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
  const { requestContext, queryStringParameters } = event;

  let group = requestContext.authorizer.jwt.claims["cognito:groups"];
  if (!group.includes("admin")) return unauthorized();

  let { format } = queryStringParameters;

  if (!["json", "xml", "pdf", "xls"].includes(format))
    return badRequest({
      message: `format ${format} is not a valid export format.`,
    });

  let data = { format, query: queryStringParameters };
  let job = {
    id: uuid(),
    status: "pending",
    type: "data_export",
    data,
    scheduled_at: new Date().toISOString(),
  };

  await dynamodb
    .put({
      TableName: process.env.JOBS_TABLE,
      Item: job,
    })
    .promise();

  return success({ jobId: job.id });
};
