import jose from "node-jose";
import fetch from "node-fetch";
import Verifier from "verify-cognito-token";

const params = {
  region: process.env.AWS_REGION,
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  debug: true,
};

export const parseToken = (token) => {
  const [encHeader, encPayload, signature] = token.split(".");
  let header = JSON.parse(jose.util.base64url.decode(encHeader));
  let payload = JSON.parse(jose.util.base64url.decode(encPayload));

  return {
    header,
    payload,
    signature,
  };
};

export const verifyToken = async (token) => {
  const verifier = new Verifier(params);
  if (!(await verifier.verify(token))) throw new Error("invalid token");

  let parsed = parseToken(token);

  return parsed;
};
