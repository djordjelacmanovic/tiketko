import { CognitoIdentityServiceProvider } from "aws-sdk";

export const handler = async (event) => {
  console.log(event);
  let { userPoolId, userName } = event;
  const cognitoISP = new CognitoIdentityServiceProvider({
    apiVersion: "2016-04-18",
  });

  const params = {
    GroupName: "user",
    UserPoolId: userPoolId,
    Username: userName,
  };

  try {
    await cognitoISP.adminAddUserToGroup(params).promise();
  } catch (error) {
    console.error(error);
    throw error;
  }
};
