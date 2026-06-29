# DevPulse Issue Tracker (B7A2)

An Issue Tracking and Management API built with Node.js, Express, TypeScript, and PostgreSQL. This platform allows users to act as contributors or maintainers to report bugs, request features, and manage issue workflows. 

## 🚀 Live URL
> **[https://programming-hero-assignment2.vercel.app]** 

## ✨ Features
* **Role-Based Authentication:** Secure user registration and login utilizing JSON Web Tokens (JWT). Users can register as a `contributor` or `maintainer`.
* **Security & Authorization:** Protected routes reject unauthorized requests. Passwords are never exposed in responses or logs, and role verification is strictly enforced before privileged operations.
* **Advanced Querying:** Fetch issues using dynamic sorting (`newest`, `oldest`) and filtering by `type` (`bug`, `feature_request`) and `status` (`open`, `in_progress`, `resolved`).
* **Optimized Database Queries:** Includes relationship "hydration" (stitching the user data into the issue data) using batched queries instead of standard SQL `JOIN`s to prevent N+1 query problems. 
* **Modular Architecture:** Built using the clean Controller-Service pattern with strict TypeScript typings.
* **Centralized Error Handling:** Gracefully handles invalid routes, database errors, and validation constraints using global error-handling middleware.

## 🛠 Tech Stack
* **Runtime / Framework:** Node.js, Express.js
* **Language:** TypeScript
* **Database:** PostgreSQL 
* **Security:** JWT (JSON Web Tokens)
* **Deployment:** Deployed: Vercel & Database: NeonDB 

---

## 🗄 Database Schema Summary

### `users` Table
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Auto-incrementing unique identifier |
| `name` | String | Full name of the user |
| `email` | String | Unique email address |
| `password` | String | Hashed password |
| `role` | String | Either `contributor` or `maintainer` |
| `created_at` | Timestamp | Date of registration |
| `updated_at` | Timestamp | Date of last update |

### `issues` Table
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Auto-incrementing unique identifier |
| `title` | String | Short descriptive headline (Max: 150 chars) |
| `description`| String | Detailed explanation (Min: 20 chars) |
| `type` | String | Either `bug` or `feature_request` |
| `status` | String | `open`, `in_progress`, or `resolved` (Defaults to `open`) |
| `reporter_id`| Integer | References the user who created the issue |
| `created_at` | Timestamp | Date the issue was logged |
| `updated_at` | Timestamp | Date the issue was last modified |

---

## 🔌 API Endpoints Specification

### 1. User Registration
* **Endpoint:** `POST /api/auth/signup`
* **Access:** Public
* **Description:** Register a new account with the role of `contributor` or `maintainer`.

### 2. User Login
* **Endpoint:** `POST /api/auth/login`
* **Access:** Public
* **Description:** Authenticate user credentials and receive a JWT token.

### 3. Create Issue
* **Endpoint:** `POST /api/issues`
* **Access:** Authenticated users (`contributor`, `maintainer`)
* **Description:** Log a new bug report or feature request. Extracts the `reporter_id` securely from the decoded JWT payload.

### 4. Get All Issues
* **Endpoint:** `GET /api/issues`
* **Access:** Authenticated users
* **Query Parameters:** `sort` (newest/oldest), `type`, `status`.
* **Description:** Retrieve all issues and only authenticate users can access.

### 5. Get Single Issue
* **Endpoint:** `GET /api/issues/:id` 
* **Access:** Authenticated users
* **Description:** Retrieve a single issue by its ID, only authenticate users can access.

### 6. Update Issue
* **Endpoint:** `PATCH /api/issues/:id`
* **Access:** Authenticated users
* **Description:** Dynamically apply partial updates to an issue (Maintainer can update all issues. Contributer can update own issue only if the `status` = `open` ).

### 7. Delete Issue
* **Endpoint:** `DELETE /api/issues/:id`
* **Access:** Authenticated users (Only Maintainer)
* **Description:** Safely remove an issue from the database. Will return a 404 error if the issue does not exist.

---

## ⚙️ Local Setup Instructions

**1. Clone the repository:**
```bash
git clone <https://github.com/sajibbormon/Next-Level-Web-Development-Assignments>
