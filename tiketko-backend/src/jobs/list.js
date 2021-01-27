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

  return success(
    jobs
      .sort(({ scheduled_at: s1 }, { scheduled_at: s2 }) => {
        if (s1 == s2) return 0;
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
      })
      .reverse()
  );
};
