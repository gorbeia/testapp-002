# Txosnabai App

A Next.js application for managing txosnak (food/beverage stands) at events with volunteer management, ordering system, and payment processing.

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn
- PostgreSQL database (local or cloud)

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd txosnabai
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

4. **Configure your database**
   - Set up a PostgreSQL database
   - Add the connection string to your `.env` file:
     ```
     DATABASE_URL="postgresql://username:password@localhost:5432/txosnabai"
     ```

5. **Generate Prisma client**

   ```bash
   pnpm prisma generate
   ```

6. **Run database migrations**
   ```bash
   pnpm prisma db push
   # or if you have migration files:
   pnpm prisma migrate dev
   ```

## Getting Started

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Required environment variables in your `.env` file:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/txosnabai"

# NextAuth.js (optional, for authentication)
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Payment providers (optional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Database Setup

### Option 1: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a database: `createdb txosnabai`
3. Update `DATABASE_URL` in `.env`

### Option 2: Docker

```bash
docker run --name txosnabai-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=txosnabai -p 5432:5432 -d postgres:15
```

### Option 3: Cloud Database

- Use services like Supabase, Neon, or Railway
- Copy the connection string to your `.env` file

## Common Issues

### Prisma Client Errors

If you see "Using engine type 'client' requires either 'adapter' or 'accelerateUrl'", ensure:

1. `DATABASE_URL` is properly set in your `.env` file
2. Run `pnpm prisma generate` after changing the database configuration
3. Your database is accessible and the connection string is correct

### Missing Dependencies

If you encounter module resolution errors:

```bash
pnpm install
pnpm prisma generate
```

## Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Database operations
pnpm prisma studio          # Open Prisma Studio
pnpm prisma generate        # Regenerate Prisma client
pnpm prisma db push         # Push schema changes to database
pnpm prisma migrate dev     # Create and run new migration
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
