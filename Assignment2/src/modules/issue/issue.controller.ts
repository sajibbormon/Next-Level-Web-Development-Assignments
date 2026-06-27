import type { Request, Response } from "express";
import { issueService } from "./issue.service";
import type { JwtPayload } from "jsonwebtoken";
import sendResponse from "../../utility/sendResponse";






const createIssue = async (req: Request, res: Response) => {
    try {

        const user = req.user as JwtPayload;

        const user_id = user.id;

        const result = await issueService.createIssueIntoDB(req.body, user_id as number);



        return sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issue created successfully",
            data: result.rows[0]
        })


    } catch (error: any) {

        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: error.message,
            error: error
        })
    }
}


// const getAllIssues = async (req: Request, res: Response) => {
//     try {

//         const { sort = 'newest', type, status } = req.query;

//         let queryText = `SELECT 
//                         i.id, 
//                         i.title, 
//                         i.description, 
//                         i.type, 
//                         i.status, 
//                         json_build_object(
//                             'id', u.id,
//                             'name', u.name,
//                             'role', u.role
//                         ) AS reporter,
//                         i.created_at, 
//                         i.updated_at
//                         FROM issues i
//                         JOIN users u ON i.reporter_id = u.id
//                         `;

//         const conditions: string[] = [];
//         const values: any[] = [];

//         if (type === 'bug' || type === 'feature_request') {
//             values.push(type);

//             conditions.push(`type = $${values.length}`);
//         }

//         if (status === 'open' || status === 'in_progress' || status === 'resolved') {
//             values.push(status);
//             conditions.push(`status = $${values.length}`);
//         }


//         if (conditions.length > 0) {
//             queryText += ' WHERE ' + conditions.join(' AND ');
//         }


//         if (sort === 'oldest') {
//             queryText += ' ORDER BY created_at ASC';
//         } else {
//             queryText += ' ORDER BY created_at DESC';
//         }


//         const result = await issueService.getAllIssuesFromDB(queryText, values);

//         if(result.rows.length  === 0){

//             return sendResponse(res, {
//                 statusCode: 404,
//                 success: false,
//                 message: "Not Found",
                
//             })
//         }


//         return sendResponse(res, {
//             statusCode: 200,
//             success: true,
//             message: "Issues retrived successfully",
//             data: result.rows
//         })


//     } catch (error: any) {

//         return sendResponse(res, {
//             statusCode: 404,
//             success: false,
//             message: error.message,
//         })
//     }
// }







const getAllIssues = async (req: Request, res: Response) => {
    try {

        const { sort, type, status } = req.query;

        const result = await issueService.getAllIssuesFromDB(sort as string, type as string, status as string);

        if(result.length  === 0){

            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: "Not Found",
                
            })
        }


        return sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issues retrived successfully...",
            data: result
        })


    } catch (error: any) {

        return sendResponse(res, {
            statusCode: 404,
            success: false,
            message: error.message,
        })
    }
}







const getSingleIssue = async (req: Request, res: Response) => {
    try {
        const result = await issueService.getSingleIssueFromDB(Number(req.params.id))

        if(result.length  === 0){
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: "Not Found"
            })
        }

        return sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issue retrived successfully",
            data: result
        })
    } catch (error: any) {
        return sendResponse(res, {
            statusCode: 404,
            success: false,
            message: "Not Found"
        })
    }
}


const updateIssue = async (req: Request, res: Response) => {
    try {
        const result = await issueService.updateIssueIntoDB(req.body, Number(req.params.id))
        
        if(result.rows.length  === 0){

            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: "Not Found"
            })
        }
        

        return sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issue updated successfully",
            data: result.rows[0]
        })

    } catch (error: any) {

        return sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message
        })
    }
}

const deleteIssue = async (req: Request, res: Response)=>{
    try {
        const result = await issueService.deleteIssueFromDB(Number(req.params.id))

        if(result.rows.length  === 0){

            return sendResponse(res, {
                statusCode : 404,
                success: false,
                message:"Not Found"
            })
        }

        return sendResponse(res, {
            statusCode: 200,
            success: true, 
             message: "Issue deleted successfully",
        })
        
    } catch (error: any) {

        return sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message
        })
        
    }
}

export const issueController = {
    createIssue,
    getAllIssues,
    getSingleIssue,
    updateIssue,
    deleteIssue
}