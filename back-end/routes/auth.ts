import { Router } from "express";
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodbClient } from "../config/dynamodb";
import { IUserData, IUserModel } from "../common/interfaces";
import { UserStatus } from "../common/enumerations";
import {
    badRequestResponse,
    internalServerErrorResponse,
    okResponse,
} from "../common/responses";
import { sign } from "jsonwebtoken";
import { authorizationMiddleware } from "../middleware/auth-check";

const authRouter = Router();

authRouter.post("/register", async (req, res) => {
    try {
        const data: IUserData = req.body;

        const putCommand = new PutCommand({
            TableName: "users",
            Item: {
                email: data.email,
                password: data.password,
                userStatus: UserStatus.Registered,
            },
        });

        await dynamodbClient.send(putCommand);

        return okResponse(res, {});
    } catch (error) {
        console.error("Error", error);
        return internalServerErrorResponse(res, error);
    }
});

authRouter.post("/login", async (req, res) => {
    try {
        const data: IUserData = req.body;

        const getCommand = new GetCommand({
            TableName: "users",
            Key: {
                email: data.email,
            },
        });
        const getUserResponse = await dynamodbClient.send(getCommand);

        if (!getUserResponse.Item) {
            return badRequestResponse(res, {
                message: "Invalid user credentials",
            });
        }

        const user = getUserResponse.Item as IUserModel;

        if (user.password !== data.password) {
            return badRequestResponse(res, {
                message: "Invalid user credentials",
            });
        }

        if (user.userStatus !== `${UserStatus.LoggedIn}`) {
            const updateCommand = new UpdateCommand({
                TableName: "users",
                Key: {
                    email: data.email,
                },
                UpdateExpression: "set userStatus = :status",
                ExpressionAttributeValues: {
                    ":status": UserStatus.LoggedIn,
                },
                ReturnValues: "ALL_NEW",
            });

            await dynamodbClient.send(updateCommand);
        }

        var token = sign({ email: data.email }, "secret");

        return okResponse(res, { token });
    } catch (error) {
        console.error("Error", error);
        return internalServerErrorResponse(res, error);
    }
});

authRouter.use("/logout", authorizationMiddleware);
authRouter.post("/logout", async (req: any, res) => {
    try {
        const user: IUserModel = req.user;

        const updateCommand = new UpdateCommand({
            TableName: "users",
            Key: {
                email: user.email,
            },
            UpdateExpression: "set userStatus = :status",
            ExpressionAttributeValues: {
                ":status": UserStatus.Registered,
            },
            ReturnValues: "ALL_NEW",
        });

        await dynamodbClient.send(updateCommand);

        return okResponse(res, {});
    } catch (error) {
        console.error("Error", error);
        return internalServerErrorResponse(res, error);
    }
});

export default authRouter;
