import type { Request, Response } from "express";
import { authService } from "./auth.service";
import { success } from "zod";


const signupUser = async (req: Request, res: Response) => {
    try {
        const result = await authService.signupToDB(req.body);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: result.rows[0]
        })

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

const loginUser = async (req: Request, res: Response) => {
    try {
        const result = await authService.loginUserIntoDB(req.body);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: result
        })

    } catch (error: any) {
        return res.status(401).json({
            success: false,
            message: error.message,
        })
    }
}




export const authController = {
    loginUser,
    signupUser,
}