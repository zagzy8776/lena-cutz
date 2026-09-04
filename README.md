# Lena Cutz

A premium barbershop and salon booking platform.

## Architecture

This project uses a Backend-for-Frontend (BFF) architecture with the following stack:
- **Frontend:** React (Vite) + Tailwind CSS + TypeScript
- **Backend:** Express.js (Node.js) API
- **Database:** Neon PostgreSQL

## Prerequisites

- Node.js (v18+)
- A Neon PostgreSQL database

## Getting Started

### 1. Database Setup

Create a `.env` file in the `server` directory and add your Neon connection string:

```env
DATABASE_URL="postgresql://user:password@endpoint.neon.tech/dbname?sslmode=require"
JWT_SECRET="your-secret-key"
ADMIN_EMAIL="juditheberechi274@gmail.com"
ADMIN_PASSWORD_PLAIN="YourAdminPassword!"
PORT=3001
```

Install server dependencies and run migrations to create the required tables (`services`, `bookings`, `salon_settings`):

```bash
cd server
npm install
npm run db:migrate
```

### 2. Frontend Setup

The frontend expects the backend to run on port 3001. Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001
```

Install frontend dependencies:

```bash
npm install
```

### 3. Running the App

You can run both the frontend and backend in separate terminal windows:

**Terminal 1 (Backend):**
```bash
cd server
node index.js
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

Visit `http://localhost:5173` to see the site. 
Visit `http://localhost:5173/#admin` to access the admin dashboard.

## Features

- **Public Site:** Customers can view services, check pricing, and book appointments.
- **Admin Dashboard:** Manage bookings, update services, edit salon info, and manage admin credentials.
