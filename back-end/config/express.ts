import cors from "cors";
import authRouter from "../routes/auth";
import { Application, urlencoded } from "express";
import { json } from "body-parser";
import pdfRouter from "../routes/pdf";

export const ConfigureExpressApp = (app: Application) => {
    app.use(cors());
    app.use(
        urlencoded({
            extended: true,
        })
    );
    app.use(json());

    // routes
    app.use("/auth", authRouter);
    app.use("/pdf", pdfRouter);
};
