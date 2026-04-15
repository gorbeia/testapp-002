---
description: Add a new Prisma model and regenerate the client
---

1. Add the model to `prisma/schema.prisma` following the project conventions:
   - Use `@id @default(cuid())` for the ID field
   - Include `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`
   - If the model belongs to an association, include `associationId String` and `association Association @relation(...)`
   - Use appropriate enums from the schema for status/type fields
   - Do NOT use soft deletes — use cancellation patterns instead

2. Regenerate the Prisma client:

   ```bash
   pnpm prisma generate
   ```

3. If a database is available, push the schema changes:

   ```bash
   pnpm prisma db push
   ```

4. Update `src/lib/prisma.ts` mock data if the app needs to work without a database — add the new model to `mockPrisma` with empty return values.

5. If the model needs API endpoints, create Route Handlers under `src/app/api/` following the existing pattern.

6. Ensure all queries include `associationId` filter for multitenancy isolation.
