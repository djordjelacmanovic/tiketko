import AWS from "aws-sdk";
import exporter from "../data/exporter";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async ({ Records }) => {
  for (const {
    eventName,
    dynamodb: {
      Keys: {
        id: { S: jobId },
      },
    },
  } of Records) {
    if (eventName != "INSERT") continue;

    let { Item: job } = await dynamodb
      .get({ TableName: process.env.JOBS_TABLE, Key: { id: jobId } })
      .promise();

    try {
      let handler = handlers[job.type];
      if (!handler) return console.error("unknown handler", job);

      job.result = await handler(job.data);
      job.status = "completed";
    } catch (error) {
      console.error(error);
      job.status = "failed";
    }

    job.finished_at = new Date().toISOString();

    await dynamodb
      .put({ TableName: process.env.JOBS_TABLE, Item: job })
      .promise();
  }
};

const handlers = {
  data_export: async (params) => {
    let url = await exporter(params);
    return { url };
  },
};
