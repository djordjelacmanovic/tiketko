import { success } from "../lib/response";

// eslint-disable-next-line import/prefer-default-export
export const hello = async (event) => {
  return success({
    message: "Go Serverless Webpack (Ecma Script) v1.0! Second module!",
    input: event,
  });
};
