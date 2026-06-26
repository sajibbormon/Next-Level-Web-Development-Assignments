import { stat } from "node:fs";
import { pool } from "../../db";
import type { IIssue } from "./issue.interface";
import jwt, { type JwtPayload } from 'jsonwebtoken'


const createIssueIntoDB = async (payload: IIssue, reporter_id: number) => {

    const {title, description , type,  status } = payload;



    const allTypes = ['bug', 'feature_request'] as const;

    // const allStatus = ["open", "in_progress", "resolved"] as const;


    if(!allTypes.includes(type)){
        throw new Error("Invalid type!");
    }

    // if(!allStatus.includes(status)){
    //  throw new Error("Invalid status!");   
    // }

    //need to add validation before submitting the report.
    const result = await pool.query(`
        INSERT INTO issues (title, description, type, status, reporter_id)
        VALUES ($1, $2, $3, COALESCE($4, 'open'), $5) RETURNING *
        `, [title, description, type, status, reporter_id])

        // console.log(result.rows[0]);
     return result;


}

const getAllIssuesFromDB = async(queryText : string, values: string[]) => {
    
    // console.log(queryText, values)
    
    const result = await pool.query(queryText, values)

    return result;

}


const getSingleIssueFromDB = async (id: number) => {
    const result = await pool.query(`
        SELECT 
        i.id, 
        i.title, 
        i.description, 
        i.type, 
        i.status, 
        json_build_object(
            'id', u.id,
            'name', u.name,
            'role', u.role
        ) AS reporter,
        i.created_at, 
        i.updated_at
        FROM issues i
        JOIN users u ON i.reporter_id = u.id
        WHERE i.id = $1
        `,[id])

    return result;
}

const updateIssueIntoDB = async (payload: IIssue, id: number) => {
    const {title, description, type, status } = payload;
    const result = await pool.query(`
        UPDATE issues SET
        title=COALESCE($1, title),
        description=COALESCE($2, description),
        type=COALESCE($3, type),
        status=COALESCE($4, status)
        WHERE id=$5
        RETURNING *
        `, [title, description, type, status, id])

        return result;
}


const deleteIssueFromDB = async (id: number)=> {

    const result = await pool.query(`
        DELETE FROM issues WHERE id=$1 RETURNING id
        `,[id]) 

    if(result.rows.length === 0){
        throw new Error("Not Found")
    }

    return result;

}

export const issueService = {
    createIssueIntoDB,
    getAllIssuesFromDB,
    getSingleIssueFromDB,
    updateIssueIntoDB,
    deleteIssueFromDB

}