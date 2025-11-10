---
description: Verify Privy wallet authentication is properly configured
---

# Privy Authentication Check

You are verifying Privy wallet authentication in Asset-Forge.

## Pre-Task: Research

**MANDATORY FIRST STEP:**
Use Deepwiki to check current Privy patterns:

```
mcp__deepwiki__ask_question repo: "privy-io/privy-js"
Ask: "How to implement Privy authentication in React?"
```

## Tasks

1. **Check Frontend Setup**
   - Read `packages/core/src/components/providers/PrivyProvider.tsx`
   - Verify Privy app ID is configured
   - Check PrivyProvider wraps app correctly
   - Verify proper React hooks usage

2. **Check Auth Hooks Usage**
   - Search for `usePrivy()` usage in components
   - Verify `useWallets()` usage for wallet access
   - Check `getAccessToken()` for JWT retrieval

3. **Check Protected Routes**
   - Find routes that require authentication
   - Verify auth guards are implemented
   - Check redirect logic for unauthenticated users

4. **Check Backend Integration**
   - Read `packages/core/server/middleware/auth.ts` (if exists)
   - Verify JWT token verification
   - Check Elysia auth middleware
   - Verify proper error responses (401)

5. **Check Environment Variables**
   - Verify `PRIVY_APP_ID` in `.env.example`
   - Verify `PRIVY_APP_SECRET` for backend
   - Check all required variables are documented

6. **Check Database Schema**
   - Verify `users` table has wallet address field
   - Check for proper indexing on wallet addresses
   - Verify user creation on first login

7. **Report Findings**
   - List auth flow status
   - Document any security issues
   - Suggest improvements
   - Provide code examples

## Success Criteria

- Privy properly configured on frontend and backend
- JWT tokens properly verified
- Protected routes implemented
- Database schema supports wallet-based auth
- Environment variables configured
- No security vulnerabilities
