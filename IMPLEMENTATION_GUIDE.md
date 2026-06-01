# WealthKit Implementation Guide
## Complete Step-by-Step Setup, Customization & Deployment

**Version 1.0 | Updated May 2026**

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Local Development Setup](#local-development-setup)
4. [Database Configuration](#database-configuration)
5. [Authentication Setup](#authentication-setup)
6. [Email Service Configuration](#email-service-configuration)
7. [Payment Gateway Integration](#payment-gateway-integration)
8. [Calculator Engine Customization](#calculator-engine-customization)
9. [Branding & White-Label](#branding--white-label)
10. [Deployment to Vercel](#deployment-to-vercel)
11. [Post-Deployment Configuration](#post-deployment-configuration)
12. [Monitoring & Maintenance](#monitoring--maintenance)
13. [Troubleshooting Guide](#troubleshooting-guide)
14. [API Documentation](#api-documentation)
15. [Advanced Customization](#advanced-customization)

---

## Architecture Overview

### System Components

WealthKit is built on a **serverless, multi-tenant SaaS architecture** with these core layers:

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (Next.js 14 + React + Tailwind CSS)                    │
│ • Dashboard (protected)                                          │
│ • Public proposal share pages                                    │
│ • 19+ calculator UIs                                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│ API Layer (Next.js API Routes)                                   │
│ • Auth endpoints (NextAuth)                                      │
│ • CRUD operations (clients, proposals, etc)                      │
│ • PDF generation (Puppeteer/React PDF)                           │
│ • Webhooks (Razorpay, email callbacks)                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│ Data Layer (Supabase PostgreSQL)                                 │
│ • Tenants (SaaS companies/distributors)                          │
│ • Users (staff under each tenant)                                │
│ • Clients (leads/prospects/customers)                            │
│ • Proposals (saved calculations)                                 │
│ • Subscriptions & billing history                                │
│ • Audit logs (compliance)                                        │
│ • Row-level security (RLS) for multi-tenancy                     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│ External Services                                                │
│ • Razorpay (payments, subscriptions)                             │
│ • Resend (transactional email)                                   │
│ • Google OAuth (authentication)                                  │
│ • Supabase Storage (PDF hosting)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Model Relationships

```
Tenant (MFD company)
├─ Plans (subscription tiers: Starter, Professional, Premium, Enterprise)
├─ Users (staff, max based on plan)
│  └─ AuthUser (NextAuth identity)
├─ Subscriptions (active subscription for tenant)
│  └─ Plan (linked plan details)
├─ Clients (leads/prospects/clients)
│  ├─ Proposals
│  │  └─ audit_logs (who created, when, from which calculator)
│  └─ Followups (meetings, calls, reminders)
├─ Invoices (billing history)
└─ AuditLogs (all actions, for compliance)
```

### Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 14 + TypeScript | Full-stack React, SSR for PDFs, built-in API routes |
| **UI Framework** | Tailwind CSS | Fast iteration, dark mode ready, mobile-first |
| **Charts** | Recharts | React-native, responsive, financial chart-friendly |
| **Database** | PostgreSQL (Supabase) | ACID compliance, RLS for multi-tenancy, JSON support |
| **Auth** | NextAuth + Google OAuth | Industry standard, built for Next.js, magic links via Resend |
| **Email** | Resend | Modern API, React email templates, 3k free monthly |
| **Payments** | Razorpay | India-first, instant checkout, webhook reliability |
| **PDF Generation** | @react-pdf/renderer | Server-side React components → PDFs |
| **Storage** | Supabase Storage (S3-like) | Free 1GB, CDN included, Supabase-native |
| **Hosting** | Vercel | Next.js optimized, edge functions, built-in CI/CD |

---

## Pre-Deployment Checklist

### Accounts You'll Need to Create

Estimated time: **30 minutes**

- [ ] **Supabase** account (free tier) → https://supabase.com
  - Create organization → Create project
  - Wait for deployment (~2 min)
  - Note your project URL & anon key

- [ ] **Vercel** account (free tier) → https://vercel.com
  - Connect your GitHub account (if deploying from repo)
  - Or just deploy via CLI: `npm i -g vercel && vercel login`

- [ ] **Google Cloud Console** account → https://console.cloud.google.com
  - Create new project
  - Enable Google+ API
  - Create OAuth 2.0 Client ID
  - Add redirect URI: `https://yourdomain.com/api/auth/callback/google`
  - Copy Client ID & Client Secret

- [ ] **Resend** account (free tier) → https://resend.com
  - Create API key
  - Set up domain (optional, free tier defaults to `onboarding@resend.dev`)
  - If custom domain: add DKIM/SPF records to your DNS

- [ ] **Razorpay** account → https://razorpay.com
  - Sign up with business details (can be your personal name initially)
  - Go to Settings → API Keys → Generate Test Keys
  - Note: Test keys work indefinitely. Switch to Live after KYC (1-2 business days)

- [ ] **Domain name** (optional)
  - Recommended: `yourdomain.com` or `app.yourdomain.in`
  - Point to Vercel with CNAME record

### Pre-Flight Checks

- [ ] You have **Node.js 18+** installed (`node --version`)
- [ ] You have **npm** installed (`npm --version`)
- [ ] You have **Git** installed (to clone/push code)
- [ ] Your ISP doesn't block outbound HTTPS (test: `curl https://api.github.com`)
- [ ] You have a text editor (VSCode recommended)

---

## Local Development Setup

### Step 1: Clone or Extract the Project

```bash
# If you have the zip file:
unzip wealthkit-complete.zip
cd wealthkit

# Or if on GitHub:
git clone https://github.com/yourorg/wealthkit.git
cd wealthkit
```

### Step 2: Install Dependencies

```bash
npm install
# This installs all packages in package.json
# Takes ~2-3 minutes on first run
```

**If you hit errors:**
- `npm ERR! ERESOLVE unable to resolve dependency tree`
  → Run: `npm install --legacy-peer-deps`
- `npm ERR! code EACCES` (permission denied)
  → Your npm installation has permission issues. Fix: `sudo chown -R $(whoami) ~/.npm`

### Step 3: Create Environment File

```bash
cp .env.local.example .env.local
```

Now open `.env.local` and fill in:

```env
# ─── SUPABASE (from project settings → API) ────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ─── NEXTAUTH ───────────────────────────────────────────────────
# Generate secret: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<paste-your-32-char-secret-here>

# ─── GOOGLE OAUTH (from Google Cloud Console) ───────────────────
# Redirect URI must include: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=xxxx-xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxx

# ─── RESEND EMAIL ────────────────────────────────────────────────
# For testing: use noreply@example.com (will be marked as test domain)
# For production: set up a real domain in Resend dashboard
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@example.com

# ─── RAZORPAY (Test mode keys from Settings → API Keys) ─────────
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx

# ─── APP CONFIG ──────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=WealthKit

# ─── CRON JOBS (any random string) ──────────────────────────────
CRON_SECRET=your-random-secret-for-cron-jobs
```

**Where to get each value:**

| Env Var | Source | Instructions |
|---------|--------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard | Project → Settings → Configuration → API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard | Project → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard | Project → Settings → API → service_role (⚠️ keep secret) |
| `NEXTAUTH_SECRET` | Generate locally | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google Cloud Console | APIs & Services → Credentials → OAuth 2.0 Client |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console | Same location |
| `RESEND_API_KEY` | Resend Dashboard | API Keys → Create |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard | Settings → API Keys → Test/Live |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard | Same location |

### Step 4: Initialize Supabase

1. **Create tables & schema:**
   - Go to Supabase Dashboard → SQL Editor
   - New query
   - Copy entire contents of `supabase/migrations/001_initial_schema.sql`
   - Paste & run
   - Wait for completion (should show "✓ Success")

2. **Create storage bucket:**
   - Supabase Dashboard → Storage
   - New bucket → Name: `wealthkit-pdfs`
   - Tick "Public bucket" ✓
   - Create bucket

3. **Set up storage policies:**
   - SQL Editor → New query
   - Paste `supabase/migrations/002_storage_policies.sql`
   - Run

### Step 5: Start Development Server

```bash
npm run dev
```

You should see:
```
> wealthkit@1.0.0 dev
> next dev

  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

**Open in browser:** http://localhost:3000

You should see the WealthKit landing page. Click "Get started" and try signing in.

### Step 6: Test the Login Flow

1. Click "Get started"
2. Try Google OAuth (if Google credentials are correct)
3. Or use email magic link with `noreply@example.com` (Resend test domain sends to your Resend inbox)

**If login fails:**
- Check browser console (F12) for error messages
- Check terminal logs for server errors
- Verify `.env.local` values are correct (no extra spaces)

### Step 7: First-Time Setup Inside App

After signing in, you'll be taken to `/dashboard` → complete setup:

1. **Branding page** (`/dashboard/branding`)
   - Add your name, company, ARN number
   - Choose brand color
   - This appears on all PDFs

2. **Run a calculator** (`/dashboard/calculators`)
   - Click "SIP Calculator"
   - Adjust sliders
   - Click "Save as proposal"

3. **View proposal** (`/dashboard/proposals`)
   - See the saved proposal
   - Try sharing link or downloading PDF

---

## Database Configuration

### Understanding the Schema

WealthKit uses a **multi-tenant** PostgreSQL schema where each company (MFD) is isolated via `tenant_id`.

#### Core Tables

**1. tenants** — SaaS companies/distributors
```sql
id (UUID primary key)
name (company name)
advisor_name
advisor_designation
company_name
company_phone
company_email
brand_color (hex, e.g., #2563EB)
arn_number (AMFI registration)
euin_number
gstin
disclaimer (legal text for PDFs)
created_at
updated_at
```

**2. plans** — Subscription tiers
```sql
id (UUID)
name (starter, professional, premium, enterprise)
display_name
price_monthly
price_yearly
max_users
max_pdf_monthly (-1 = unlimited)
max_clients (-1 = unlimited)
razorpay_plan_id_monthly (e.g., plan_xxxxx)
razorpay_plan_id_yearly
features (JSONB array)
active (boolean)
```

**3. subscriptions** — Tenant's active subscription
```sql
id (UUID)
tenant_id (foreign key)
plan_id (foreign key)
status (trial, active, expired, cancelled)
current_period_start
current_period_end
trial_ends_at
pdf_count_this_month (current usage)
pdf_count_reset_at (when counter resets)
razorpay_subscription_id (for webhook matching)
razorpay_customer_id
```

**4. users** — Staff under each tenant
```sql
id (UUID)
tenant_id (foreign key)
auth_user_id (NextAuth user ID)
name
email
role (admin, member)
created_at
```

**5. clients** — Leads, prospects, customers
```sql
id (UUID)
tenant_id (foreign key)
name
email
phone
city
state
annual_income
risk_profile (conservative, moderate, aggressive, very_aggressive)
kyc_status (not_done, pending, verified)
stage (lead, prospect, client, inactive)
notes (text)
tags (JSONB array, e.g., ["high-value", "solar"])
source (where they came from)
created_at
updated_at
```

**6. proposals** — Saved calculator results
```sql
id (UUID)
tenant_id (foreign key)
client_id (foreign key, nullable)
title
description
calculator_type (sip, goal_sip, retirement, etc)
status (draft, sent, viewed, converted)
inputs (JSONB — calculator input values)
outputs (JSONB — calculator results)
chart_data (JSONB — for graphs)
pdf_url (Supabase Storage URL)
share_token (UUID, for public share link)
share_enabled (boolean)
share_views (count)
created_at
sent_at
pdf_generated_at
```

**7. followups** — Meetings, calls, reminders
```sql
id (UUID)
tenant_id (foreign key)
client_id (foreign key)
title
type (call, meeting, email, whatsapp, other)
due_at (when it's due)
completed_at (when completed, NULL if pending)
notes
created_by (user_id)
```

**8. audit_logs** — Compliance/activity tracking
```sql
id (UUID)
tenant_id (foreign key)
user_id (who did it)
action (pdf_generated, proposal_shared, client_created, etc)
entity_type (proposal, client, subscription, etc)
entity_id (which proposal, etc)
metadata (JSONB, additional details)
created_at
```

### Row-Level Security (RLS)

WealthKit uses Supabase RLS to enforce multi-tenancy. **Each user can only see data for their tenant.**

Example (in SQL):
```sql
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can see their own proposals"
  ON proposals
  FOR SELECT
  USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

When a user logs in, NextAuth sets their session with `user.tenantId`. The Supabase client automatically injects this into RLS checks.

### Customizing the Schema

**To add a field to clients** (e.g., "preferred_contact_method"):

```sql
-- In Supabase SQL Editor
ALTER TABLE clients ADD COLUMN preferred_contact_method VARCHAR(50);

-- Then update your TypeScript types in lib/types.ts:
export interface Client {
  id: string
  name: string
  // ... existing fields
  preferred_contact_method?: 'phone' | 'email' | 'whatsapp'
}

-- And update the form in app/dashboard/clients/page.tsx to show this field
```

---

## Authentication Setup

### How NextAuth Works in WealthKit

WealthKit uses **NextAuth.js** with two providers:

1. **Google OAuth** — One-click sign-up
2. **Resend Magic Link** — Email-based sign-in

**Flow:**
```
User clicks "Sign in with Google" or enters email
    ↓
NextAuth calls provider (Google/Resend)
    ↓
Provider returns user ID + email
    ↓
NextAuth checks if user exists in Supabase
    ↓
If NOT exists:
  - Create user in auth_users table
  - Create tenant (new company)
  - Create trial subscription
  - Return session with tenantId
    ↓
If exists:
  - Return existing session
    ↓
User is redirected to /dashboard with session cookie
```

### Configuration File: `auth.ts`

Key sections:

```typescript
export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL,
    }),
  ],

  // On first sign-in, create tenant + subscription
  callbacks: {
    signIn: async ({ user }) => {
      // User just authenticated via Google/Resend
      // Return true to allow sign-in
      return true
    },

    session: async ({ session, user }) => {
      // Add tenantId to session (used throughout app)
      session.user.tenantId = user.tenantId
      session.user.role = user.role
      return session
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
})
```

### Setting Up Google OAuth

1. **Go to Google Cloud Console:** https://console.cloud.google.com

2. **Create a new project:**
   - Click project selector (top left)
   - "New Project"
   - Name: "WealthKit"
   - Create

3. **Enable Google+ API:**
   - Search "Google+ API" in search bar
   - Click result → "Enable"

4. **Create OAuth credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Create credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Name: "WealthKit Web"
   - Authorized JavaScript origins: 
     - `http://localhost:3000` (local testing)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (local)
     - `https://yourdomain.com/api/auth/callback/google` (prod)
   - Create

5. **Copy credentials:**
   - Your Client ID and Client Secret appear
   - Paste into `.env.local`:
     ```env
     GOOGLE_CLIENT_ID=xxxx-xxxx.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
     ```

**Test locally:**
- Run `npm run dev`
- Go to http://localhost:3000/auth/login
- Click "Continue with Google"
- Sign in with your Google account
- You should be redirected to `/dashboard`

### Setting Up Magic Link Email (Resend)

1. **Get Resend API Key:**
   - Go to https://resend.com → Sign up
   - Dashboard → API Keys → Create
   - Copy key to `.env.local`:
     ```env
     RESEND_API_KEY=re_xxxxxxxxx
     ```

2. **Set from email:**
   ```env
   RESEND_FROM_EMAIL=noreply@example.com
   ```
   (For free tier, use `onboarding@resend.dev` or add your own domain)

3. **Test locally:**
   - http://localhost:3000/auth/login
   - Click "Send magic link"
   - Enter any email (e.g., `test@example.com`)
   - Check your Resend Dashboard → Emails
   - Click the preview link
   - You're now signed in

### Customizing Auth Pages

**Login page:** `app/auth/login/page.tsx`

To change the login form design:
- Colors: Modify `bg-blue-600` classes
- Text: Change button labels, descriptions
- Add fields: Modify form inputs

**Error page:** `app/auth/error/page.tsx`

To customize error messaging:
```typescript
export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  
  // Show different messages based on error type
  if (error === 'OAuthSignin') {
    return <p>Google sign-in failed. Try again.</p>
  }
  // ... more error handling
}
```

### Managing Sessions

**Session data is available everywhere via:**
```typescript
import { auth } from '@/auth'

const session = await auth()
const tenantId = session?.user?.tenantId
const userId = session?.user?.id
const userName = session?.user?.name
```

**Sign out:**
```typescript
import { signOut } from '@/auth'

<button onClick={() => signOut()}>Sign out</button>
```

---

## Email Service Configuration

### Resend Overview

Resend is a modern email API built for developers. It handles:
- Transactional emails (magic links, welcome emails, PDF shares)
- Email templates (React components → HTML)
- Bounces/complaints tracking
- Deliverability monitoring

### Setup Steps

1. **Create Resend account:** https://resend.com
2. **Generate API key:**
   - Dashboard → API Keys → Create
   - Copy to `.env.local`
3. **Verify domain (optional):**
   - Add DKIM/SPF records to DNS
   - Use custom `from` addresses
   - For now, use `onboarding@resend.dev` for testing

### Email Templates in WealthKit

Located in `lib/email.ts`. Each function returns a Resend API call:

```typescript
// Send welcome email
export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: `WealthKit <${FROM}>`,
    to,
    subject: 'Welcome to WealthKit 🎉',
    html: `<div>...email HTML here...</div>`,
  })
}
```

### Modifying Email Templates

**Example: Change welcome email color from blue to green**

In `lib/email.ts`:
```typescript
// Find this:
<div style="background: #1e3a8a; ...">

// Change to:
<div style="background: #16a34a; ..."> {/* green-600 */}
```

**Example: Add company logo to emails**

```typescript
export async function sendWelcomeEmail(to: string, name: string, logoUrl?: string) {
  const emailHtml = `
    <div>
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-width: 200px;">` : ''}
      <!-- rest of email -->
    </div>
  `
  return resend.emails.send({
    from: `WealthKit <${FROM}>`,
    to,
    subject: 'Welcome to WealthKit',
    html: emailHtml,
  })
}
```

### Triggering Emails in Your Code

**When user signs up (auto via NextAuth):**
```typescript
// In auth.ts callbacks.signIn:
await sendWelcomeEmail(user.email, user.name)
```

**When sharing a proposal:**
```typescript
// In app/api/proposals/[id]/send-email/route.ts:
POST /api/proposals/123/send-email
Body: { clientEmail: 'client@example.com', clientName: 'John' }
  ↓
await sendProposalEmail({ to, clientName, ... })
```

**When subscription renews:**
Cron job runs daily:
```bash
# Vercel cron (from vercel.json)
path: /api/cron/send-renewal-reminders
schedule: "0 9 * * *" (daily at 9 AM UTC)
```

### Email Delivery Troubleshooting

**Problem: Email not received**

1. Check Resend Dashboard → Emails
   - Did it get sent? (status = "Sent" or "Delivered")
   - Check "Bounced" tab if failed
2. Check `.env` — is `RESEND_API_KEY` correct?
3. For testing, use `onboarding@resend.dev` from
4. Check spam folder (add `noreply@resend.dev` to contacts)

**Problem: Using custom domain, emails bounce**

1. Go to Resend Dashboard → Domains
2. Add your domain (e.g., `mail.yourdomain.com`)
3. Add DKIM/SPF records shown in Resend
4. Wait 24 hours for DNS propagation
5. Update `RESEND_FROM_EMAIL` to your domain

### Rate Limits

Resend free tier: **3,000 emails/month**

If you exceed, upgrade to paid or enable batching:
```typescript
// Don't send 1000 welcome emails at once!
// Instead, queue them (use Bull/BullMQ job queue)

// Or, send in batches:
for (let i = 0; i < emailList.length; i += 10) {
  const batch = emailList.slice(i, i + 10)
  await Promise.all(batch.map(e => sendEmail(e)))
  await new Promise(r => setTimeout(r, 1000)) // 1 sec between batches
}
```

---

## Payment Gateway Integration

### Razorpay Setup

Razorpay handles:
- **Subscriptions** — recurring monthly/yearly billing
- **Invoices** — auto-generated for each payment
- **Webhooks** — notify WealthKit when payments succeed/fail

### Getting Started

1. **Create Razorpay account:** https://razorpay.com
   - Sign up with business/personal details
   - Email verification
2. **Get API keys:**
   - Dashboard → Settings → API Keys
   - You'll see Test Keys (start here)
   - Copy:
     - Key ID (public) → `NEXT_PUBLIC_RAZORPAY_KEY_ID`
     - Key Secret (private) → `RAZORPAY_KEY_SECRET`

3. **Understand Test vs Live:**
   - **Test mode:** Fake charges, for development
   - **Live mode:** Real money charged to customer
   - Switch after KYC verification (1-2 business days)

### Creating Subscription Plans in Razorpay

WealthKit uses Razorpay's **Plans** feature for recurring billing.

**In Razorpay Dashboard:**

1. Go to **Products** → **Subscriptions** → **Plans**

2. Create Starter Monthly plan:
   - Plan name: `WealthKit Starter Monthly`
   - Amount: ₹499
   - Currency: INR
   - Interval: Monthly (30 days)
   - **Copy the Plan ID** (format: `plan_xxxxx`)

3. Create Starter Yearly:
   - Amount: ₹4,790
   - Interval: Yearly (365 days)
   - **Copy the Plan ID**

4. Repeat for Professional & Premium

**Then in your database**, update the `plans` table:

```sql
UPDATE plans 
SET razorpay_plan_id_monthly = 'plan_xxxxx' 
WHERE name = 'starter';

UPDATE plans 
SET razorpay_plan_id_yearly = 'plan_xxxxx' 
WHERE name = 'starter';

-- Repeat for professional, premium
```

Or via Supabase UI:
- Table Editor → plans
- Edit each row, paste Razorpay plan IDs

### Checkout Flow in WealthKit

**User clicks "Upgrade to Professional":**

```
/dashboard/billing?plan=professional&cycle=monthly
  ↓
handleUpgrade() called
  ↓
POST /api/billing/checkout
Body: { planName: 'professional', billingCycle: 'monthly' }
  ↓
API creates Razorpay subscription
  ↓
Returns checkout URL
  ↓
window.location.href = checkoutUrl
  ↓
User sees Razorpay checkout modal
  ↓
User enters card details, pays
  ↓
Razorpay webhook hits /api/webhooks/razorpay
  ↓
Webhook verifies HMAC signature
  ↓
Webhook updates subscription status in database
  ↓
User is redirected to dashboard
```

### Webhook Setup

**In Razorpay Dashboard:**

1. Go to **Settings** → **Webhooks**
2. Create webhook:
   - URL: `https://yourdomain.com/api/webhooks/razorpay`
   - Events to listen for:
     - `subscription.activated` (when subscription starts)
     - `subscription.charged` (monthly/yearly charge succeeds)
     - `subscription.cancelled` (user cancels)
     - `subscription.halted` (payment failed multiple times)

3. **Webhook Secret:**
   - You'll get a secret in the Razorpay dashboard
   - Add to `.env`:
     ```env
     RAZORPAY_WEBHOOK_SECRET=whsec_xxxxx
     ```

**Webhook Handler:**

In `app/api/webhooks/razorpay/route.ts`:

```typescript
export async function POST(req: Request) {
  const body = await req.json()
  const signature = req.headers.get('x-razorpay-signature')

  // 1. Verify HMAC signature (prevents spoofing)
  const verified = verifyHMAC(
    JSON.stringify(body),
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET
  )
  
  if (!verified) return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })

  // 2. Handle different event types
  const { event, payload } = body

  if (event === 'subscription.activated') {
    // Update subscription status to 'active' in DB
  } else if (event === 'subscription.charged') {
    // Create invoice record, reset PDF count for this month
  } else if (event === 'subscription.cancelled') {
    // Update status to 'cancelled', maybe send goodbye email
  }

  return NextResponse.json({ received: true })
}
```

### Testing Payments Locally

You **can't** test Razorpay locally (no real checkout without internet). Instead:

1. **Deploy to Vercel** with test keys first
2. Go to https://yourdomain.vercel.app/dashboard/billing
3. Click upgrade
4. Use Razorpay test card: `4111111111111111` / exp `12/25` / CVV `123`
5. Watch the webhook in real-time at `/api/webhooks/razorpay`

### Switching to Live (Production)

**After Razorpay KYC approval:**

1. Razorpay Dashboard → Settings → API Keys
2. Switch to "Live" tab (you may need to activate first)
3. Copy Live Key ID & Key Secret
4. In Vercel Environment Variables:
   - Update `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - Update `RAZORPAY_KEY_SECRET`
   - Redeploy
5. Create live plans in Razorpay (repeat the plan creation steps)
6. Update database with live plan IDs

**⚠️ CRITICAL:** Don't mix test and live. Customers will be angry if charged real money with test cards!

### Handling Payment Failures

When a customer's card is declined:

1. **After 3 failures**, Razorpay halts the subscription
2. Webhook sends `subscription.halted` event
3. Your app:
   - Sets subscription.status = 'halted'
   - Sends email: "Your payment failed, update card at [link]"
   - Restricts PDF generation
4. Customer updates payment method in dashboard
5. Razorpay auto-retries next cycle

### Refunds

If a customer requests a refund:

1. **In Razorpay Dashboard:**
   - Go to Subscription
   - Click "Issue refund"
   - Select amount & reason
   - Razorpay reverses the charge

2. **In your app:**
   - Webhook sends refund event (if configured)
   - Optionally send "Refund issued" email

---

## Calculator Engine Customization

### Adding a New Calculator

**Goal: Create a "Lumpsum vs SIP comparison" calculator**

#### Step 1: Add the formula

In `lib/calculators/formulas.ts`:

```typescript
export interface LumpsumVsSipInput {
  lumpsum: number
  monthlySip: number
  annualReturn: number
  years: number
}

export interface LumpsumVsSipOutput {
  lumpsumFinal: number
  sipFinal: number
  sipBetter: boolean
  difference: number
}

export function calcLumpsumVsSip(input: LumpsumVsSipInput): LumpsumVsSipOutput {
  const { lumpsum, monthlySip, annualReturn, years } = input
  
  const lumpsumFinal = r2(calcLumpsum({ principal: lumpsum, annualReturn, years }).totalValue)
  const sipFinal = r2(calcSip({ monthlyAmount: monthlySip, annualReturn, years }).totalValue)
  
  const sipBetter = sipFinal > lumpsumFinal
  const difference = r2(Math.abs(sipFinal - lumpsumFinal))
  
  return { lumpsumFinal, sipFinal, sipBetter, difference }
}
```

#### Step 2: Add to registry

In `lib/calculators/registry.ts`:

```typescript
const CALCULATORS: CalculatorMeta[] = [
  // ... existing entries ...
  {
    type: 'lumpsum_vs_sip',
    name: 'Lumpsum vs SIP Comparison',
    shortName: 'Lumpsum vs SIP',
    description: 'See which strategy builds more wealth — monthly SIP or one-time lumpsum.',
    category: 'mutual_fund',
    categoryLabel: 'Mutual Fund',
    icon: '⚖️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    popular: true,
    tags: ['comparison', 'lumpsum', 'sip'],
  },
]
```

#### Step 3: Create the UI page

Create `app/dashboard/calculators/lumpsum-vs-sip/page.tsx`:

```typescript
'use client'

import { useState, useMemo } from 'react'
import { CalcShell, SliderInput, ResultCard, SimpleBarChart } from '@/components/calculators/calc-ui'
import { calcLumpsumVsSip } from '@/lib/calculators/formulas'
import { formatLakhsCrores } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function LumpsumVsSipPage() {
  const router = useRouter()
  const [lumpsum, setLumpsum] = useState(500000)
  const [monthlySip, setMonthlySip] = useState(20000)
  const [rate, setRate] = useState(12)
  const [years, setYears] = useState(10)
  const [saving, setSaving] = useState(false)

  const result = useMemo(() => 
    calcLumpsumVsSip({ lumpsum, monthlySip, annualReturn: rate, years }), 
    [lumpsum, monthlySip, rate, years]
  )

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${result.sipBetter ? 'SIP' : 'Lumpsum'} wins — ${formatLakhsCrores(result.difference)} more`,
        calculator_type: 'lumpsum_vs_sip',
        inputs: { lumpsum, monthlySip, annualReturn: rate, years },
        outputs: result,
        chart_data: [
          { name: 'Lumpsum', value: result.lumpsumFinal },
          { name: 'SIP', value: result.sipFinal },
        ],
      }),
    })
    const d = await res.json()
    setSaving(false)
    if (d.success) router.push(`/dashboard/proposals/${d.data.id}`)
  }

  const chartData = [
    { name: 'Lumpsum', value: result.lumpsumFinal, color: '#3b82f6' },
    { name: 'SIP', value: result.sipFinal, color: '#10b981' },
  ]

  return (
    <CalcShell
      title="Lumpsum vs SIP Comparison"
      description="Which strategy builds more wealth for your financial goal?"
      icon="⚖️"
      color="text-blue-600"
      bgColor="bg-blue-50"
      onSaveProposal={handleSave}
      isSaving={saving}
      inputs={
        <>
          <SliderInput label="Lumpsum amount" value={lumpsum} min={50000} max={5000000} step={50000} format="currency" onChange={setLumpsum} />
          <SliderInput label="Monthly SIP" value={monthlySip} min={1000} max={200000} step={1000} format="currency" onChange={setMonthlySip} />
          <SliderInput label="Expected return" value={rate} min={6} max={25} step={0.5} format="percent" onChange={setRate} />
          <SliderInput label="Time period" value={years} min={1} max={30} format="years" onChange={setYears} />
        </>
      }
      results={
        <div className="space-y-3">
          <div className={`rounded-xl p-4 text-center ${result.sipBetter ? 'bg-emerald-600' : 'bg-blue-600'}`}>
            <p className="text-xs text-white/70 font-medium mb-1">Winner</p>
            <p className="text-2xl font-bold text-white">{result.sipBetter ? '📈 SIP' : '💰 Lumpsum'}</p>
            <p className="text-xs text-white/70 mt-1">Higher by {formatLakhsCrores(result.difference)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Lumpsum result" value={result.lumpsumFinal} color="blue" />
            <ResultCard label="SIP result" value={result.sipFinal} highlight color={result.sipBetter ? 'green' : 'blue'} />
          </div>
          <SimpleBarChart data={chartData} bars={[]} xKey="name" height={150} />
        </div>
      }
    />
  )
}
```

#### Step 4: Update routes

In `app/dashboard/calculators/page.tsx`:

```typescript
const CALC_ROUTES = {
  // ... existing routes ...
  lumpsum_vs_sip: '/dashboard/calculators/lumpsum-vs-sip',
}
```

#### Step 5: Update types

In `lib/types.ts`:

```typescript
export type CalculatorType = 
  | 'sip'
  | 'lumpsum'
  | 'goal_sip'
  | // ... existing ...
  | 'lumpsum_vs_sip'  // ADD THIS
```

#### Step 6: Test

```bash
npm run dev
# Go to http://localhost:3000/dashboard/calculators
# Look for "Lumpsum vs SIP Comparison" in the list
# Click it
# Adjust sliders
# Click "Save as proposal"
```

### Modifying Existing Formulas

**Goal: Change HLV to use inflation-adjusted income**

In `lib/calculators/formulas.ts`, find `calcHlv`:

```typescript
export function calcHlv(input: HlvInput): HlvOutput {
  // ... existing code ...
  
  for (let yr = 1; yr <= yearsRemaining; yr++) {
    const age = currentAge + yr
    // ORIGINAL:
    // const income = annualIncome * Math.pow(1 + incomeGrowthRate / 100, yr)
    
    // MODIFIED (include inflation too):
    const incomeWithGrowth = annualIncome * Math.pow(1 + incomeGrowthRate / 100, yr)
    const incomeAfterInflation = incomeWithGrowth / Math.pow(1 + 0.06, yr) // 6% inflation
    const income = incomeAfterInflation
    
    // ... rest of loop ...
  }
}
```

Then test in `/dashboard/calculators/hlv` and verify numbers changed.

---

## Branding & White-Label

### Complete White-Labeling

WealthKit supports full white-labeling for each distributor.

#### Company Settings

Each distributor can customize at `/dashboard/branding`:

| Setting | Where It Appears | Example Value |
|---------|------------------|---------------|
| `advisor_name` | Email signature, PDF | Rajesh Agarwal |
| `advisor_designation` | PDF header | AMFI Registered MFD |
| `company_name` | Logo area, emails | Agarwal Wealth Advisors |
| `company_phone` | Client contact card | +91 98765 43210 |
| `company_email` | Proposal emails | rajesh@agarwal.com |
| `arn_number` | PDF header | ARN-123456 |
| `brand_color` | PDF header, links, buttons | #2563eb (blue) |
| `disclaimer` | Bottom of PDFs | Legal text |

#### Database Schema

```typescript
interface Tenant {
  id: string
  name: string
  
  // Branding
  advisor_name: string
  advisor_designation: string
  company_name: string
  company_phone: string
  company_email: string
  company_address: string
  brand_color: string
  
  // Compliance
  arn_number: string
  euin_number: string
  gstin: string
  
  // Legal
  disclaimer: string
  
  // Storage
  logo_url: string  // (for future: upload logo to Supabase Storage)
}
```

#### Applying Branding to PDFs

In `components/pdf/proposal-document.tsx`:

```typescript
<View style={[styles.header, { backgroundColor: tenant?.brand_color }]}>
  {tenant?.logo_url ? (
    <Image src={tenant.logo_url} style={styles.headerLogo} />
  ) : (
    <Text style={styles.headerBrand}>{tenant?.company_name}</Text>
  )}
  <Text style={styles.headerDesig}>{tenant?.advisor_designation}</Text>
</View>
```

**To customize further:**

1. Edit `styles.header` colors
2. Add tenant.brand_secondary_color for accents
3. Change header background to gradient:
   ```typescript
   // In PDF, gradients aren't directly supported, so use a solid color or:
   backgroundColor: tenant?.brand_color,
   borderBottom: `2px solid ${tenant?.brand_color}`,
   ```

#### Custom Domain Support (Future)

To support `distributor.wealthkit.in` subdomains:

1. **Add wildcard domain to Vercel:**
   - Vercel Project → Settings → Domains
   - Add `*.wealthkit.in`
   - Add CNAME: `cname.vercel-dns.com`

2. **In middleware.ts:**
   ```typescript
   export async function middleware(request: NextRequest) {
     const { hostname } = request.nextUrl
     
     // Extract subdomain
     const subdomain = hostname.split('.')[0]
     
     // Look up tenant by subdomain
     const tenant = await supabase
       .from('tenants')
       .select('id')
       .eq('subdomain', subdomain)
       .single()
     
     // Pass tenantId to request
     return NextResponse.next({
       request: {
         headers: request.headers.set('x-tenant-id', tenant?.id),
       },
     })
   }
   ```

3. **Use custom domain in emails:**
   ```typescript
   const baseUrl = req.headers.get('x-tenant-id')
     ? `https://${tenant.subdomain}.wealthkit.in`
     : `https://wealthkit.in?tenant=${tenant.id}`
   ```

---

## Deployment to Vercel

### Prerequisites

- Code pushed to GitHub (or GitLab)
- All environment variables ready
- Supabase project created with schema
- Razorpay test mode working locally

### Step-by-Step Deployment

#### Option A: Deploy via Vercel Dashboard (Easiest)

1. **Connect GitHub:**
   - Go to https://vercel.com/new
   - Select "Next.js"
   - Click "Import" → Connect GitHub account
   - Select your `wealthkit` repository
   - Click "Import"

2. **Configure environment variables:**
   - Vercel shows "Environment Variables" form
   - Add each variable from `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY
     SUPABASE_SERVICE_ROLE_KEY
     NEXTAUTH_SECRET
     GOOGLE_CLIENT_ID
     GOOGLE_CLIENT_SECRET
     RESEND_API_KEY
     RESEND_FROM_EMAIL
     NEXT_PUBLIC_RAZORPAY_KEY_ID
     RAZORPAY_KEY_SECRET
     NEXT_PUBLIC_APP_URL=https://yourdomain.vercel.app
     CRON_SECRET
     ```
   - Click "Deploy"

3. **Wait for build:**
   - Vercel builds and deploys automatically
   - You'll see real-time build logs
   - Takes 2-3 minutes

4. **Access your app:**
   - Once deployed, visit the URL (e.g., `wealthkit-xxxx.vercel.app`)

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login (opens browser)
vercel login

# Deploy from project directory
cd wealthkit
vercel

# Follow prompts:
# - Link to existing project? → No (first time)
# - Set project name → wealthkit
# - Set root directory → ./
# - Override build settings? → No

# Then set environment variables:
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... repeat for each variable

# Deploy to production
vercel --prod
```

### Post-Deployment Steps

#### 1. Update OAuth Redirect URIs

Google Cloud Console needs to know your production URL:

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Find your OAuth 2.0 Client ID
3. Add production redirect URI:
   ```
   https://yourdomain.vercel.app/api/auth/callback/google
   ```

#### 2. Update NextAuth URLs

In Vercel Environment Variables:
```env
NEXTAUTH_URL=https://yourdomain.vercel.app
```

(Or let NextAuth auto-detect from request headers)

#### 3. Test Authentication

1. Go to `https://yourdomain.vercel.app/auth/login`
2. Try signing in with Google
3. Try signing in with email (magic link)
4. You should land on `/dashboard`

#### 4. Test PDF Generation

1. Create a new proposal (any calculator)
2. On proposal detail page, click "Generate PDF"
3. PDF should download

#### 5. Set Up Custom Domain (Optional)

1. **Register domain:** `yourdomain.com` (GoDaddy, Route53, Namecheap, etc)

2. **In Vercel:**
   - Project Settings → Domains
   - Add domain → `yourdomain.com`
   - Vercel gives you CNAME records to add

3. **In DNS provider:**
   - Add CNAME: `yourdomain.com` → `cname.vercel-dns.com`
   - Wait 24h for propagation (usually faster)

4. **Update env vars:**
   - `NEXTAUTH_URL=https://yourdomain.com`
   - `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
   - Redeploy: `vercel --prod`

### Monitoring Deployment

**View logs:**
```bash
vercel logs  # Real-time logs
```

**Rollback to previous:**
```bash
vercel rollback  # Reverts to last deployment
```

**View environment:**
```bash
vercel env list  # Shows all env variables
```

---

## Post-Deployment Configuration

### Razorpay Webhook

Now that you're on a real domain:

1. **In Razorpay Dashboard:**
   - Settings → Webhooks
   - Add webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
   - Select events: activation, charged, cancelled, halted
   - Copy webhook secret

2. **In Vercel:**
   - Add env var: `RAZORPAY_WEBHOOK_SECRET=<secret>`
   - Redeploy: `vercel --prod`

3. **Test webhook:**
   - Go to Razorpay dashboard → test subscription
   - Click "Pay Now"
   - Pay with test card `4111111111111111`
   - Check webhook delivery logs in Razorpay

### Resend Domain (Optional)

For production emails from your domain:

1. **In Resend:**
   - Dashboard → Domains → Add domain
   - Pick your domain (e.g., `mail.yourdomain.com`)
   - Add DKIM/SPF records to DNS
   - Wait 24h

2. **In Vercel:**
   - Update: `RESEND_FROM_EMAIL=noreply@yourdomain.com`
   - Redeploy

### Create Admin User

**To manually create your first admin user** (if sign-up fails):

```sql
-- In Supabase SQL Editor
INSERT INTO auth_users (id, email, name, role, tenant_id, created_at)
VALUES (
  gen_random_uuid(),
  'you@example.com',
  'Your Name',
  'admin',
  (SELECT id FROM tenants LIMIT 1),
  NOW()
);
```

Then sign in via magic link.

### Set Up Cron Jobs

WealthKit has two cron jobs (in `vercel.json`):

1. **Reset PDF counts** (1st of month)
2. **Send renewal reminders** (daily at 9 AM)

**To enable:**

1. In Vercel, set env var: `CRON_SECRET=your-random-secret`
2. Redeploy
3. Vercel automatically runs cron jobs on schedule

**To test locally** (cron won't trigger locally):

```bash
# Manually call the endpoint
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/reset-pdf-counts
```

---

## Monitoring & Maintenance

### Key Metrics to Monitor

#### Usage

- **Proposals created/month**: Shows adoption
- **Calculators used**: Which ones are popular?
- **PDFs generated**: Track quota usage
- **Clients added**: Growth metric

#### System

- **Response times**: /api routes, PDF generation
- **Error rates**: Failed sign-ups, proposal saves
- **Email delivery**: Successful sends vs bounces
- **Database**: Query performance, storage size

### Set Up Monitoring

#### Vercel Analytics (Built-in)

1. Vercel Project → Analytics
2. View real-time requests, errors, CPU usage
3. Set up alerts

#### Error Tracking (Optional - Sentry)

```bash
npm install @sentry/nextjs
```

In `next.config.ts`:

```typescript
import { withSentryConfig } from "@sentry/nextjs"

const config = withSentryConfig(nextConfig, {
  org: "your-org",
  project: "wealthkit",
  authToken: process.env.SENTRY_AUTH_TOKEN,
})
```

#### Email Deliverability (Built-in)

- Resend Dashboard → Emails
- See delivery status, bounces, complaints

### Database Maintenance

#### Backup Strategy

Supabase auto-backs up every day. To manually export:

```bash
# Via Supabase CLI
npm install -g supabase
supabase login  # Opens browser
supabase db dump --db-url "postgresql://..." > backup.sql
```

#### Cleanup Old Data

Remove old proposals to save space:

```sql
-- Delete proposals older than 1 year
DELETE FROM proposals 
WHERE created_at < NOW() - INTERVAL '1 year' 
AND status IN ('draft', 'cancelled');

-- Archive audit logs
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '6 months';
```

#### Monitor Storage

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Update Dependencies

Monthly, check for security updates:

```bash
npm outdated  # Shows outdated packages
npm audit  # Shows security vulnerabilities
npm update  # Updates within version constraints
npm audit fix  # Auto-fixes security issues
```

Then test and deploy:

```bash
npm run build
npm run dev
# ... manual testing ...
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push
# Vercel auto-deploys
```

---

## Troubleshooting Guide

### Login Issues

**Problem: "Invalid redirect_uri" error**

- **Cause**: Google OAuth redirect URI mismatch
- **Fix**:
  1. Go to Google Cloud Console
  2. Check OAuth 2.0 Client ID credentials
  3. Verify redirect URI matches exactly (http vs https, www vs no www)
  4. Save changes
  5. Clear browser cookies and retry

**Problem: Magic link email not received**

- **Cause**: Resend API key invalid or email address is test-only
- **Check**:
  1. In Vercel, is `RESEND_API_KEY` set?
  2. In Resend Dashboard → Emails, do you see a failed request?
  3. If using `onboarding@resend.dev`, check Resend inbox (not your email)
  4. For production, set up custom domain in Resend

**Problem: "Session not found" after sign-in**

- **Cause**: `NEXTAUTH_SECRET` not set or mismatched between local/prod
- **Fix**:
  1. Generate new secret: `openssl rand -base64 32`
  2. Update in `.env.local` and Vercel
  3. Clear browser cookies
  4. Restart server: `npm run dev`

### PDF Generation

**Problem: PDF generation times out**

- **Cause**: Large proposals, slow internet, or PDF library hanging
- **Fix**:
  1. Reduce number of data points in charts
  2. In `vercel.json`, increase function timeout:
     ```json
     "app/api/proposals/[id]/generate-pdf/**": {
       "maxDuration": 120,
       "memory": 2048
     }
     ```
  3. Redeploy

**Problem: PDF upload to Supabase fails**

- **Cause**: Storage bucket not public, or storage policy missing
- **Fix**:
  1. Supabase → Storage → `wealthkit-pdfs` bucket
  2. Check "Public bucket" is enabled
  3. Run `supabase/migrations/002_storage_policies.sql` again

### Payment Issues

**Problem: Razorpay subscription not created**

- **Cause**: Plan ID not configured or API keys invalid
- **Fix**:
  1. In database, check `plans` table has `razorpay_plan_id_monthly` filled
  2. Try creating a plan in Razorpay dashboard and copying ID
  3. Verify API keys in Vercel env vars match Razorpay dashboard

**Problem: Webhook not triggering**

- **Cause**: Webhook URL wrong, or HMAC verification failing
- **Fix**:
  1. Razorpay Dashboard → Webhooks → verify URL is correct
  2. In `app/api/webhooks/razorpay/route.ts`, add logging:
     ```typescript
     console.log('Webhook received:', body)
     ```
  3. Create test subscription and watch server logs

**Problem: "PDF limit exceeded" error**

- **Cause**: User has used all monthly PDFs
- **Fix**: User needs to upgrade plan, or edit their subscription:
  ```sql
  UPDATE subscriptions 
  SET pdf_count_this_month = 0
  WHERE id = 'xxx';
  ```

### Database Issues

**Problem: Row-level security (RLS) preventing data access**

- **Cause**: RLS policy blocking queries
- **Fix**:
  1. Supabase → Policies → check policies on table
  2. Temporarily disable RLS to test:
     ```sql
     ALTER TABLE proposals DISABLE ROW LEVEL SECURITY;
     ```
  3. Re-enable and debug policy conditions

**Problem: "Relation does not exist" error**

- **Cause**: Table not created or migration didn't run
- **Fix**:
  1. Verify migrations ran: Supabase SQL Editor → run again
  2. Check table exists: `SELECT * FROM proposals LIMIT 1;`

### Email Issues

**Problem: Transactional emails going to spam**

- **Cause**: Domain reputation low, or missing SPF/DKIM
- **Fix**:
  1. Set up Resend domain (see Resend Domain section)
  2. Add SPF record: `v=spf1 sendmail.resend.com ~all`
  3. Add DKIM records from Resend dashboard
  4. Wait 24h

**Problem: "Invalid from email" error**

- **Cause**: `RESEND_FROM_EMAIL` doesn't match domain
- **Fix**:
  - If using `onboarding@resend.dev`, set: `RESEND_FROM_EMAIL=onboarding@resend.dev`
  - If using custom domain, must be verified in Resend dashboard

### Performance Issues

**Problem: Dashboard is slow to load**

- **Cause**: Too much data being fetched, or N+1 query problem
- **Fix**:
  1. Check Vercel Analytics → slow API endpoints
  2. In slow API route, optimize queries:
     ```typescript
     // Before (N+1): loop over clients, fetch each client's proposals
     const clients = await supabase.from('clients').select()
     for (const client of clients) {
       const proposals = await supabase.from('proposals').select().eq('client_id', client.id)
     }
     
     // After (efficient): fetch all at once
     const { data: clients } = await supabase.from('clients').select('*, proposals(*)')
     ```
  3. Add indexes:
     ```sql
     CREATE INDEX idx_proposals_tenant_id ON proposals(tenant_id);
     CREATE INDEX idx_clients_tenant_id ON clients(tenant_id);
     ```

---

## API Documentation

### Authentication

All API endpoints require a valid session (automatically set by NextAuth).

#### Get Current User Session

```typescript
import { auth } from '@/auth'

const session = await auth()
// {
//   user: {
//     id: '...',
//     name: 'John Doe',
//     email: 'john@example.com',
//     tenantId: '...',
//     role: 'admin'
//   }
// }
```

### Clients API

#### GET /api/clients

Fetch all clients for current tenant.

**Query parameters:**
- `search` (string): Search name/email/phone
- `stage` (string): Filter by stage (lead, prospect, client, inactive)
- `limit` (number): Max results (default 50)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Rajesh Sharma",
      "email": "rajesh@example.com",
      "phone": "+91 98765 43210",
      "city": "Mumbai",
      "stage": "prospect",
      "annual_income": 1200000,
      "risk_profile": "moderate",
      "created_at": "2025-05-10T10:30:00Z"
    }
  ],
  "success": true
}
```

#### POST /api/clients

Create a new client.

**Body:**
```json
{
  "name": "Rajesh Sharma",
  "email": "rajesh@example.com",
  "phone": "+91 98765 43210",
  "city": "Mumbai",
  "stage": "prospect",
  "notes": "High-value client, interested in tax planning"
}
```

**Response:**
```json
{
  "data": { "id": "uuid", ... },
  "success": true
}
```

#### PATCH /api/clients/[id]

Update a client.

**Body:** (same fields as POST)

#### DELETE /api/clients/[id]

Delete a client (soft delete, sets stage to 'inactive').

### Proposals API

#### GET /api/proposals

Fetch proposals for current tenant.

**Query:**
- `client_id` (uuid): Filter by client
- `status` (string): Filter by status

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "SIP Plan — ₹20L in 10 years",
      "calculator_type": "sip",
      "status": "sent",
      "client_id": "uuid",
      "inputs": { "monthlyAmount": 20000, "annualReturn": 12, "years": 10 },
      "outputs": { "totalValue": 2000000, ... },
      "share_views": 3,
      "created_at": "2025-05-10T..."
    }
  ]
}
```

#### POST /api/proposals

Create a new proposal from calculator.

**Body:**
```json
{
  "title": "SIP Plan — ₹20L in 10 years",
  "calculator_type": "sip",
  "client_id": "uuid-optional",
  "inputs": { "monthlyAmount": 20000, ... },
  "outputs": { "totalValue": 2000000, ... },
  "chart_data": [ { "month": 1, "value": 50000 }, ... ]
}
```

#### PATCH /api/proposals/[id]

Update proposal (status, title, etc).

**Body:**
```json
{
  "status": "sent",
  "title": "Updated title"
}
```

#### POST /api/proposals/[id]/generate-pdf

Generate and upload PDF.

**Response:**
```json
{
  "pdf_url": "https://xxx.supabase.co/storage/...",
  "success": true
}
```

#### POST /api/proposals/[id]/send-email

Send proposal via email.

**Body:**
```json
{
  "clientEmail": "client@example.com",
  "clientName": "Rajesh"
}
```

### Billing API

#### GET /api/billing/subscription

Get current subscription details.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "status": "active",
    "plan": { "name": "professional", "max_pdf_monthly": 100, ... },
    "current_period_end": "2025-06-10",
    "pdf_count_this_month": 42
  }
}
```

#### POST /api/billing/checkout

Initiate Razorpay checkout.

**Body:**
```json
{
  "planName": "professional",
  "billingCycle": "monthly"
}
```

**Response:**
```json
{
  "checkout_url": "https://rzp.io/...",
  "key_id": "rzp_test_...",
  "success": true
}
```

### Webhooks

#### POST /api/webhooks/razorpay

Razorpay webhook (auto-called).

**Events handled:**
- `subscription.activated` — Set status to 'active'
- `subscription.charged` — Create invoice, reset PDF count
- `subscription.cancelled` — Set status to 'cancelled'
- `subscription.halted` — Set status to 'halted', send email

### Cron Jobs

#### GET /api/cron/reset-pdf-counts

Reset PDF counters to 0 (runs 1st of month).

**Requires:** Authorization header with CRON_SECRET

#### GET /api/cron/send-renewal-reminders

Send renewal reminder emails (runs daily at 9 AM UTC).

---

## Advanced Customization

### Extending Calculator Types

Add a new type to `lib/types.ts`:

```typescript
export type CalculatorType = 
  | 'sip'
  | 'lumpsum'
  | 'retirement'
  | 'my_custom_calculator'  // NEW
```

Then add function signature, registry entry, and page (follow earlier steps).

### Custom Proposal Templates

Change PDF template by editing `components/pdf/proposal-document.tsx`:

```typescript
// Change header color scheme
const THEME_COLOR = tenant?.brand_color || '#2563eb'

// Add new sections
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Custom Section</Text>
  {/* render custom content */}
</View>
```

### Multi-Language Support

Use React's i18n library (e.g., `next-i18next`):

```bash
npm install next-i18next i18next
```

In `next.config.ts`:

```typescript
import { i18n } from './next-i18next.config'

const config: NextConfig = {
  i18n,
}
```

Then wrap components:

```typescript
import { useTranslation } from 'next-i18next'

export function CalculatorPage() {
  const { t } = useTranslation('calculators')
  
  return <h1>{t('sip_title')}</h1>
}
```

### API Rate Limiting

Add rate limiting to prevent abuse:

```bash
npm install @upstash/ratelimit @upstash/redis
```

In API routes:

```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
})

export async function POST(req: Request) {
  const { success } = await ratelimit.limit(req.headers.get("x-forwarded-for") || "")
  
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  
  // ... handler ...
}
```

### Custom Analytics Dashboard

Create a new analytics page with real-time metrics:

```typescript
// app/dashboard/analytics-advanced/page.tsx
import { createAdminClient } from '@/lib/supabase/server'

export default async function AdvancedAnalyticsPage() {
  const supabase = await createAdminClient()
  
  // Query custom metrics
  const { data: metrics } = await supabase
    .rpc('calculate_monthly_metrics', { tenant_id: session.user.tenantId })
  
  return (
    <div>
      {/* Render custom charts */}
    </div>
  )
}
```

### Integrations (Zapier, IFTTT, etc)

Create a public API endpoint for third-party integrations:

```typescript
// app/api/integrations/webhook/route.ts
export async function POST(req: Request) {
  const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '')
  
  // Verify API key
  const tenant = await supabase
    .from('tenants')
    .select()
    .eq('api_key', apiKey)
    .single()
  
  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await req.json()
  
  // Create proposal from external trigger
  await supabase.from('proposals').insert({
    tenant_id: tenant.id,
    title: body.title,
    calculator_type: body.calculator_type,
    inputs: body.inputs,
    outputs: body.outputs,
  })
  
  return NextResponse.json({ success: true })
}
```

---

## Conclusion

This guide covers every major aspect of deploying and maintaining WealthKit. For production use:

1. **Always test locally first**
2. **Stage in a test Vercel environment** (not production)
3. **Monitor metrics closely after launch**
4. **Plan regular security updates**
5. **Have a backup/recovery strategy**
6. **Document your customizations**

For questions or issues not covered here, check the WealthKit repository issues or contact support.

**Happy distributing!** 🚀
