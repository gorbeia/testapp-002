import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const volunteer = await prisma.volunteer.findUnique({
          where: { email: credentials.email as string },
          include: { association: true },
        });

        if (!volunteer || !volunteer.active) return null;

        const valid = await bcrypt.compare(credentials.password as string, volunteer.passwordHash);
        if (!valid) return null;

        return {
          id: volunteer.id,
          name: volunteer.name,
          email: volunteer.email,
          role: volunteer.role,
          associationId: volunteer.associationId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.associationId = (user as any).associationId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.sub;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).associationId = token.associationId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
