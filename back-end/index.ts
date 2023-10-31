const env = process.env.NODE_ENV || "development";
import { ConfigureExpressApp } from "./config/express";
import express, { Application } from "express";

const app: Application = express();
ConfigureExpressApp(app);

const port = 5000;

app.post("/", (req, res) => {
    return res.json({ message: "it works" });
});

app.listen(port, () => {
    console.log("Listening on port " + port + "...");
});
