# Digital Heritage Documentation Dashboard (MERN)

A starter MERN application for documenting heritage sites, registering users, uploading images/documents/3D models, and creating research reports.

## Requirements
- Node.js LTS (includes npm)
- MongoDB Atlas account OR local MongoDB Community Server
- VS Code

## Setup
1. Extract this ZIP and open the `digital-heritage-mern` folder in VS Code.
2. Open Terminal > New Terminal:
   ```bash
   cd server
   npm install
   ```
3. Copy `server/.env.example` to `server/.env` and fill in your values.
4. In the same terminal:
   ```bash
   npm run dev
   ```
5. Open a second VS Code terminal:
   ```bash
   cd client
   npm install
   npm run dev
   ```
6. Open the local URL printed by Vite (usually http://localhost:5173).

## Environment setup
Edit `server/.env`:
- `MONGO_URI`: your MongoDB Atlas connection string.
- `JWT_SECRET`: a long random secret (do not share it).
- `PORT`: 5000
- `CLIENT_ORIGIN`: http://localhost:5173

For MongoDB Atlas:
1. Create a free database deployment.
2. Create a database user.
3. In Network Access, allow your current IP address.
4. Copy the Node.js connection string and replace `<password>` with your database user's password.
5. Do not commit `.env` to GitHub.

## First use
Register an account using the website. The first account is not automatically an administrator. For development only, set the role field through a trusted database/admin process; never allow public users to choose administrator in production. This starter intentionally limits self-registration to `contributor`, `researcher`, or `architect`.

## Features in this starter
- Register/login with hashed passwords and JWT authentication
- Role-protected Express API routes
- Create/list/view/delete heritage sites (delete restricted to admin)
- Upload images, documents, and supported 3D asset files to local `server/uploads`
- Create/list reports
- Basic GLB/glTF viewer using Google's `<model-viewer>` web component
- Responsive dashboard UI

## Important limitations
- Local uploads are for development. For a deployed multi-user website, move files to private cloud object storage and use protected signed URLs.
- The app does not yet implement live collaborative editing, report PDF export, WebXR AR/VR controls, or full previews for every 3D format.
- `.glb` is best for a single-file model. `.gltf` may need its `.bin` and texture dependencies uploaded together; this starter does not package dependencies automatically.
- Before real use, add rate limiting, email verification, password reset, audit logs, stronger file scanning, tests, and production deployment configuration.
