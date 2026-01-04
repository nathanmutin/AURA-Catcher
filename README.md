# AURA Catcher

## Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **MariaDB**: Required for local development.
- **Docker**: Required for production deployment.

### Configuration

1.  **Backend**:
    -   Navigate to `backend/`.
    -   Copy `.env.example` to `.env`.
    -   Fill in your database credentials:
        ```ini
        DB_HOST=localhost
        DB_PORT=3306
        DB_USER=root
        DB_PASSWORD=your_password
        DB_NAME=aura_catcher
        ```

2.  **Frontend**:
    -   Navigate to `frontend/`.
    -   Copy `.env.example` to `.env.local`.
    -   Ensure the API URL matches your backend:
        ```ini
        VITE_API_URL=http://localhost:3000
        ```

### Development Setup (Manual)

If you want to run the application locally without Docker:

1.  **Database Setup**:
    -   Start your local MariaDB server.
    -   Create the database using a SQL client or CLI:
        ```sql
        CREATE DATABASE aura_catcher;
        ```

2.  **Start Backend**:
    ```bash
    cd backend
    npm install
    npm run dev
    ```
    The backend will start on [http://localhost:3000](http://localhost:3000).

3.  **Start Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    The frontend will start on [http://localhost:5174](http://localhost:5174) (or the port shown in your terminal).

### Production Setup (Docker)

To run the entire stack (Frontend, Backend, and MariaDB) in containers:

1.  From the project root:
    ```bash
    docker compose --env-file ./backend/.env up --build
    ```

2.  Access the application:
    -   **Frontend**: [http://localhost:8080](http://localhost:8080)
    -   **Backend**: Internal only.

## Project Structure

- `frontend/`: React + Vite application.
- `backend/`: Node.js + Express server and data.
- `frontend/src/utils/panelLayout.ts`: Core logic for calculating the panel SVG geometry (Isomorphic).
- `frontend/src/utils/panelRenderers.tsx`: React and String renderers for the panel.
