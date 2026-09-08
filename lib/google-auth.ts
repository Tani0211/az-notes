import { Auth, type AuthConfig } from '@auth/core';
import Google from '@auth/core/providers/google';
import { headers } from 'next/headers';

export function googleReady() {
  return Boolean(
    process.env.AUTH_SECRET &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.PUBLIC_ORIGIN,
  );
}
export function authOrigin() {
  return process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : process.env.PUBLIC_ORIGIN || 'https://az-notes-tanishq.vercel.app';
}
export function authConfig(): AuthConfig {
  return {
    basePath: '/api/auth',
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    useSecureCookies: process.env.NODE_ENV !== 'development',
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: { params: { scope: 'openid email profile' } },
      }),
    ],
    session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
    callbacks: {
      signIn: async ({ account, profile }) =>
        account?.provider === 'google' && profile?.email_verified === true,
      jwt: async ({ token, account }) => {
        if (account) token.sub = 'google:' + account.providerAccountId;
        return token;
      },
      session: async ({ session, token }) => ({
        ...session,
        user: { ...session.user, id: token.sub },
      }),
      redirect: async ({ url }) => {
        try {
          const next = new URL(url, authOrigin());
          return next.origin === authOrigin()
            ? next.toString()
            : authOrigin() + '/library';
        } catch {
          return authOrigin() + '/library';
        }
      },
    },
    theme: { brandColor: '#224e88', colorScheme: 'auto' },
  };
}
export async function googleUser() {
  if (!googleReady()) return null;
  const h = await headers();
  if (!h.get('cookie')?.includes('authjs.session-token')) return null;
  const response = await Auth(
    new Request(authOrigin() + '/api/auth/session', {
      headers: { cookie: h.get('cookie') || '' },
    }),
    authConfig(),
  );
  if (!response.ok) return null;
  const session = (await response.json()) as {
    user?: { id?: string; email?: string; name?: string };
  };
  if (!session.user?.id || !session.user.email) return null;
  return {
    userId: session.user.id,
    email: session.user.email,
    fullName: session.user.name || null,
  };
}
export async function authHandler(request: Request) {
  if (!googleReady())
    return Response.json(
      {
        error: 'Google sign-in is not configured yet.',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  const url = new URL(request.url);
  const origin = authOrigin();
  const canonical = new URL(url.pathname + url.search, origin);
  if (request.method === 'POST' && request.headers.get('origin') !== origin)
    return new Response('Invalid origin', { status: 403 });
  const h = new Headers(request.headers);
  h.set('host', new URL(origin).host);
  h.delete('x-forwarded-host');
  h.delete('x-forwarded-proto');
  const normalized = new Request(canonical, {
    method: request.method,
    headers: h,
    ...(request.method === 'GET' || request.method === 'HEAD'
      ? {}
      : { body: request.body, duplex: 'half' as const }),
  });
  return Auth(normalized, authConfig());
}
