import { DefaultSession, User as NextAuthUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'ADMIN' | 'VOLUNTEER';
      associationId: string;
    } & DefaultSession['user'];
  }

  interface User extends NextAuthUser {
    role: 'ADMIN' | 'VOLUNTEER';
    associationId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'ADMIN' | 'VOLUNTEER';
    associationId?: string;
  }
}

declare module '@auth/core/adapters' {
  interface AdapterUser {
    role: 'ADMIN' | 'VOLUNTEER';
    associationId: string;
  }
}
