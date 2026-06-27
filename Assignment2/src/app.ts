import express, { type Application, type Request, type Response } from "express"
import { authRouter } from "./modules/auth/auth.route";
import logger from "./middleware/logger.middleware";
import { issueRouter } from "./modules/issue/issue.route";
import CookieParser from "cookie-parser"
import globalErrorHandler from "./middleware/globalErrorHnadler";


const app:Application = express()

app.use(CookieParser());
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({extended: true}));

app.use(logger);


app.use("/api/auth", authRouter);
app.use("/api/", issueRouter);




app.use(globalErrorHandler);

export default app