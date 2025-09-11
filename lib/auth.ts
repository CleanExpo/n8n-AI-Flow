import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Lazy initialize Supabase client to avoid build-time errors
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key-for-build';
    supabase = createClient(url, key);
  }
  return supabase;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // Check if user exists
        const { data: user, error } = await getSupabaseClient()
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (error || !user) {
          // If user doesn't exist, create new user (sign up)
          const hashedPassword = await bcrypt.hash(credentials.password, 10);
          
          const { data: newUser, error: createError } = await getSupabaseClient()
            .from('users')
            .insert({
              email: credentials.email,
              password_hash: hashedPassword,
              name: credentials.email.split('@')[0],
              role: 'user'
            })
            .select()
            .single();

          if (createError) {
            throw new Error('Failed to create account');
          }

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role
          };
        }

        // Verify password for existing user
        const passwordMatch = await bcrypt.compare(credentials.password, user.password_hash);
        
        if (!passwordMatch) {
          throw new Error('Invalid password');
        }

        // Update last login
        await getSupabaseClient()
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  // CRITICAL: Add NEXTAUTH_URL configuration
  ...(process.env.NEXTAUTH_URL && { 
    url: process.env.NEXTAUTH_URL 
  }),
};