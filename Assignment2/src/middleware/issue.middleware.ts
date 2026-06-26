import type { NextFunction, Request, Response } from "express"

import jwt, { type JwtPayload } from "jsonwebtoken"
import config from "../config";
import { pool } from "../db";
import { success } from "zod";



const issueMiddleware = (...roles: any) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {

            const token = req.headers.authorization;

            if (!token) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized access!",

                });
            }

            const decoded = jwt.verify(token as string, config.jwt_secret as string) as JwtPayload;


            const userData = await pool.query(`
                SELECT * FROM users WHERE email=$1
                `, [decoded.email])

            if (userData.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: "User not found!",

                });
            }

            const user = userData.rows[0];

            if (roles.length && !roles.includes(user.role)) {
                res.status(403).json({
                    success: false,
                    message: "Forbidden",
                    data: {}
                });
            }


            if ( req.method == "PUT" && user.role === "contributor"  && (req.params.id)) {
                const issueData = await pool.query(`
                SELECT * FROM issues WHERE id=$1
                `, [req.params.id])

                if(!(issueData.rows[0].reporter_id === user.id)){
                    res.status(403).json({
                        success: false,
                        message: "Forbidden."
                    })
                }
            }


            if ( req.method == "DELETE" && !(user.role === "maintainer")) {
  
                    res.status(403).json({
                        success: false,
                        message: "Forbidden."
                    })
        
            }

            req.user = decoded;


            next();

        } catch (error: any) {
            if(error.name === 'TokenExpiredError'){
                // console.warn(`[Auth] Token expired for ${req.method} ${req.originalUrl}`);
            
            res.status(401).json({
                success: false,
                message: "jwt expired"
            });
            }
            next(error);
        }


    }
}

export default issueMiddleware;