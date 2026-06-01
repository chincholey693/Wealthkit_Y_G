# WealthKit — Deployment Guide

## Prerequisites
- Node.js 18+
- Git
- Accounts at: Supabase, Vercel, Google Cloud Console, Resend, Razorpay

---

## Step 1 — Supabase Setup (10 min)

1. Go to [supabase.com](https://supabase.com) → New project
2. Name it `wealthkit`, choose a strong DB password
3. Wait for project to start (~2 min)
4. Go to **SQL Editor** → paste the entire contents of `supabase/migrations/001_initial_schema.sql` → Run
5. Go to **Storage** → Create bucket named `wealthkit-pdfs` → set it to **Public**
6. Go to **Settings → API** → copy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2 — Google OAuth (5 min)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. New project → Enable **Google+ API**
3. Credentials → Create OAuth 2.0 Client ID
4. Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`
5. Copy `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

---

## Step 3 — Resend Email (3 min)

1. Go to [resend.com](https://resend.com) → Sign up
2. API Keys → Create key → copy as `RESEND_API_KEY`
3. Set `RESEND_FROM_EMAIL` to `noreply@yourdomain.com` (or use `onboarding@resend.dev` for testing)

---

## Step 4 — Razorpay (5 min)

1. Go to [razorpay.com](https://razorpay.com) → Sign up
2. Settings → API Keys → Generate Test Key
3. Copy as `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
4. For live payments: complete KYC (1-2 business days)

---

## Step 5 — Local Development

```bash
# Clone or unzip the project
cd wealthkit

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local
# Fill in all values from steps above

# Generate NextAuth secret
openssl rand -base64 32
# Paste as NEXTAUTH_SECRET in .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Step 6 — Deploy to Vercel (5 min)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (from project root)
vercel

# Follow prompts, then set environment variables:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL          # https://yourdomain.vercel.app
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add RESEND_API_KEY
vercel env add RESEND_FROM_EMAIL
vercel env add NEXT_PUBLIC_RAZORPAY_KEY_ID
vercel env add RAZORPAY_KEY_SECRET
vercel env add NEXT_PUBLIC_APP_URL   # https://yourdomain.vercel.app

# Deploy to production
vercel --prod
```

---

## Step 7 — Custom Domain (optional, 5 min)

1. Vercel → Project → Settings → Domains
2. Add your domain (e.g. `app.wealthkit.in`)
3. Add CNAME record at your DNS provider pointing to `cname.vercel-dns.com`
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` env vars to new domain

---

## Step 8 — Razorpay Webhook

1. Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
3. Secret: use a random string, add to env as `RAZORPAY_WEBHOOK_SECRET`
4. Select events: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.halted`

---

## Step 9 — Create Razorpay Plans

In Razorpay Dashboard → Products → Subscriptions → Plans, create:

| Plan | Amount | Period |
|------|--------|--------|
| Starter Monthly | ₹499 | Monthly |
| Starter Yearly | ₹4,790 | Yearly |
| Professional Monthly | ₹1,299 | Monthly |
| Professional Yearly | ₹12,590 | Yearly |
| Premium Monthly | ₹2,999 | Monthly |
| Premium Yearly | ₹28,790 | Yearly |

Then update the `razorpay_plan_id_monthly` / `razorpay_plan_id_yearly` columns in the `plans` table with the IDs.

---

## Environment Variables Reference

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_APP_URL=
```

---

## Architecture Summary

```
WealthKit/
├── app/
│   ├── api/          # REST API routes (auth, clients, proposals, billing, webhooks)
│   ├── auth/         # Login, error, verify pages
│   ├── dashboard/    # Protected distributor dashboard
│   │   ├── calculators/  # 19+ calculator pages
│   │   ├── clients/      # CRM + client detail
│   │   ├── leads/        # Kanban pipeline
│   │   ├── proposals/    # Proposal list + detail
│   │   ├── meetings/     # Follow-up calendar
│   │   ├── analytics/    # Business dashboard
│   │   ├── branding/     # Logo, colors, advisor details
│   │   ├── billing/      # Plans + Razorpay checkout
│   │   └── settings/     # Account settings
│   └── p/[token]/    # Public proposal share page (no login)
├── components/
│   ├── calculators/  # Reusable calc UI (sliders, charts, shells)
│   ├── dashboard/    # Sidebar, topbar, metric cards, etc.
│   ├── pdf/          # @react-pdf/renderer proposal template
│   └── proposals/    # Share panel
├── lib/
│   ├── calculators/  # formulas.ts (pure math) + registry.ts (metadata)
│   ├── supabase/     # client.ts + server.ts
│   ├── types.ts      # All TypeScript interfaces
│   └── utils.ts      # cn, formatLakhsCrores, etc.
├── supabase/
│   └── migrations/   # SQL schema
├── auth.ts           # NextAuth config
└── middleware.ts     # Route protection
```

---

## Costs (monthly at 0 customers)

| Service | Cost |
|---------|------|
| Vercel (Hobby) | Free |
| Supabase (Free tier) | Free |
| Resend (3k emails/mo) | Free |
| Razorpay | 0% until ₹5L/mo, then 2% |
| Domain | ~₹800/year |
| **Total** | **~₹0/month until revenue** |
