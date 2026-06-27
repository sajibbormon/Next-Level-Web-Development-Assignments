import type { Request, Response } from "express";
import { authService } from "./auth.service";
import { success } from "zod";
import sendResponse from "../../utility/sendResponse";


const signupUser = async (req: Request, res: Response) => {
    try {
        const result = await authService.signupToDB(req.body);

        return sendResponse(res, {
            statusCode: 201,
            success: true,
            message: "User registered successfully",
            data: result.rows[0]
        })

    } catch (error: any) {

        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: error.message
        })
    }
}

const loginUser = async (req: Request, res: Response) => {
    try {
        const result = await authService.loginUserIntoDB(req.body);

        return sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Login successful",
            data: result
        })

    } catch (error: any) {

        return sendResponse(res, {
            statusCode: 401,
            success: false,
            message: error.message
        })
    }
}




export const authController = {
    loginUser,
    signupUser,
    
}