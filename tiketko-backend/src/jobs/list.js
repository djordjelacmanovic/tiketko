import AWS from "aws-sdk";
import { success, unauthorized } from "../lib/response";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async ({ requestContext }) => {
  let group = requestContext.authorizer.jwt.claims["cognito:groups"];
  if (!group.includes("admin")) return unauthorized();

  let { Items: jobs } = await dynamodb
    .scan({
      TableName: process.env.JOBS_TABLE,
    })
    .promise();

  return success(jobs);
};
