import config from "../../config";
import { pool } from "../../db";
import type { IUser } from "./user.interface"
import bcrypt from "bcrypt"
import jwt, { type JwtPayload } from 'jsonwebtoken'



const signupToDB = async (payload: IUser) => {
   const { name, email, password, role } = payload;

   const hashPassword = await bcrypt.hash(password, Number(config.salt));

   const allowedRole = ['contributor', 'maintainer'] as const;

   if (!allowedRole.includes(role)) {
      throw new Error("Invalid role!");
   }

   const result = await pool.query(`
        INSERT INTO  users (name,  email, password, role) 
        VALUES ($1, $2, $3, COALESCE($4, 'contributer')) RETURNING *  
    `, [name, email, hashPassword, role]);

   delete result.rows[0].password;

   return result;



}


const loginUserIntoDB = async (payload: { email: string, password: string }) => {
   const { email, password } = payload;

   const userData = await pool.query(`
        SELECT * FROM users WHERE email=$1
    `, [email]);

   if (userData.rows.length === 0) {
      throw new Error("Invalid Credentials!");
   }

   const user = userData.rows[0];

   const matchPassword = await bcrypt.compare(password, user.password)

   if (!matchPassword) {
      throw new Error("Invalid Credentials!");
   }

   delete user.password;

   const jwtPayload: JwtPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      update_at: user.update_at
   }

   const token = jwt.sign(jwtPayload, config.jwt_secret as string, { expiresIn: config.access_token_time });

   

   return { token, user }


}



export const authService = {
   signupToDB,
   loginUserIntoDB,

}