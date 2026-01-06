# AURA Catcher

A web application to reference "La Région aide..." panneaux, complemented by the **AURA Farmer** tool for generating custom panneaux.

## Features

- **Interactive Map**: Display panneaux on a map with details and photos.
- **AURA Farmer (Panneau Generator)**: A pixel-perfect tool to create custom "La Région" panels.
    - **Ported Logic**: The generation logic (geometry, text wrapping) is a direct port from the original "Old AURA Farmer" project, ensuring 100% visual fidelity.
    - **Shareable Links**: Panel text is synced to the URL for easy sharing.
    - **SVG Download**: Download high-quality vector images of your custom panneaux.
- **Mobile First**: Designed for use on the go.

## Tech Stack

- **Framework**: React + TypeScript + Vite
- **Styling**: Vanilla CSS (Mobile-first design)
- **Icons**: Lucide React

3.  Run the development server for both frontend and backend:
    ```bash
    npm run dev
    ```
    - Frontend: [http://localhost:5173](http://localhost:5173)
    - Backend: [http://localhost:3000](http://localhost:3000)

## Backend Setup (Manual)

If you prefer to run them separately:

The project includes a Node.js + Express backend (SQLite) to handle panneau uploads and map data.

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Install backend dependencies:
    ```bash
    npm install
    ```

3.  Run the backend server:
    ```bash
    npm run dev
    ```
    The server will start on [http://localhost:3000](http://localhost:3000).

## Project Structure

- `frontend/`: React + Vite application.
- `backend/`: Node.js + Express server and data.
- `frontend/src/utils/panelLayout.ts`: Core logic for calculating the panel SVG geometry (Isomorphic).
- `frontend/src/utils/panelRenderers.tsx`: React and String renderers for the panel.
