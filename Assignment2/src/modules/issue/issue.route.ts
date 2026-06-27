import { Router } from "express";
import { issueController } from "./issue.controller";
import issueMiddleware from "../../middleware/issue.middleware";
import { USER_ROLE } from "../../types";


const router = Router();

router.post("/issues",  issueMiddleware(USER_ROLE.contributor , USER_ROLE.maintainer), issueController.createIssue);

router.get("/issues", issueMiddleware(USER_ROLE.contributor , USER_ROLE.maintainer), issueController.getAllIssues)


router.get("/issues/:id", issueMiddleware(USER_ROLE.contributor , USER_ROLE.maintainer), issueController.getSingleIssue)

router.patch("/issues/:id", issueMiddleware(USER_ROLE.contributor , USER_ROLE.maintainer), issueController.updateIssue )

router.delete("/issues/:id", issueMiddleware(USER_ROLE.contributor , USER_ROLE.maintainer), issueController.deleteIssue)



export const issueRouter = router