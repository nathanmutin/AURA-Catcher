# AURA Catcher

AURA Catcher is a web application designed to reference "La Région aide..." signs. It features an interactive map where users can view details and photos of signs, and allows for collaborative submissions by uploading photos with automatic geolocation extracted from EXIF data. The project also includes "AURA Farmer," a tool for generating custom signs.

## Project Structure

The project is organized into two main components:

-   **Frontend** (`frontend/`): A React application built with Vite, providing the user interface for the map and sign generator.
-   **Backend** (`backend/`): A Node.js and Express server that handles API requests, database interactions (MariaDB), and file storage.

**Key Files:**
-   `backend/src/types.ts`: Defines the shared data types used by both the frontend and backend, ensuring type safety across the application.
-   `nginx.conf` and `vite.config.ts`: Handle routing and request proxying logic for production and development respectively.

## Prerequisites

### For Production (Docker)
-   [Docker](https://www.docker.com/)
-   [Docker Compose](https://docs.docker.com/compose/)

### For Development (Manual)
-   [Node.js](https://nodejs.org/) (LTS recommended)
-   [npm](https://www.npmjs.com/)
-   [MariaDB](https://mariadb.org/)

## Development Setup

Follow these steps to set up the application locally:

### 1. Configuration
1.  Navigate to the `backend/` directory.
2.  Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
3.  Edit `.env` and fill in your MariaDB database credentials.

### 2. Database Setup
Start your local MariaDB server and create the database. You can use the CLI:

```bash
mariadb -u root -p
```

```sql
CREATE DATABASE aura_catcher;
```
*Note: Ensure the username and database name match what you defined in `backend/.env`.*

### 3. Installation
Install dependencies for the root, frontend, and backend workspaces:

```bash
npm run install:all
```

### 4. Running the App
Start both the backend and frontend development servers concurrently:

```bash
npm run dev
```

-   **Frontend**: [http://localhost:5174](http://localhost:5174)
-   **Backend**: [http://localhost:3000](http://localhost:3000)

### 5. Linting
To check for code quality issues across the project:

```bash
npm run lint
```

## Production Setup (Docker)

To deploy the entire stack (Frontend, Backend, and MariaDB) using Docker:

1.  **Build and Start**:
    Run the following command from the project root:
    ```bash
    docker compose --env-file ./backend/.env up --build
    ```

2.  **Access the Application**:
    -   **Frontend**: [http://localhost:8080](http://localhost:8080)
    -   **Backend**: Not directly exposed (accessible internally by the frontend via Nginx).

### Data Management

The project includes scripts to manage your data (database and uploaded photos). **Note: These scripts require the Docker containers to be running.**

#### Backup
To create a backup of the database and the data directory:

```bash
./backup.sh
```
This will create a timestamped folder in the `backups/` directory (e.g., `backups/2025-01-01_12-00-00/`).

#### Restore
To restore data from a previous backup:

```bash
./restore.sh backups/<timestamp_folder>
```
*Example:* `./restore.sh backups/2025-01-01_12-00-00`

**Warning**: Restoring will overwrite the current database and data files with those from the backup.

## Roadmap / TODO

- [ ] **Generator**: fix the small issue with the generator (responsive layout, text)
- [ ] **Share sign**: use opengraph (https://opengraph.dev) metadata to share the image (might need to add image generation on backend) and add a share button (https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)
- [ ] **Stats**: Add a stats page to display the number of signs, photos, leaderboard.
- [ ] **Authentication**: Implement user accounts and granular permissions.
- [ ] **Modify**: Allow users to modify signs and photos
- [ ] **Admin**: Add an admin page to manage new signs and photos.
- [ ] **Search**: Add a search bar to search for signs by name, description, etc.
- [ ] **Bulk Import/Export**: Allow users to export data to CSV/JSON
- [ ] **Closest sign**: display the distance and direction of the closest sign
- [ ] **Beautiful photos**: nice pictures of signs or bus / camionette / etc