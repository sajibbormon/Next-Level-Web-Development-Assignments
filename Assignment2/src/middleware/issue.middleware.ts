import type { NextFunction, Request, Response } from "express"

import jwt, { type JwtPayload } from "jsonwebtoken"
import config from "../config";
import { pool } from "../db";
import sendResponse from "../utility/sendResponse";




const issueMiddleware = (...roles: any) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {

            const token = req.headers.authorization;

            if (!token) {
                return sendResponse(res, {
                    statusCode: 401,
                    success: false,
                    message: "Unauthorized"
                })
            }

            const decoded = jwt.verify(token as string, config.jwt_secret as string) as JwtPayload;


            const userData = await pool.query(`
                SELECT * FROM users WHERE email=$1
                `, [decoded.email])

            if (userData.rows.length === 0) {

                return sendResponse(res, {
                    statusCode: 401,
                    success: false,
                    message: "Invalid Credentials"
                })
            }

            const user = userData.rows[0];

            if (roles.length && !roles.includes(user.role)) {

                return sendResponse(res, {
                    statusCode: 403,
                    success: false,
                    message: "Forbidden"
                })

            }



            if (req.method === "PATCH" && user.role === "contributor" && (req.params.id)) {
                const issueData = await pool.query(`
                SELECT * FROM issues WHERE id=$1
                `, [req.params.id])

                if (issueData.rowCount === 0) {
                    return sendResponse(res, {
                        statusCode: 404,
                        success: false,
                        message: "Not Found"
                    })
                }


                if (!(issueData.rows[0].reporter_id === user.id) || !(issueData.rows[0].status === "open")) {
                    return sendResponse(res, {
                        statusCode: 403,
                        success: false,
                        message: "Forbidden"
                    })
                }



            }


            if (req.method == "DELETE" && user.role === "maintainer") {

                const issueData = await pool.query(`
                SELECT * FROM issues WHERE id=$1
                `, [req.params.id])

                if (issueData.rowCount === 0) {
                    sendResponse(res, {
                        statusCode: 404,
                        success: false,
                        message: "Not Found"
                    })
                }

            } else if(req.method === "DELETE" && user.role !== "maintainer") {
                return sendResponse(res, {
                    statusCode: 403,
                    success: false,
                    message: "Forbidden"
                })
            }

            req.user = decoded;


            next();

        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                // console.warn(`[Auth] Token expired for ${req.method} ${req.originalUrl}`);

                return sendResponse(res, {
                    statusCode: 401,
                    success: false,
                    message: "Unauthorized"
                })
            }
            next(error);
        }


    }
}

export default issueMiddleware;