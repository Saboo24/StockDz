# StockDZ

<p align="center">
	<img src="frontend/src/assets/logo.png" alt="StockDZ logo" width="120" />
</p>

<p align="center">
	<strong>Inventory and business management for Algerian businesses.</strong><br />
	Manage products, stock, sales, purchases, customers, suppliers and reports from one workspace.
</p>

<p align="center">
	<a href="https://stockdz-delta.vercel.app"><strong>Live Demo</strong></a>
</p>

## Overview

StockDZ is a full-stack business management application built for small and growing businesses. It combines a responsive Next.js frontend with an Express and Prisma API backed by MySQL.

## Features

- Dashboard with sales, stock and business KPIs
- Product and category management
- Stock movements and low-stock notifications
- Sales, purchases and invoice workflows
- Customer and supplier management
- Expenses and business reports
- Authentication, password reset and role-based administration
- French and English interface support
- Light and dark themes

## Screenshots

The application uses a responsive layout for desktop and mobile screens. The visual identity is previewed above; to capture live page screenshots, run the app locally and save them under `docs/screenshots/`, then add them here:

```md
![Dashboard](docs/screenshots/dashboard.png)
![Products](docs/screenshots/products.png)
![Sales](docs/screenshots/sales.png)
```

## Architecture

```mermaid
flowchart LR
		Browser[Next.js frontend\nlocalhost:3000] -->|REST API| API[Express backend\nlocalhost:4000]
		API --> Prisma[Prisma ORM]
		Prisma --> DB[(MySQL)]
		API --> Mail[SMTP email service]
```

## Technology Stack

### Frontend

- Next.js 14 with App Router
- React 18 and TypeScript
- Tailwind CSS and Radix UI primitives
- Recharts for analytics
- Lucide icons and Sonner notifications

### Backend

- Node.js, Express and TypeScript
- Prisma ORM with MySQL
- JWT authentication and bcrypt password hashing
- Zod validation
- PDFKit invoice/report generation
- Nodemailer email delivery

## Project Structure

```text
StockDZ/
├── frontend/       # Next.js web application
├── backend/        # Express REST API
│   ├── prisma/     # Database schema, migrations and seed
│   └── src/routes/ # API route modules
├── TEST_PLAN.md
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- MySQL database

### 1. Start the backend

```bash
cd backend
npm install
```

Create `backend/.env` and configure at least:

```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/StockDz"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=4000
FRONTEND_URL="http://localhost:3000"
```

Then initialize the database and start the API:

```bash
npm run db:generate
npm run db:push
npm run dev
```

The API health check is available at [http://localhost:4000/health](http://localhost:4000/health).

### 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

Start the web application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Folder | Command | Purpose |
| --- | --- | --- |
| `frontend` | `npm run dev` | Start the Next.js development server |
| `frontend` | `npm run build` | Build the production frontend |
| `frontend` | `npm run type-check` | Run the TypeScript checker |
| `backend` | `npm run dev` | Start the API with hot reload |
| `backend` | `npm run build` | Generate Prisma client and compile TypeScript |
| `backend` | `npm run db:seed` | Seed the database |

## Security Notes

- Keep `.env` and `.env.local` files out of version control.
- Use a strong, unique `JWT_SECRET` in production.
- Configure SMTP credentials through environment variables instead of hardcoding them.
- Use a managed MySQL connection with restricted permissions for production deployments.

