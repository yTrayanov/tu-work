import { verify } from "jsonwebtoken";
import { badRequestResponse, unauthorized } from "../common/responses";
import { dynamodbClient } from "../config/dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { IUserData } from "../common/interfaces";
import { UserStatus } from "../common/enumerations";

export const authorizationMiddleware = async (
    req: any,
    res: any,
    next: any
) => {
    if (!req.headers.authorization) {
        return unauthorized(res, { message: "User is not authorized" });
    }

    // get the last part from a authorization header string like "bearer token-value"
    const token = req.headers.authorization.split(" ")[1];

    // decode the token using a secret key-phrase
    const { email } = verify(token, "secret") as { email: string };

    const getCommand = new GetCommand({
        TableName: "users",
        Key: {
            email: email,
        },
    });
    const getUserResponse = await dynamodbClient.send(getCommand);

    if (!getUserResponse.Item) {
        return badRequestResponse(res, { message: "User not found" });
    }

    if (getUserResponse.Item.userStatus !== UserStatus.LoggedIn) {
        return unauthorized(res, {});
    }

    req.user = getUserResponse.Item as IUserData;

    return next();
};
