import { Lambda, DynamoDB } from "aws-sdk";
import { User } from "../domain/user";

const dynamodb = new DynamoDB.DocumentClient();

export const handler = async (event, context) => {
  let { userPoolId, request, userName } = event;
  const lambda = new Lambda();

  let user = new User(
    request.userAttributes.sub,
    userName,
    request.userAttributes.email
  );

  await dynamodb
    .put({
      TableName: process.env.USERS_TABLE,
      Item: user.toDto(),
    })
    .promise();

  const jsonPayload = JSON.stringify({ userPoolId, userName });

  console.log(
    `invoking '${process.env.ADD_USER_TO_GROUP_LAMBDA_NAME}' lambda asynchronously with ${jsonPayload}`
  );

  await lambda
    .invoke({
      InvocationType: "Event",
      Payload: jsonPayload,
      FunctionName: process.env.ADD_USER_TO_GROUP_LAMBDA_NAME,
    })
    .promise();

  context.succeed(event);
};
