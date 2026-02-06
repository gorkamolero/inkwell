# GitHub App Migration Guide

This document describes the migration from GitHub OAuth (with `repo` scope) to GitHub App for repository access in Hotpress.

## Why This Change?

### Before (OAuth with `repo` scope)
- Users granted access to **ALL** their repositories when signing in
- Single access token with broad permissions
- No way for users to limit which repos Hotpress could access
- Security concern: if token leaked, all repos exposed

### After (GitHub App)
- **Identity via OAuth**: `read:user user:email` scope only (no repo access)
- **Repo access via GitHub App installation**: Users choose exactly which repos to grant access to
- Per-repository permissions with fine-grained control
- Better security: installation tokens are scoped to specific repos

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Flow                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Sign in with GitHub (OAuth)                              │
│     └── Gets: user identity, email                           │
│                                                              │
│  2. Install GitHub App on repos                              │
│     └── User selects specific repos in GitHub UI             │
│                                                              │
│  3. Hotpress uses installation tokens for repo operations    │
│     └── Scoped to only the repos user selected               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Required Setup

### 1. Create a GitHub App

Go to [GitHub Developer Settings](https://github.com/settings/apps/new) and create a new GitHub App with:

**Basic Info:**
- App name: `Hotpress` (or your preferred name)
- Homepage URL: `https://hotpress.app`
- Webhook URL: `https://hotpress.app/api/webhooks/github` (optional, for future use)

**Permissions:**
- Repository permissions:
  - **Contents**: Read and write (for reading/writing files)
  - **Metadata**: Read-only (required)

**Where can this GitHub App be installed?**
- Select: "Any account" (for public app) or "Only on this account" (for personal use)

### 2. Generate a Private Key

After creating the app:
1. Go to your app's settings
2. Scroll to "Private keys" section
3. Click "Generate a private key"
4. Download the `.pem` file
5. Save it to your project (e.g., `./github-app-private-key.pem`)
6. **Important**: Add this file to `.gitignore`!

### 3. Environment Variables

Add to your `.env.local`:

```bash
# Existing OAuth (for identity only now)
AUTH_GITHUB_ID=your-oauth-client-id
AUTH_GITHUB_SECRET=your-oauth-client-secret

# GitHub App (for repo access)
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY_PATH=./github-app-private-key.pem
GITHUB_APP_SLUG=hotpress-app  # optional, defaults to "hotpress-app"
```

### 4. Database Migration

No database changes required. The existing `accounts` table still stores OAuth tokens,
but they're now only used for identity and (optionally) creating new repos.

## Code Changes

### Files Modified

1. **`src/lib/auth.ts`**
   - Changed OAuth scope from `read:user user:email repo` to `read:user user:email`

2. **`src/lib/github-app.ts`**
   - Expanded to include all document operations
   - New exports: `listDocuments`, `listDocumentsInPath`, `getDocument`, `saveDocument`, `deleteDocument`, `getCommitHistory`, `getFileAtCommit`, `commitFile`, `commitMultipleFiles`, `isAppInstalled`, `getInstallUrl`

3. **All API routes using GitHub**
   - Updated to use `github-app.ts` functions instead of OAuth-based `github.ts`
   - Added `isAppInstalled()` checks before operations
   - Return helpful errors with install URL when app not installed

4. **`src/lib/github.ts`**
   - Kept for backwards compatibility but no longer imported
   - Can be deleted once migration is confirmed stable

## User Experience

### For Existing Users

1. User signs in (re-auth may be needed to get new OAuth scope)
2. When they try to access a repo, they'll see: "GitHub App not installed"
3. Click the install link → GitHub installation flow
4. Select which repos to grant access
5. Return to Hotpress → everything works

### For New Users

1. Sign up with GitHub
2. Create project or save session to GitHub
3. Prompted to install GitHub App
4. Select repos → done

## Creating New Repositories

Repository creation still requires OAuth because GitHub Apps cannot create repos for users.

**Current behavior:**
- If OAuth token has `public_repo` or `repo` scope → can create repos
- Otherwise → user creates repo manually in GitHub, then installs app

**Future improvement:**
- Could request `public_repo` scope (less scary than `repo`)
- Or guide users to create repo in GitHub first

## Rollback Plan

If issues arise:

1. Revert `auth.ts` to include `repo` scope
2. Revert API routes to use `github.ts` functions
3. The `github.ts` file is still present and functional

## Testing Checklist

- [ ] Sign in with GitHub (identity only)
- [ ] List repos (requires app installation)
- [ ] Create project with existing repo
- [ ] Create project with new repo (optional, needs OAuth scope)
- [ ] Read document from GitHub
- [ ] Save document to GitHub
- [ ] Delete document
- [ ] View version history
- [ ] Restore version
- [ ] Save Hotpress session to GitHub

## Security Improvements

1. **Minimal OAuth scope**: Only identity access by default
2. **Scoped repo access**: Users choose exactly which repos
3. **Installation tokens**: Short-lived, automatically rotated
4. **Audit trail**: GitHub shows which apps have access to which repos
5. **Easy revocation**: Users can uninstall app from specific repos

## References

- [GitHub Apps documentation](https://docs.github.com/en/apps)
- [Creating a GitHub App](https://docs.github.com/en/apps/creating-github-apps)
- [Authenticating as an installation](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation)
- [Octokit App Auth](https://github.com/octokit/auth-app.js)
