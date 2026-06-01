# WealthKit — Quick Start Cheat Sheet
## Copy-paste commands to get running in 15 minutes

---

## Local Setup (5 min)

```bash
# 1. Extract and navigate
unzip wealthkit-complete.zip && cd wealthkit

# 2. Install dependencies
npm install

# 3. Generate NextAuth secret
openssl rand -base64 32

# 4. Create .env.local
cp .env.local.example .env.local

# 5. Edit .env.local with your values:
# NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
# NEXTAUTH_SECRET=<paste secret from step 3>
# NEXTAUTH_URL=http://localhost:3000
# GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=GOCSPX-xxx
# RESEND_API_KEY=re_xxx
# RESEND_FROM_EMAIL=onboarding@resend.dev
# NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
# RAZORPAY_KEY_SECRET=xxx
# NEXT_PUBLIC_APP_URL=http://localhost:3000
# CRON_SECRET=any-random-string

# 6. Run dev server
npm run dev
```

**Then open:** http://localhost:3000

---

## Supabase Setup (2 min)

1. **Go to:** https://supabase.com → New Project
2. **Copy from Project Settings:**
   - API URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

3. **Create schema:**
   - SQL Editor → New query
   - Paste `supabase/migrations/001_initial_schema.sql`
   - Run

4. **Create storage:**
   - Storage → New bucket → `wealthkit-pdfs`
   - Check "Public bucket"
   - SQL Editor → Paste `supabase/migrations/002_storage_policies.sql` → Run

---

## Google OAuth (2 min)

1. **Go to:** https://console.cloud.google.com
2. **Create project** → name: WealthKit
3. **Enable API:** Search "Google+ API" → Enable
4. **Create credentials:**
   - APIs & Services → Credentials → Create → OAuth 2.0 Client ID
   - Web application
   - Add authorized redirects:
     - `http://localhost:3000/api/auth/callback/google` (local)
     - `https://yourdomain.vercel.app/api/auth/callback/google` (prod)
5. **Copy to .env.local:**
   - `GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET=GOCSPX-xxx`

---

## Resend Email (1 min)

1. **Go to:** https://resend.com → Sign up
2. **Get API key:** Dashboard → API Keys → Create
3. **Copy to .env.local:**
   - `RESEND_API_KEY=re_xxx`
   - `RESEND_FROM_EMAIL=onboarding@resend.dev` (test) or your domain (production)

---

## Razorpay Payments (1 min)

1. **Go to:** https://razorpay.com → Sign up
2. **Get test keys:** Settings → API Keys → Test tab
3. **Copy to .env.local:**
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx`
   - `RAZORPAY_KEY_SECRET=xxx`

---

## Deploy to Vercel (3 min)

### Option A: Dashboard (easiest)

```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Go to https://vercel.com/new
# 3. Import GitHub repo
# 4. Add env variables (same as .env.local)
# 5. Click Deploy
```

### Option B: CLI

```bash
npm i -g vercel
vercel login
vercel
# Follow prompts

# Add env vars
vercel env add NEXT_PUBLIC_SUPABASE_URL
# ... repeat for each variable

# Deploy to production
vercel --prod
```

---

## Test Sign-In

1. **Local:** http://localhost:3000/auth/login
   - Try Google OAuth
   - Try email (check Resend inbox)

2. **Production:** https://yourdomain.vercel.app/auth/login
   - Same tests

---

## Create First Proposal

1. Sign in → `/dashboard`
2. **Branding** → `/dashboard/branding` → Fill in your details
3. **Calculator** → `/dashboard/calculators` → Click "SIP Calculator"
4. Adjust sliders → "Save as proposal"
5. **Proposal** → `/dashboard/proposals` → Click the proposal → "Generate PDF"

---

## Common Commands

```bash
# Local development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run lint                   # Check code quality
npx tsc --noEmit             # TypeScript check

# Database
# (Use Supabase dashboard SQL editor)

# Deployment
vercel                         # Deploy to staging
vercel --prod                  # Deploy to production
vercel logs                    # View live logs
vercel rollback                # Revert to previous

# Git
git add .
git commit -m "message"
git push origin main           # Auto-deploys in Vercel
```

---

## API Endpoints (for testing)

```bash
# Get all clients
curl -H "Authorization: Bearer $SESSION_TOKEN" \
  http://localhost:3000/api/clients

# Create client
curl -X POST -H "Authorization: Bearer $SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Rajesh","email":"rajesh@example.com","stage":"lead"}' \
  http://localhost:3000/api/clients

# Get subscription
curl -H "Authorization: Bearer $SESSION_TOKEN" \
  http://localhost:3000/api/billing/subscription

# Generate PDF for proposal
curl -X POST -H "Authorization: Bearer $SESSION_TOKEN" \
  http://localhost:3000/api/proposals/proposal-id/generate-pdf
```

---

## Environment Variables Checklist

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# NextAuth (required)
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Google OAuth (required for login)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Resend Email (required for sign-up emails)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Razorpay Payments (required for billing)
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# App Config (required)
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=WealthKit

# Cron Jobs (required)
CRON_SECRET=
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **"Invalid redirect_uri"** | Update Google Cloud OAuth redirect URIs to match your domain |
| **Magic link not received** | Check Resend Dashboard → Emails tab; for `onboarding@resend.dev`, check Resend inbox |
| **PDF generation fails** | Check browser console for error; increase Vercel function timeout in `vercel.json` |
| **Razorpay checkout error** | Verify API keys in Vercel env vars; check test mode is enabled |
| **"Session not found"** | Clear browser cookies; verify `NEXTAUTH_SECRET` matches in local and prod |
| **Dashboard blank after login** | Check browser console; verify `NEXT_PUBLIC_SUPABASE_URL` is correct |

---

## Production Checklist

- [ ] All env variables set in Vercel
- [ ] Custom domain pointed to Vercel
- [ ] Razorpay webhook URL configured
- [ ] Google OAuth redirect URI updated to production domain
- [ ] Resend domain verified (optional, use default for testing)
- [ ] Database backups enabled (Supabase auto-backup)
- [ ] Monitoring set up (Vercel Analytics)
- [ ] Error tracking configured (optional: Sentry)
- [ ] HTTPS enabled (automatic in Vercel)

---

## Support

- **Docs:** Full guide in `IMPLEMENTATION_GUIDE.md`
- **Code:** Browse `app/`, `lib/`, `components/` directories
- **Types:** `lib/types.ts` has all TypeScript interfaces
- **API Routes:** Check `app/api/` for endpoint implementations

---

**Happy building!** 🚀

Once you sign in, explore the `/dashboard` to see all features.
