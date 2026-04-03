# 🚀 ConvoHub — Real-Time Cloud Messaging

> **Modern messaging, connected everywhere. A production-grade, real-time chat application built with the MERN stack.**

### 🌍 [Visit Live Application](https://convohub-app.netlify.app)
**Backend Status**: [https://convohub-backend-2v3r.onrender.com](https://convohub-backend-2v3r.onrender.com)

---

## 💎 Features
- **Real-Time Texting**: Instant private messaging powered by Socket.io.
- **Group Chats**: Create rooms, exit groups, and synchronize messages instantly.
- **Cloud Media**: Direct image and file uploads via **Cloudinary**.
- **Modern UI**: Dark-themed, glassmorphic design built with **React** and **Tailwind CSS**.
- **Secure Data**: User profiles and chat history stored in **MongoDB Atlas**.

## 🛠️ Technology Stack
- **Frontend**: React.js 18, Vite, Tailwind CSS v4, Zustand (state management), Socket.io-client, Axios.
- **Backend**: Node.js, Express, Socket.io, JWT (HTTP-only cookies), Mongoose (MongoDB).
- **Storage**: Cloudinary (VOD/Media), MongoDB Atlas (Data).
- **Deployment**: Netlify (Frontend), Render (Backend).

---

## 🏃 Local Development

1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/PraveenkumarM2005-git/ConvoHub.git
    ```
2.  **Server Setup**:
    - `cd server`
    - `npm install`
    - Create a `.env` file with `MONGODB_URI`, `JWT_SECRET`, and `CLOUDINARY` credentials.
    - `npm run dev`
3.  **Frontend Setup**:
    - `cd client`
    - `npm install`
    - Create a `.env` file with `VITE_API_BASE_URL=http://localhost:5000/api`
    - `npm run dev`

---

## 📡 Deployment Instructions

### Backend (Render)
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Env Vars**: `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `PORT`, `NODE_ENV=production`.

### Frontend (Netlify)
- **Base directory**: `client`
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Env Vars**: `VITE_API_BASE_URL` (points to your Render backend).

---

© 2026 PraveenkumarM2005 — Built with Antigravity AI.
