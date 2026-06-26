import dotenv from "dotenv"

import path from "path"

import { z } from "zod"

import type { SignOptions } from 'jsonwebtoken';

const envSchema = z.object({
    ACCESS_TOKEN_TIME: z.string().min(1, "ACCESS_TOKEN_TIME is required"),
});


dotenv.config({
    path: path.join(process.cwd(), '.env'),
});

const env = envSchema.parse(process.env);

const config = {
    connection_string : process.env.CONNECTION_STRING as string,
    port: process.env.PORT,
    salt: process.env.SALT,
    jwt_secret: process.env.JWT_SECRET as string,
    access_token_time: env.ACCESS_TOKEN_TIME as unknown as NonNullable<SignOptions['expiresIn']>,
}

export default config