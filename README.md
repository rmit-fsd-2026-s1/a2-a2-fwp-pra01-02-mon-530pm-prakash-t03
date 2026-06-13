[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=23992247&assignment_repo_type=AssignmentRepo)

# Venue Vendors Full Stack Application

This repository has been restructured into **four separate projects** to fulfill the requirements of Assignment 2 (specifically separating the main client system from the admin controls):

1. **`frontend/`**: The React TS client app for Hirers and Vendors.
2. **`backend/`**: The Node/Express REST API serving the main client.
3. **`admin-frontend/`**: The standalone Admin Console React TS app (isolated from the main client).
4. **`admin-backend/`**: The standalone Admin GraphQL API.

---

## Port Assignments & Services

*   **Main Customer Frontend**: `http://localhost:5173`
*   **Main Customer REST Backend**: `http://localhost:5000`
*   **Admin Dashboard Frontend**: `http://localhost:5174`
*   **Admin GraphQL Backend**: `http://localhost:5001`

---

## Database Configuration

All backend services share a MySQL database. Ensure your local MySQL server is active.

### 1. Main REST Backend Setup
In the `backend/` directory, configure the `.env` file:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=venue_vendors
JWT_SECRET=your_jwt_secret_here
```

### 2. Admin GraphQL Backend Setup
In the `admin-backend/` directory, configure the `.env` file:
```env
PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=venue_vendors
JWT_SECRET=your_jwt_secret_here
```

### 3. Database Sync
TypeORM is configured with `synchronize: true` in development mode, which automatically creates the necessary database schema and tables upon backend server initialization.

---

## Running the Application Locally

To start the dev servers, run the respective commands in separate terminal shells:

### 1. Main Client Website
```bash
cd frontend
npm run dev
```

### 2. Main REST API
```bash
cd backend
npm run dev
```

### 3. Admin Dashboard
```bash
cd admin-frontend
npm run dev
```

### 4. Admin GraphQL Server
```bash
cd admin-backend
npm run dev
```

---

## Testing Verification

Unit tests are included for both backend environments to verify the integrity of the endpoints:

### Main Backend Tests (REST)
Includes 6 unit tests validating Auth validation, JWT middleware, document credibility scores, and REST CRUD actions:
```bash
cd backend
npm run test
```

### Admin Backend Tests (GraphQL)
Includes 6 unit tests validating Admin GraphQL login credentials (`admin` / `admin`), queries, and administrative mutations:
```bash
cd admin-backend
npm run test
```
