export const buildResponse = (statusCode, body, headers) => {
  let serializedBody = typeof body === "object" ? JSON.stringify(body) : body;
  return {
    statusCode: statusCode,
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type":
        typeof body === "object" ? "application/json" : "text/plain",
      ...headers,
    },
    body: serializedBody,
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
