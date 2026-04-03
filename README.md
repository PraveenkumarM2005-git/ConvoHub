# ConvoHub — Architectural Messaging Protocol

A production-grade, end-to-end encrypted style real-time chat application built with the MERN stack and Socket.io. Features a dark obsidian theme with neon cyan accents, matching premium architectural design reference UI.

## Tech Stack
- **Frontend**: React.js 18, Vite, Tailwind CSS v4, Zustand (state management), Socket.io-client, Axios
- **Backend**: Node.js, Express.js, Socket.io, JWT (HTTP-only cookies), Cloudinary (Image/File upload), Multer
- **Database**: MongoDB & Mongoose

## Setup Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally, or a MongoDB Atlas URI
- A [Cloudinary](https://cloudinary.com/) account for remote image/file storage

### 2. Backend Setup
1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   - Copy the `.env.example` file to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and fill in your details:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A long, random cryptographic string
     - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Credentials from your Cloudinary Dashboard.

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend will start on `http://localhost:5000`.

### 3. Frontend Setup
1. Open a new terminal tab and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will start on `http://localhost:5173`. 
   *(Note: The `vite.config.js` is already set up to proxy API requests to port `5000`)*

### 4. Usage
- Open `http://localhost:5173` in your browser.
- Click "Request Access" to register a new user identity.
- Open an incognito window or distinct browser to register a second user to test messaging.
- Test 1-on-1 chats, group creation, file attachments, and emoji reactions!

## Features Implemented
- JWT Auth via secure HTTP-Only Cookies
- Real-time messaging with Socket.io (WebSocket)
- Online / Offline presence with automatic timeout
- "Typing..." indicators 
- Single / Double-tick read receipts
- Message reactions (Emoji pills)
- Image and file attachments stored securely on Cloudinary CDN
- Group chats with dedicated socket rooms
- Client-side routing with React Router & Auth protection
- Dynamic UI elements: Glassmorphism cards, glowing avatars, dynamic dark/light mode toggle.
- Browser notification API for background message alerts.
