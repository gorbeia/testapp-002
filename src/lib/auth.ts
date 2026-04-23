import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { volunteerRepo } from '@/lib/store';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
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
          // Plain string sentinel (dev/test): stored as "plain:<password>"
          const plain = volunteer.passwordHash.startsWith('plain:')
            ? volunteer.passwordHash.slice(6)
            : volunteer.passwordHash;
          valid = credentials.password === plain;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.associationId = (user as any).associationId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub && token.role && token.associationId) {
        session.user.id = token.sub;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.role = token.role as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.associationId = token.associationId as any;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
