# Express TypeScript REST API

A production-ready REST API built with **Express**, **TypeScript**, **MySQL**, and **Sequelize ORM**.

---

## 🗂 Project Structure

```
express-ts-api/
├── src/
│   ├── config/
│   │   ├── db.ts                    # Sequelize TypeScript config
│   │   └── database.js              # Sequelize CLI config (for migrations)
│   ├── controllers/
│   │   └── user.controller.ts       # All user + auth handlers
│   ├── middlewares/
│   │   └── errorHandler.ts          # Validation, 404, global error handler
│   ├── migrations/
│   │   └── 20240101000001-create-users-table.js
│   ├── models/
│   │   ├── User.ts                  # Sequelize User model
│   │   └── index.ts
│   ├── routes/
│   │   ├── auth.routes.ts           # /api/auth/*
│   │   ├── user.routes.ts           # /api/users/*
│   │   └── index.ts                 # Root router + health check
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces
│   ├── validators/
│   │   └── user.validator.ts        # express-validator rules
│   ├── app.ts                       # Express app setup
│   └── index.ts                     # Server entry point
├── .env.example
├── .sequelizerc                     # Sequelize CLI path config
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Setup & Installation

### 1. Clone & Install

```bash
git clone <repo>
cd express-ts-api
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=express_ts_db
DB_USER=root
DB_PASSWORD=your_password
```

### 3. Create MySQL Database

```sql
CREATE DATABASE express_ts_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Run Migrations

```bash
npm run migrate
```

### 5. Start Development Server

```bash
npm run dev
```

### 6. Build for Production

```bash
npm run build
npm start
```

---

## 📡 API Reference

Base URL: `http://localhost:3000/api`

---

### Health Check

```
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": "120s",
  "environment": "development"
}
```

---

### Auth Endpoints

#### Register User

```
POST /api/auth/register
Content-Type: application/json
```

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com"
}
```

**Success Response `201`:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Validation Error `422`:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Must be a valid email address" }
  ]
}
```

---

#### Login (Email Only)

```
POST /api/auth/login
Content-Type: application/json
```

**Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "loginAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### User Endpoints

#### List Users

```
GET /api/users?page=1&limit=10&search=john&sortBy=createdAt&sortOrder=DESC
```

| Query Param | Type   | Default     | Description                                   |
|-------------|--------|-------------|-----------------------------------------------|
| `page`      | number | 1           | Page number                                   |
| `limit`     | number | 10          | Records per page (max 100)                    |
| `search`    | string | ""          | Search in firstName, lastName, email          |
| `sortBy`    | string | createdAt   | Field: firstName, lastName, email, createdAt  |
| `sortOrder` | string | DESC        | ASC or DESC                                   |

**Success Response `200`:**
```json
{
  "success": true,
  "message": "5 user(s) found",
  "data": [ { ... }, { ... } ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

#### Get User by ID

```
GET /api/users/:id
```

**Success Response `200`:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": { "id": 1, "firstName": "John", ... }
}
```

---

#### Update User

```
PUT /api/users/:id
Content-Type: application/json
```

**Body (all fields optional, at least one required):**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com"
}
```

**Success Response `200`:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": { "id": 1, "firstName": "Jane", ... }
}
```

---

#### Soft Delete User

```
DELETE /api/users/:id
```

Sets `isActive = false`. User is hidden from listing but remains in DB.

**Success Response `200`:**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": { "id": 1 }
}
```

---

#### Hard Delete User

```
DELETE /api/users/:id/hard
```

Permanently removes user from the database.

**Success Response `200`:**
```json
{
  "success": true,
  "message": "User permanently deleted",
  "data": { "id": 1 }
}
```

---

## 🗄 Database Schema

```sql
CREATE TABLE users (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  firstName    VARCHAR(100) NOT NULL,
  lastName     VARCHAR(100) NOT NULL,
  email        VARCHAR(255) NOT NULL UNIQUE,
  isActive     BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX users_email_unique (email),
  INDEX users_name_index   (firstName, lastName),
  INDEX users_is_active_index (isActive)
);
```

---

## 🔒 Validation Rules

| Field       | Rules                                                                 |
|-------------|-----------------------------------------------------------------------|
| `firstName` | Required, 2–100 chars, letters/spaces/hyphens/apostrophes only        |
| `lastName`  | Required, 2–100 chars, letters/spaces/hyphens/apostrophes only        |
| `email`     | Required, valid email format, max 255 chars, unique per user          |

---

## ⚡ Features

- ✅ Full TypeScript with strict mode
- ✅ Sequelize ORM with MySQL
- ✅ Database Migrations
- ✅ Request validation with `express-validator`
- ✅ Pagination, search, sorting on list API
- ✅ Soft delete + hard delete
- ✅ Rate limiting with `express-rate-limit`
- ✅ Security headers with `helmet`
- ✅ CORS configured
- ✅ Morgan request logging
- ✅ Global error handling
- ✅ Graceful shutdown

---

## 🛠 Scripts

| Command               | Description                         |
|-----------------------|-------------------------------------|
| `npm run dev`         | Start dev server with hot reload     |
| `npm run build`       | Compile TypeScript to `dist/`        |
| `npm start`           | Run compiled production build        |
| `npm run migrate`     | Run all pending migrations           |
| `npm run migrate:undo`| Revert last migration                |
