

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
import { z } from "zod";
var envSchema = z.object({
  ACCESS_TOKEN_TIME: z.string().min(1, "ACCESS_TOKEN_TIME is required")
});
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var env = envSchema.parse(process.env);
var config = {
  connection_string: process.env.CONNECTION_STRING,
  port: process.env.PORT,
  salt: process.env.SALT,
  jwt_secret: process.env.JWT_SECRET,
  access_token_time: env.ACCESS_TOKEN_TIME
};
var config_default = config;

// src/db/index.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      name VARCHAR(50),
      email VARCHAR(40) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(15) DEFAULT 'contributor',
      created_at TIMESTAMP DEFAULT NOW(),
      update_at TIMESTAMP DEFAULT NOW()
      
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues(
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL CHECK (char_length(TRIM(description)) >= 20),
      type VARCHAR(15),
      status VARCHAR(12) DEFAULT 'open',
      reporter_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()

      )
    `);
    console.log("Database connected successful!");
  } catch (error2) {
    console.log(error2);
  }
};

// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var signupToDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, Number(config_default.salt));
  const allowedRole = ["contributor", "maintainer"];
  if (!allowedRole.includes(role)) {
    throw new Error("Invalid role!");
  }
  const result = await pool.query(`
        INSERT INTO  users (name,  email, password, role) 
        VALUES ($1, $2, $3, COALESCE($4, 'contributer')) RETURNING *  
    `, [name, email, hashPassword, role]);
  delete result.rows[0].password;
  return result;
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(`
        SELECT * FROM users WHERE email=$1
    `, [email]);
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials!");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid Credentials!");
  }
  delete user.password;
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    update_at: user.update_at
  };
  const token = jwt.sign(jwtPayload, config_default.jwt_secret, { expiresIn: config_default.access_token_time });
  return { token, user };
};
var authService = {
  signupToDB,
  loginUserIntoDB
};

// src/modules/auth/auth.controller.ts
import "zod";

// src/utility/sendResponse.ts
import "console";
import "zod";
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/modules/auth/auth.controller.ts
var signupUser = async (req, res) => {
  try {
    const result = await authService.signupToDB(req.body);
    return sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error2) {
    return sendResponse_default(res, {
      statusCode: 400,
      success: false,
      message: error2.message
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error2) {
    return sendResponse_default(res, {
      statusCode: 401,
      success: false,
      message: error2.message
    });
  }
};
var authController = {
  loginUser,
  signupUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signupUser);
router.post("/login", authController.loginUser);
var authRouter = router;

// src/middleware/logger.middleware.ts
import fs from "fs";
var logger = (req, res, next) => {
  console.log(`Method: ${req.method} - URL: ${req.url} - Time: ${Date.now()}`);
  const log = `Method: ${req.method} - URL: ${req.url} - Time: ${Date.now()}`;
  fs.appendFile("logger.txt", log, (err) => {
  });
  next();
};
var logger_middleware_default = logger;

// src/modules/issue/issue.route.ts
import { Router as Router2 } from "express";

// src/modules/issue/issue.service.ts
import "fs";
import "jsonwebtoken";
var createIssueIntoDB = async (payload, reporter_id) => {
  const { title, description, type, status } = payload;
  const allTypes = ["bug", "feature_request"];
  if (!allTypes.includes(type)) {
    throw new Error("Invalid type!");
  }
  const result = await pool.query(`
        INSERT INTO issues (title, description, type, status, reporter_id)
        VALUES ($1, $2, $3, COALESCE($4, 'open'), $5) RETURNING *
        `, [title, description, type, status, reporter_id]);
  return result;
};
var getAllIssuesFromDB = async (sort = "newest", type, status) => {
  const conditions = [];
  const values = [];
  let queryText = `SELECT * FROM issues `;
  if (type === "bug" || type === "feature_request") {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }
  if (status === "open" || status === "in_progress" || status === "resolved") {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (conditions.length > 0) {
    queryText += " WHERE " + conditions.join(" AND ");
  }
  if (sort === "oldest") {
    queryText += " ORDER BY created_at ASC";
  } else {
    queryText += " ORDER BY created_at DESC";
  }
  const allIssuesResult = await pool.query(queryText, values);
  const allIssues = allIssuesResult.rows;
  if (allIssues.length === 0) {
    return [];
  }
  const allUniqueReporterId = [...new Set(allIssues.map((issue) => issue.reporter_id))];
  const allReporterResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
    [allUniqueReporterId]
  );
  const reporterMap = allReporterResult.rows.reduce((singleReporterMap, user) => {
    singleReporterMap[user.id] = user;
    return singleReporterMap;
  }, {});
  return allIssues.map((issue) => {
    const { reporter_id, updated_at, created_at, ...issueData } = issue;
    return {
      ...issueData,
      reporter: reporterMap[reporter_id] || null,
      created_at,
      updated_at
    };
  });
};
var getSingleIssueFromDB = async (id) => {
  const issueResult = await pool.query(`
        SELECT * FROM issues WHERE id = $1
        `, [id]);
  const issue = issueResult.rows[0];
  if (!issue) {
    throw new Error("Not Found");
  }
  const reporterResult = await pool.query(`SELECT id, name, role FROM users WHERE id = $1`, [issue.reporter_id]);
  const reporter = reporterResult.rows[0] || null;
  const { reporter_id, created_at, updated_at, ...issueData } = issue;
  return {
    ...issueData,
    reporter,
    created_at,
    updated_at
  };
};
var updateIssueIntoDB = async (payload, id) => {
  const { title, description, type } = payload;
  const result = await pool.query(`
        UPDATE issues SET
        title=COALESCE($1, title),
        description=COALESCE($2, description),
        type=COALESCE($3, type),
   
        updated_at=NOW()
        WHERE id=$4
        RETURNING *
        `, [title, description, type, id]);
  if (result.rows.length === 0) {
    throw new Error("Not Found");
  }
  return result;
};
var deleteIssueFromDB = async (id) => {
  const result = await pool.query(`
        DELETE FROM issues WHERE id=$1 RETURNING id
        `, [id]);
  if (result.rows.length === 0) {
    throw new Error("Not Found");
  }
  return result;
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};

// src/modules/issue/issue.controller.ts
var createIssue = async (req, res) => {
  try {
    const user = req.user;
    const user_id = user.id;
    const result = await issueService.createIssueIntoDB(req.body, user_id);
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue created successfully",
      data: result.rows[0]
    });
  } catch (error2) {
    return sendResponse_default(res, {
      statusCode: 400,
      success: false,
      message: error2.message,
      error: error2
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const { sort, type, status } = req.query;
    const result = await issueService.getAllIssuesFromDB(sort, type, status);
    if (result.length === 0) {
      return sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Not Found"
      });
    }
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrived successfully...",
      data: result
    });
  } catch (error2) {
    return sendResponse_default(res, {
      statusCode: 404,
      success: false,
      message: error2.message
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const result = await issueService.getSingleIssueFromDB(Number(req.params.id));
    if (result.length === 0) {
      return sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Not Found"
      });
    }
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrived successfully",
      data: result
    });
  } catch (error2) {
    return sendResponse_default(res, {
      statusCode: 404,
      success: false,
      message: "Not Found"
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const result = await issueService.updateIssueIntoDB(req.body, Number(req.params.id));
    if (result.rows.length === 0) {
      return sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Not Found"
      });
    }
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result.rows[0]
    });
  } catch (error2) {
    return sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error2.message
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const result = await issueService.deleteIssueFromDB(Number(req.params.id));
    console.log(result);
    if (result.rows.length === 0) {
      return sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Not Found"
      });
    }
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error2) {
    return sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error2.message
    });
  }
};
var issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/issue.middleware.ts
import jwt3 from "jsonwebtoken";
var issueMiddleware = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return sendResponse_default(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized"
        });
      }
      const decoded = jwt3.verify(token, config_default.jwt_secret);
      const userData = await pool.query(`
                SELECT * FROM users WHERE email=$1
                `, [decoded.email]);
      if (userData.rows.length === 0) {
        return sendResponse_default(res, {
          statusCode: 401,
          success: false,
          message: "Invalid Credentials"
        });
      }
      const user = userData.rows[0];
      if (roles.length && !roles.includes(user.role)) {
        return sendResponse_default(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden"
        });
      }
      if (req.method === "PATCH" && user.role === "contributor" && req.params.id) {
        const issueData = await pool.query(`
                SELECT * FROM issues WHERE id=$1
                `, [req.params.id]);
        if (issueData.rowCount === 0) {
          return sendResponse_default(res, {
            statusCode: 404,
            success: false,
            message: "Not Found"
          });
        }
        if (!(issueData.rows[0].reporter_id === user.id) || !(issueData.rows[0].status === "open")) {
          return sendResponse_default(res, {
            statusCode: 403,
            success: false,
            message: "Forbidden"
          });
        }
      }
      if (req.method == "DELETE" && user.role === "maintainer") {
        const issueData = await pool.query(`
                SELECT * FROM issues WHERE id=$1
                `, [req.params.id]);
        if (issueData.rowCount === 0) {
          sendResponse_default(res, {
            statusCode: 404,
            success: false,
            message: "Not Found"
          });
        }
      } else {
        return sendResponse_default(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden"
        });
      }
      req.user = decoded;
      next();
    } catch (error2) {
      if (error2.name === "TokenExpiredError") {
        return sendResponse_default(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized"
        });
      }
      next(error2);
    }
  };
};
var issue_middleware_default = issueMiddleware;

// src/types/index.ts
var USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/modules/issue/issue.route.ts
var router2 = Router2();
router2.post("/issues", issue_middleware_default(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.createIssue);
router2.get("/issues", issue_middleware_default(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.getAllIssues);
router2.get("/issues/:id", issue_middleware_default(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.getSingleIssue);
router2.patch("/issues/:id", issue_middleware_default(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.updateIssue);
router2.delete("/issues/:id", issue_middleware_default(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.deleteIssue);
var issueRouter = router2;

// src/app.ts
import CookieParser from "cookie-parser";

// src/middleware/globalErrorHnadler.ts
var globalErrorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
var globalErrorHnadler_default = globalErrorHandler;

// src/app.ts
var app = express();
app.use(CookieParser());
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(logger_middleware_default);
app.use("/api/auth", authRouter);
app.use("/api/", issueRouter);
app.use((req, res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
});
app.use(globalErrorHnadler_default);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map