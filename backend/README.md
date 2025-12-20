# AURA Catcher Backend

This is the backend for the AURA Catcher application, built with Node.js, Express, and SQLite.

## Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Running the Server

-   **Development Mode** (with hot-reload):
    ```bash
    npm run dev
    ```
    The server typically runs on `http://localhost:3000`.

-   **Production Build**:
    ```bash
    npm run build
    npm start
    ```

## API Endpoints

### Panneaux

#### Get All Panneaux

-   **URL:** `/api/panneaux`
-   **Method:** `GET`
-   **Success Response:**
    -   **Code:** 200
    -   **Content:** Array of panneau objects.
        ```json
        [
          {
            "id": 1,
            "lat": 45.123,
            "lng": 5.456,
            "imageUrl": "/uploads/1700000000000-image.jpg",
            "comment": "A comment",
            "author": "Anonymous",
            "createdAt": "2025-..."
          }
        ]
        ```

#### Create a Panneau

-   **URL:** `/api/panneaux`
-   **Method:** `POST`
-   **Content-Type:** `multipart/form-data`
-   **Params:**
    -   `image`: File (Required) - The photo of the panneau.
    -   `lat`: Number (Required) - Latitude.
    -   `lng`: Number (Required) - Longitude.
    -   `comment`: String (Optional) - User comment.
    -   `author`: String (Optional) - Author name (default: "Anonymous").
-   **Success Response:**
    -   **Code:** 201 CREATED
    -   **Content:**
        ```json
        {
          "id": 2,
          "lat": 45.123,
          "lng": 5.456,
          "imageUrl": "/uploads/1700000000000-new-image.jpg"
        }
        ```
-   **Error Response:**
    -   **Code:** 400 BAD REQUEST
    -   **Content:** `{ "error": "Missing required fields" }`

## Data Storage

-   **Database:** SQLite database stored in `data/database.sqlite`.
-   **Images:** Uploaded images are stored in `data/uploads`.
