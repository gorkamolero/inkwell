# Auth Redirect Proxy Setup

## Goal
Enable GitHub OAuth in Vercel preview deployments using Auth.js redirect proxy.

## Steps

1. **Create stable subdomain** `auth.hotpress.app` → points to production deployment

2. **Add callback URL to GitHub OAuth apps**
   - Production app: add `https://auth.hotpress.app/api/auth/callback/github`
   - Dev app: add `https://auth.hotpress.app/api/auth/callback/github`

3. **Set Vercel env vars for preview**
   ```
   AUTH_REDIRECT_PROXY_URL=https://auth.hotpress.app
   ```

4. **Update auth.ts** to use `redirectProxyUrl` option:
   ```typescript
   export const { handlers, auth, signIn, signOut } = NextAuth({
     ...
     redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
   })
   ```

5. **Test** - push a branch, verify OAuth works on preview URL

## Files to modify
- `src/lib/auth.ts` - add redirectProxyUrl
- Vercel dashboard - add env var
- GitHub OAuth apps - add callback URL
- DNS - add auth.hotpress.app subdomain
