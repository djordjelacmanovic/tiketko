export const buildResponse = (statusCode, body, headers) => {
  return {
    statusCode: statusCode,
    headers: {
      "Cache-Control": "no-cache",
      ...headers,
    },
    body: typeof body === "object" ? JSON.stringify(body) : body,
  };
};

export const unauthorized = (body) => {
  return buildResponse(401, body || { message: "Unauthorized" });
};

export const notFound = (body) => {
  return buildResponse(404, body || { message: "Not found" });
};

export const success = (body, headers = {}) => {
  return buildResponse(200, body, headers);
};

export const accepted = (body) => {
  return buildResponse(202, body);
};

export const badRequest = (body) => {
  return buildResponse(400, body);
};

export const failure = (body) => {
  return buildResponse(500, body);
};
