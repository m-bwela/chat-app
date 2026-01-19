# i-ONGEA - Real-Time Chat Application

A full-stack real-time chat application built with React, Node.js, Socket.IO, and PostgreSQL.

![Chat App](https://img.shields.io/badge/Status-Complete-brightgreen)
![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express%205-green)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-yellow)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)

## ✨ Features

### Core Features
- **User Authentication** - Register, login, logout with JWT tokens
- **Real-Time Messaging** - Instant message delivery using Socket.IO
- **One-on-One Chats** - Private conversations between two users
- **Group Chats** - Create groups with multiple participants, leave groups

### Enhanced Features
- **Typing Indicators** - See when someone is typing (in chat window and sidebar)
- **Read Receipts** - Single check (✓) for sent, double check (✓✓) for read
- **Online/Offline Status** - Real-time user presence updates
- **Unread Message Count** - Badge showing number of unread messages per conversation
- **Profile Avatars** - Upload and display custom profile pictures
- **Image/File Sharing** - Send images and documents (PDF, DOC, TXT, etc.)
- **Dark Mode** - Toggle between light and dark themes
- **Browser Notifications** - Get notified of new messages even when tab is inactive
- **Message Sorting** - Conversations sorted by most recent message

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS v4** - Styling
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP requests
- **React Router DOM** - Client-side routing

### Backend
- **Node.js** - Runtime environment
- **Express 5** - Web framework
- **Socket.IO** - WebSocket server
- **Prisma 5** - ORM for database
- **PostgreSQL** - Database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File uploads

## 📁 Project Structure

```
chat-app/
├── client/                    # Frontend (React)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Avatar.jsx
│   │   │   ├── AvatarUpload.jsx
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── CreateGroupModal.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── context/           # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── SocketContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── hooks/             # Custom hooks
│   │   │   └── useNotification.js
│   │   ├── pages/             # Page components
│   │   │   ├── Chat.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── utils/             # Utilities
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── main.css
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # Backend (Node.js)
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Database migrations
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   │   ├── authControllers.js
│   │   │   └── chatController.js
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.js
│   │   │   └── upload.js
│   │   ├── routes/            # API routes
│   │   │   ├── authRoutes.js
│   │   │   └── chatRoutes.js
│   │   ├── socket/            # Socket.IO handlers
│   │   │   └── socketHandler.js
│   │   └── lib/
│   │       └── prisma.js
│   ├── uploads/               # Uploaded files
│   │   ├── avatars/
│   │   └── messages/
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/m-bwela/chat-app.git
   cd chat-app
   ```

2. **Set up the database**
   - Create a PostgreSQL database named `chatapp`
   - Note your database port (default: 5432, this project uses: 5433)

3. **Set up the server**
   ```bash
   cd server
   npm install
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the `server` folder:
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5433/chatapp"
   JWT_SECRET="your-secret-key-here"
   PORT=5000
   ```

5. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

6. **Set up the client**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

1. **Start the server** (Terminal 1)
   ```bash
   cd server
   npm run dev
   ```
   Server runs on: http://localhost:5000

2. **Start the client** (Terminal 2)
   ```bash
   cd client
   npm run dev
   ```
   Client runs on: http://localhost:5173

3. **Open the app**
   - Navigate to http://localhost:5173
   - Register two accounts to test messaging
   - Use an incognito window for the second account

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/avatar` | Upload avatar |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/users` | Get all users |
| GET | `/api/chat/conversations` | Get user's conversations |
| POST | `/api/chat/conversations` | Create one-on-one chat |
| POST | `/api/chat/conversations/group` | Create group chat |
| DELETE | `/api/chat/conversations/:id/leave` | Leave group |
| GET | `/api/chat/conversations/:id/messages` | Get messages |
| POST | `/api/chat/messages` | Send text message |
| POST | `/api/chat/messages/file` | Send file message |

## 🔌 Socket Events

### Client → Server
| Event | Description |
|-------|-------------|
| `authenticate` | Authenticate socket connection |
| `join-conversation` | Join a chat room |
| `leave-conversation` | Leave a chat room |
| `send-message` | Send a message |
| `typing-start` | User started typing |
| `typing-stop` | User stopped typing |
| `mark-read` | Mark messages as read |

### Server → Client
| Event | Description |
|-------|-------------|
| `new-message` | New message received |
| `user-online` | User came online |
| `user-offline` | User went offline |
| `user-typing` | User is typing |
| `user-stop-typing` | User stopped typing |
| `messages-read` | Messages were read |
| `user-avatar-updated` | User updated avatar |

## 🗃️ Database Schema

```prisma
model User {
  id           String   @id @default(uuid())
  username     String   @unique
  email        String   @unique
  passwordHash String
  avatarUrl    String?
  isOnline     Boolean  @default(false)
  lastSeen     DateTime?
  createdAt    DateTime @default(now())
}

model Conversation {
  id        String   @id @default(uuid())
  name      String?
  isGroup   Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Message {
  id             String   @id @default(uuid())
  conversationId String
  senderId       String
  content        String?
  fileUrl        String?
  fileName       String?
  fileType       String?
  fileMimeType   String?
  fileSize       Int?
  isRead         Boolean  @default(false)
  createdAt      DateTime @default(now())
}
```

## 🎨 Screenshots

### Login Page
![Login](./screenshots/login.png)

### Chat Interface (Light Mode)
![Chat Light Mode](./screenshots/chat-light.png)

### Chat Interface (Dark Mode)
![Chat Dark Mode](./screenshots/chat-dark.png)

### Group Chat
![Group Chat](./screenshots/group-chat.png)

### File & Image Sharing
![File Image Sharing](./screenshots/file-image-sharing.png)

### Typing Indicator
![Typing Indicator](./screenshots/typing-indicator.png)

## 🔮 Future Enhancements

- [ ] Message search functionality
- [ ] Emoji picker
- [ ] Voice messages
- [ ] Video calls
- [ ] Message reactions
- [ ] Message editing/deletion
- [ ] Group admin features (add/remove members)
- [ ] Custom group avatars
- [ ] Message forwarding
- [ ] Deploy to cloud (Vercel + Railway)

## 👨‍💻 Author

**m-bwela**
- GitHub: [@m-bwela](https://github.com/m-bwela)


## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ using React, Node.js, and Socket.IO
