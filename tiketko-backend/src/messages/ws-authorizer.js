import { verifyToken } from "../lib/jwt";

export const handler = async (event, context) => {
  console.log(event);
  let encodedToken = event.queryStringParameters.token;
  try {
    let { payload: claims } = await verifyToken(encodedToken);

    console.log(claims);

    let userId = claims.sub;

    const current_ts = Math.floor(new Date() / 1000);
    if (current_ts > claims.exp) {
      context.fail("Token is expired");
    }
    console.log("generate allow policy");

    return generateAllow(userId, event.methodArn);
  } catch (err) {
    console.error(err);
    return generateDeny("me", event.methodArn);
  }
};

const generatePolicy = (principalId, effect, resource) => {
  console.log(principalId, effect, resource);
  let authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    let policyDocument = {};
    policyDocument.Version = "2012-10-17"; // default version
    policyDocument.Statement = [];
    let statementOne = {};
    statementOne.Action = "execute-api:Invoke"; // default action
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  console.log(authResponse);
  return authResponse;
};

const generateAllow = (principalId, resource) => {
  return generatePolicy(principalId, "Allow", resource);
};

const generateDeny = (principalId, resource) => {
  return generatePolicy(principalId, "Deny", resource);
};
