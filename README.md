# Chat App

A full-stack real-time chat application built with Node.js, Express, MongoDB, and React (Vite).

## Project Overview

This Chat App allows users to communicate in real-time, sharing text messages as well as images and videos. It features a secure authentication system with username support and a modern, responsive user interface with Dark Mode.

### Architecture & Tech Stack

- **Frontend:** React 19 (Vite), Tailwind CSS v4, Lucide React
- **Backend:** Node.js, Express.js v5, Multer (File Uploads)
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT (JSON Web Tokens) with email verification (Nodemailer)

For detailed code structure documentation, please refer to:
- [Client Code Structure](doc/code_struct_client.md)
- [Server Code Structure](doc/code_struct_server.md)
- [Project Context & Conventions](doc/GEMINI.md)

## Features

- **User Authentication:**
    - Secure sign-up with **Username**, Email, and Password.
    - Email verification for new accounts.
    - Password reset functionality via OTP.
- **Real-time Chat:**
    - Public chat room where all users can interact.
    - Automatic message polling (every 3 seconds).
- **Media Sharing:**
    - Upload and share **Images** and **Videos**.
    - In-chat media preview.
- **Dark Mode:** Built-in dark/light theme toggle.

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- MongoDB (Local installation or MongoDB Atlas account)

### Installation & Setup

#### 1. Backend Setup

From the project root:

```bash
cd server
# Install dependencies
npm install

# Configure environment variables
# Create a .env file in the server directory with the following:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret_key
# PORT=5001
# EMAIL_USER=your_email_for_sending_codes
# EMAIL_PASS=your_email_password_or_app_password

# Start the server
npm start
```

#### 2. Frontend Setup

From the `client` directory:

```bash
cd client
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Development Conventions

- **Backend:** Uses CommonJS modules. Runs on port 5001.
- **Frontend:** Built with React and Vite using ES Modules. Proxies API requests to port 5001.
- **Static Files:** Uploaded media is served from the `server/uploads` directory.

## Code Formatting

This project uses **Prettier** for consistent code formatting.

**Server:**

```bash
cd server
npm run format
```

**Client:**

```bash
cd client
npm run format
```