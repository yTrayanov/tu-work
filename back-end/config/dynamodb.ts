import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { fromIni } from "@aws-sdk/credential-provider-ini";

const emptyCredentials = fromIni({ profile: "default" });

const dynamodb = new DynamoDB({
    endpoint: "http://127.0.0.1:4566",
    region: "us-east-1",
    credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
    },
});

export const dynamodbClient = DynamoDBDocumentClient.from(dynamodb);
