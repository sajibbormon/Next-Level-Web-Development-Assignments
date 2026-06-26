import type { NextFunction, Request, Response } from "express";
import fs from "fs";

const logger = (req: Request, res: Response, next: NextFunction) =>{
    console.log(`Method: ${req.method} - URL: ${req.url} - Time: ${Date.now()}`);

    const log = `Method: ${req.method} - URL: ${req.url} - Time: ${Date.now()}`;
    fs.appendFile('logger.txt', log, (err)=>{
        // next(err);
    });
    next();


}

export default logger;