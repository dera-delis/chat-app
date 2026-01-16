# 💬 Real-Time Chat App (Full Stack)

A modern, real-time chat application built with React, Tailwind CSS, and FastAPI WebSockets.
This frontend consumes a production-deployed Chat API, supporting authenticated users, chat rooms, live messaging, and online presence.

🚀 Backend powered by FastAPI + WebSockets + Redis  
🌐 Frontend deployed on Vercel

🚀 Live Demo

[![Live Frontend](https://img.shields.io/badge/Live%20Frontend-Open-2ea44f?style=for-the-badge)](https://chat-app.vercel.app)
[![Live Backend](https://img.shields.io/badge/Live%20Backend-Open-2ea44f?style=for-the-badge)](https://chat-api.northflank.app)
[![API Docs](https://img.shields.io/badge/API%20Docs-Open-0ea5e9?style=for-the-badge)](https://chat-api.northflank.app/docs)

🏗️ Architecture Overview
```
┌───────────────┐
│   React App   │
│ (Vercel)     │
└──────┬────────┘
       │ HTTPS / WSS
┌──────▼────────────────────────────┐
│   FastAPI Chat API (Northflank)   │
│  - JWT Auth                       │
│  - REST (rooms, messages)         │
│  - WebSockets (real-time chat)    │
└──────┬───────────────┬────────────┘
       │               │
┌──────▼──────┐   ┌────▼─────┐
│ PostgreSQL  │   │  Redis   │
│ (Messages)  │   │ Pub/Sub  │
└─────────────┘   └──────────┘
```

🛠️ Tech Stack

Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- WebSocket API
- JWT-based auth

Backend (Consumed API)
- FastAPI
- WebSockets
- Redis (Pub/Sub & presence)
- PostgreSQL
- JWT Authentication

✨ Features

💬 Chat
- Real-time messaging (WebSockets)
- Multiple chat rooms
- Persistent chat history
- System messages (join/leave)

👤 Authentication
- Login & signup
- JWT stored securely
- Protected routes

🟢 Presence
- Online/offline indicators
- Live user lists per room

🎨 UI / UX
- Clean WhatsApp-style interface
- Responsive (mobile + desktop)
- Auto-scroll messages
- Message timestamps

📸 Screenshots
(Add later)
- Login Page
- Chat Room List
- Live Chat Interface
- Online Users Sidebar

📁 Project Structure
```
chat-app/
├── src/
│   ├── api/                # Axios + WebSocket clients
│   ├── auth/               # Auth context & guards
│   ├── components/         # Reusable UI components
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Rooms.jsx
│   │   └── ChatRoom.jsx
│   ├── hooks/              # Custom hooks (useWebSocket, useAuth)
│   ├── layouts/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── public/
├── .env.example
├── package.json
├── tailwind.config.js
└── README.md
```

🔐 Environment Variables
`.env.example`
```
VITE_API_BASE_URL=https://chat-api.northflank.app
VITE_WS_BASE_URL=wss://chat-api.northflank.app
```

🔌 WebSocket Usage
```js
const ws = new WebSocket(
  `${import.meta.env.VITE_WS_BASE_URL}/ws/chat/${roomId}?token=${token}`
);
```

🧪 Local Development
```bash
git clone https://github.com/dera-delis/chat-app.git
cd chat-app
npm install
npm run dev
```

App runs at:  
http://localhost:5173

🚀 Deployment (Vercel)

Framework: Vite  
Build Command: npm run build  
Output: dist  

Environment Variables:
- VITE_API_BASE_URL
- VITE_WS_BASE_URL

🎯 Why This Project Matters

This project demonstrates:
- ✅ Real-time frontend systems
- ✅ WebSocket integration with auth
- ✅ Consuming a deployed backend API
- ✅ Production-ready environment handling
- ✅ Clean UI + scalable architecture

Together with the Chat API, this forms a complete real-time system.

📄 License

MIT License

👨‍💻 Author

Dera Delis

[![GitHub](https://img.shields.io/badge/GitHub-Profile-181717?style=for-the-badge&logo=github)](https://github.com/dera-delis)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/dera-delis)

