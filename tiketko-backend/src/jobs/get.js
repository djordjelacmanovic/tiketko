import AWS from "aws-sdk";
import { notFound, success, unauthorized } from "../lib/response";
const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async ({ pathParameters: { id } }) => {
  let group = requestContext.authorizer.jwt.claims["cognito:groups"];
  if (!group.includes("admin")) return unauthorized();

  let { Item: job } = await dynamodb
    .get({
      TableName: process.env.JOBS_TABLE,
      Key: { id },
    })
    .promise();

  if (!job) return notFound();

  return success(job);
};
