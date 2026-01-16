# Real-Time Chat Application (Frontend)

A production-ready real-time chat application frontend built with React, TypeScript, and Tailwind CSS. This frontend consumes the deployed Real-Time Chat API backend.

## Features

- 🔐 **Authentication**: Signup and login with JWT token management
- 💬 **Real-Time Messaging**: WebSocket-based real-time chat
- 🏠 **Chat Rooms**: Create, join, and leave chat rooms
- 👥 **Online Presence**: See who's online in each room
- 🎨 **Modern UI**: Clean, WhatsApp/Slack-inspired interface
- 📱 **Responsive**: Works on desktop and mobile devices

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Axios** for REST API calls
- **Native WebSocket API** for real-time communication
- **Tailwind CSS** for styling
- **Context API** for state management

## Prerequisites

- Node.js 18+ and npm (or yarn/pnpm)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=https://p01--chat-api--jlcf9gxkjgjx.code.run
VITE_WS_BASE_URL=wss://p01--chat-api--jlcf9gxkjgjx.code.run
```

## Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Building for Production

Build the production bundle:
```bash
npm run build
```

The output will be in the `dist` directory, ready for deployment to Vercel or any static hosting service.

## Project Structure

```
src/
├── api/              # API client modules
│   ├── auth.ts      # Authentication API
│   ├── rooms.ts     # Rooms API
│   ├── messages.ts  # Messages API
│   ├── presence.ts  # Presence API
│   ├── websocket.ts # WebSocket client
│   └── axios.ts     # Axios configuration
├── context/         # React Context providers
│   ├── AuthContext.tsx
│   └── ChatContext.tsx
├── pages/           # Page components
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Rooms.tsx
│   └── ChatRoom.tsx
├── components/      # Reusable components
│   ├── Sidebar.tsx
│   ├── ChatWindow.tsx
│   ├── MessageBubble.tsx
│   └── PresenceList.tsx
├── hooks/           # Custom hooks
│   └── useWebSocket.ts
├── App.tsx          # Main app component
└── main.tsx         # Entry point
```

## Backend API

This frontend consumes the Real-Time Chat API backend:
- **Base URL**: `https://p01--chat-api--jlcf9gxkjgjx.code.run`
- **WebSocket URL**: `wss://p01--chat-api--jlcf9gxkjgjx.code.run`
- **API Docs**: `https://p01--chat-api--jlcf9gxkjgjx.code.run/docs`

## Usage

1. **Sign Up**: Create a new account
2. **Log In**: Authenticate with your credentials
3. **Create/Join Rooms**: Create new chat rooms or join existing ones
4. **Chat**: Send and receive messages in real-time
5. **See Presence**: View who's online in each room

## Deployment

This project is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables:
   - `VITE_API_BASE_URL`
   - `VITE_WS_BASE_URL`
4. Deploy!

## License

MIT

