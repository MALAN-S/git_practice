# Xerox Shop Management System

A full‑stack web application to run a small Xerox and stationery shop.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, React Router, Axios, Recharts
- **Backend**: Java 17, Spring Boot, Spring Data JPA, Spring Security, Flyway
- **Database**: PostgreSQL

## Project Structure
```
xerox-shop-management/
│
├─ backend/                     # Spring Boot API
│   ├─ src/main/java/com/xeroxshop/
│   │   ├─ XeroxShopApplication.java
│   │   ├─ config/               # Security, Swagger, etc.
│   │   ├─ controller/           # REST controllers
│   │   ├─ dto/                  # Request/Response DTOs
│   │   ├─ exception/            # Global exception handling
│   │   ├─ model/                # JPA entities
│   │   ├─ repository/           # Spring Data repos
│   │   └─ service/              # Business logic
│   └─ src/main/resources/
│       ├─ application.properties
│       └─ db/migration/         # Flyway scripts (V1__init.sql …)
│
├─ frontend/                    # React SPA
│   ├─ public/
│   └─ src/
│       ├─ components/         # UI components (Sidebar, Card, etc.)
│       ├─ pages/              # Route pages (Dashboard, POS, …)
│       ├─ services/           # Axios API wrapper
│       ├─ router/             # React Router configuration
│       └─ App.js
│
├─ README.md                    # This file
└─ .gitignore
```

## Prerequisites
- JDK 17+ installed
- Maven 3.9+ (or use the wrapper) 
- Node.js 20+ and npm/yarn
- PostgreSQL running locally (default port 5432)

## Setup
### 1. Database
```bash
# Create a database named xerox_shop (you can choose any name)
psql -U postgres -c "CREATE DATABASE xerox_shop;"
```
The Flyway migration `V1__init.sql` will create all tables on application start.

### 2. Backend
```bash
cd backend
# Install dependencies and build
mvn clean install
# Run the application (will start on http://localhost:8080)
./mvnw spring-boot:run
```
The first run will apply Flyway migrations.

### 3. Frontend
```bash
cd ../frontend
npm install
npm run dev   # Vite dev server (http://localhost:5173)
```
The frontend expects the backend API at `http://localhost:8080/api` – you can adjust the base URL in `src/services/api.js`.

## Next Steps
The repository now contains:
- **Database schema** (`V1__init.sql`)
- **Backend skeleton** (Spring Boot main class, security config, a simple authentication controller, and the User entity)
- **Frontend skeleton** (React entry point, Tailwind setup, router placeholder)
- **README** with setup instructions (this file)

From here we will iteratively implement each module (Dashboard, Product Management, Service Rates, POS, Inventory, Reports, Expenses, Bill History, User Management, Settings). Before each module we will:
1. Explain its purpose.
2. List the files that will be added/modified.
3. Write the beginner‑friendly code.
4. Test the endpoints/pages.

Feel free to run the steps above and let me know which module you’d like to start with, or if any changes are needed to the project layout.

