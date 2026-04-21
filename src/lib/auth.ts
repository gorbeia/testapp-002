import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { volunteerRepo } from '@/lib/store';
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

        const volunteer = await volunteerRepo.findByEmail(credentials.email as string);
        if (!volunteer || !volunteer.active) return null;

        let valid: boolean;
        if (volunteer.passwordHash.startsWith('$2')) {
          // Bcrypt hash
          valid = await bcrypt.compare(credentials.password as string, volunteer.passwordHash);
        } else {
          // Plain string (dev/test)
          valid = credentials.password === volunteer.passwordHash;
        }
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
        token.role = user.role;
        token.associationId = user.associationId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub && token.role && token.associationId) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.associationId = token.associationId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
