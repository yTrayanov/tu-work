import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
    endpoint: "http://127.0.0.1:4566",
    region: "us-east-1",
    credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
    },
});
