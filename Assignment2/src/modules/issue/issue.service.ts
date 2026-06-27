import { stat } from "node:fs";
import { pool } from "../../db";
import type { IIssue, IUser } from "./issue.interface";
import jwt, { type JwtPayload } from 'jsonwebtoken'


const createIssueIntoDB = async (payload: IIssue, reporter_id: number) => {

    const { title, description, type, status } = payload;



    const allTypes = ['bug', 'feature_request'] as const;

    // const allStatus = ["open", "in_progress", "resolved"] as const;


    if (!allTypes.includes(type)) {
        throw new Error("Invalid type!");
    }


    const result = await pool.query(`
        INSERT INTO issues (title, description, type, status, reporter_id)
        VALUES ($1, $2, $3, COALESCE($4, 'open'), $5) RETURNING *
        `, [title, description, type, status, reporter_id])


    return result;


}

const getAllIssuesFromDB = async (sort: string = "newest", type?: string, status?: string) => {

    const conditions: string[] = [];
    const values: any[] = [];

    let queryText: string = `SELECT * FROM issues `;

    if (type === 'bug' || type === 'feature_request') {
        values.push(type);

        conditions.push(`type = $${values.length}`);
    }

    if (status === 'open' || status === 'in_progress' || status === 'resolved') {
        values.push(status);
        conditions.push(`status = $${values.length}`);
    }
    if (conditions.length > 0) {
        queryText += ' WHERE ' + conditions.join(' AND ');
    }


    if (sort === 'oldest') {
        queryText += ' ORDER BY created_at ASC';
    } else {
        queryText += ' ORDER BY created_at DESC';
    }

    const allIssuesResult = await  pool.query(queryText, values);

    const  allIssues = allIssuesResult.rows;

    // console.log(allIssues);

    if(allIssues.length === 0){
        return []
    }

    const allUniqueReporterId = [...new Set(allIssues.map(issue => issue.reporter_id))];

    const allReporterResult = await pool.query(
        `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`, 
        [allUniqueReporterId]);
    
    const reporterMap = allReporterResult.rows.reduce<Record<number, IUser>>((singleReporterMap, user) => {
        singleReporterMap[user.id] = user;
        return  singleReporterMap;
    }, {})

    return allIssues.map(issue => {
        const {reporter_id,  updated_at, created_at, ...issueData } = issue;

        return {
            ...issueData,
            reporter: reporterMap[reporter_id] || null,
            created_at,
            updated_at,
       
        }
    })



}


const getSingleIssueFromDB = async (id: number) => {
    const issueResult = await pool.query(`
        SELECT * FROM issues WHERE id = $1
        `,[id]);

        const issue = issueResult.rows[0];

        const reporterResult = await pool.query(`SELECT id, name, role FROM users WHERE id = $1`,[issue.reporter_id]);

        const reporter = reporterResult.rows[0] || null;

        const { reporter_id, created_at, updated_at, ...issueData } = issue;

        return {
            ...issueData,
            reporter,
            created_at,
            updated_at
        }
        
}

const updateIssueIntoDB = async (payload: IIssue, id: number) => {
    const { title, description, type } = payload;
    const result = await pool.query(`
        UPDATE issues SET
        title=COALESCE($1, title),
        description=COALESCE($2, description),
        type=COALESCE($3, type),
   
        updated_at=NOW()
        WHERE id=$4
        RETURNING *
        `, [title, description, type,  id])

    return result;
}


const deleteIssueFromDB = async (id: number) => {

    const result = await pool.query(`
        DELETE FROM issues WHERE id=$1 RETURNING id
        `, [id])

    if (result.rows.length === 0) {
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