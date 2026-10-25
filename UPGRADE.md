# Install this cleanup in your existing portfolio

This archive updates your source code. It does not publish to your GitHub repository or Netlify account automatically. It does not contain passwords, stored inquiries, or uploaded media from your live Netlify Blobs stores.

## 1. Replace the code

Back up `D:\riyas-portfolio`. Extract this ZIP into a separate folder, then copy its project contents into `D:\riyas-portfolio`, replacing the source files, package files, and configuration files. Keep your existing `.git` directory and private `.env` files. Do not delete your Netlify project or its Blobs stores.

The archive includes `.gitignore`, `.prettierrc.json`, and `.prettierignore`; copy these too. Old unused `lib/connector-*` files, `lib/connectors.ts`, and `app/admin-auth.ts` may be removed if they remain from an earlier package. Nothing imports them anymore.

Run in your VS Code PowerShell terminal:

```powershell
cd D:\riyas-portfolio
npm ci
```

## 2. Correct the Netlify site URL

Set the Netlify environment variable `SITE_URL` to:

```text
https://risme-riyas-portfolio.netlify.app
```

Give it Production / Functions runtime access. Use the main public domain when signing in and testing the contact form. Redirects now use this canonical URL, rather than Netlify's internal request address. Exact aliases from Netlify's trusted `DEPLOY_URL` and `DEPLOY_PRIME_URL` are accepted if those variables are available at runtime. Arbitrary origins and caller-supplied forwarded-host values are rejected.

## 3. Regenerate the admin secrets once

The old setup generator could write literal backslash-n text instead of two separate lines. This version fixes that bug and validates the generated hash format. Generate a fresh file privately, even if you already ran the older script. This changes the admin password/hash and signs out old sessions after deployment.

Run these one at a time. Enter a unique password when prompted, not inside the command text:

```powershell
$secret = Read-Host 'Choose your admin password (14–256 characters)' -AsSecureString
$env:PORTFOLIO_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password
npm run admin:setup
Remove-Item Env:PORTFOLIO_ADMIN_PASSWORD
Remove-Variable secret
notepad .env.netlify
```

The file must have **two separate lines**, one for `ADMIN_PASSWORD_HASH` and one for `SESSION_SECRET`. In Netlify, replace each corresponding variable with only the text after its `=`. Mark both as secret. Keep the admin password in your password manager. Do not share this file or its values in chat or GitHub.

Keep the existing `GMAIL_USER` and `GMAIL_APP_PASSWORD` variables. The Google App Password is different from your portfolio admin password.

## 4. Check and publish

```powershell
npm run check
npm run format:check
npm run test:origin
npm run test:setup
npm run test:email
npm run build
npm run test:smoke
```

Tests use temporary local storage and a fake email sender. They do not send real email. A deliberate email failure message during `test:email` verifies the failure/retry behavior.

Review `git status` before committing. No private `.env` file should be staged.

```powershell
git add app components lib scripts package.json package-lock.json tsconfig.json next.config.mjs netlify.toml README.md UPGRADE.md .gitignore .prettierrc.json .prettierignore .env.example
git commit -m 'Clean up portfolio code and fix admin login redirects'
git push origin main
```

Wait for the Production deployment to finish. If Netlify does not build automatically, trigger a new production deployment of the latest commit.

## 5. Verify the live site

1. Open https://risme-riyas-portfolio.netlify.app/login in a private browser window.
2. Sign in with the password you chose in step 3. It should stay on the main public domain after login.
3. Save a small project edit, refresh, and confirm it persists.
4. Submit a test inquiry, selecting a budget starting at USD 100.
5. Confirm the inquiry appears in `/admin/inquiries` and Gmail (including Spam).
6. Sign out and confirm the inbox and project editor require login again.

Local checks cannot confirm your live environment variables or actual Gmail delivery. Those require the deployed test above.

## Code organization

- `app/`: pages and API entry points.
- `components/`: portfolio, project editor, inquiry inbox, and shared interface components.
- `lib/auth.ts`: admin credentials, session signing/verification, and cookies.
- `lib/site-url.ts`: canonical public URL, safe redirects, and origin validation.
- `lib/portfolio.ts` / `lib/inquiries.ts`: shared validation and types.
- `lib/storage.ts`: Netlify Blobs adapter and atomic rate limits.
- `lib/inquiry-email.ts`: Gmail notifications and delivery leases/status.
- `scripts/`: private admin setup and repeatable checks.

Use `npm run format` after future edits and `npm run format:check` to verify formatting. Existing project screenshots, styling, animation behavior, and saved-data field names are retained.
