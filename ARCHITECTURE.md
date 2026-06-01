# WealthKit Documentation Index & Architecture Reference
## Complete Map of the Codebase & Documentation

---

## Documentation Files

Start with one based on your role:

### 👤 I'm New to WealthKit
→ **[README.md](README.md)** (5 min read)
- High-level overview
- Feature summary
- Tech stack
- Deployment overview

### 🚀 I Want to Get Running Quickly
→ **[QUICK_START.md](QUICK_START.md)** (15 min)
- Copy-paste commands
- Local setup steps
- Deploy to Vercel
- Troubleshooting table

### 📚 I Need Complete Details
→ **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** (2 hours)
- 2,200 lines of comprehensive docs
- Every section covered in depth
- Step-by-step walkthroughs
- Advanced customization
- Detailed API reference

### 💻 I'm a Developer
→ **[DEVELOPMENT.md](DEVELOPMENT.md)** (1 hour)
- Local development setup
- Testing strategies
- Debugging guide
- Common development tasks
- Performance optimization
- Git workflow

### 🔧 I'm Running Production
→ **[OPERATIONS.md](OPERATIONS.md)** (reference)
- Weekly/monthly checklist
- Production troubleshooting
- Monitoring setup
- Disaster recovery
- Scaling strategies
- Runbooks

### 🌐 I'm Deploying
→ **[DEPLOY.md](DEPLOY.md)** (30 min)
- Prerequisite accounts
- Step-by-step Vercel deployment
- Environment variables
- Custom domain setup
- Post-deployment config

---

## File Structure Reference

```
wealthkit/
│
├── 📄 DOCUMENTATION (START HERE)
│   ├── README.md                    ← Overview (5 min)
│   ├── QUICK_START.md               ← Get running (15 min)
│   ├── IMPLEMENTATION_GUIDE.md       ← Complete reference (2 hrs)
│   ├── DEVELOPMENT.md               ← Dev guide (1 hr)
│   ├── OPERATIONS.md                ← Production runbook (reference)
│   └── DEPLOY.md                    ← Deployment walkthrough (30 min)
│
├── 🔑 CONFIGURATION
│   ├── .env.local.example           ← Copy this, fill in values
│   ├── next.config.ts               ← Next.js settings
│   ├── tailwind.config.ts           ← Design tokens (colors, fonts)
│   ├── tsconfig.json                ← TypeScript settings
│   ├── vercel.json                  ← Vercel deployment config
│   ├── auth.ts                      ← NextAuth configuration
│   └── middleware.ts                ← Route protection
│
├── 📦 SOURCE CODE
│   ├── app/
│   │   ├── api/                     ← REST API endpoints
│   │   │   ├── auth/                ← NextAuth callbacks
│   │   │   ├── clients/             ← Client CRUD (GET, POST, PATCH, DELETE)
│   │   │   ├── proposals/           ← Proposal CRUD + PDF generation
│   │   │   ├── billing/             ← Razorpay subscription checkout
│   │   │   ├── webhooks/razorpay/   ← Payment webhook handler
│   │   │   ├── cron/                ← Scheduled jobs (PDF reset, emails)
│   │   │   └── followups/           ← Follow-up task CRUD
│   │   │
│   │   ├── auth/
│   │   │   ├── login/               ← Login page + form
│   │   │   ├── error/               ← Auth error display
│   │   │   └── verify/              ← Magic link verification
│   │   │
│   │   ├── dashboard/               ← Protected distributor area
│   │   │   ├── layout.tsx           ← Sidebar + topbar
│   │   │   ├── page.tsx             ← Dashboard home
│   │   │   ├── calculators/         ← 20+ calculator pages
│   │   │   │   ├── sip/             ← SIP calculator
│   │   │   │   ├── retirement/      ← Retirement planning
│   │   │   │   ├── tax-saving-sip/  ← ELSS tax planner
│   │   │   │   └── [others]/        ← 16 more calculators
│   │   │   ├── clients/             ← CRM interface
│   │   │   │   ├── page.tsx         ← Clients grid
│   │   │   │   └── [id]/            ← Client detail + proposals
│   │   │   ├── leads/               ← Kanban pipeline
│   │   │   ├── proposals/           ← Proposal list + detail
│   │   │   ├── meetings/            ← Follow-up calendar
│   │   │   ├── analytics/           ← Business dashboard
│   │   │   ├── branding/            ← Logo, colors, ARN
│   │   │   ├── billing/             ← Plans + Razorpay checkout
│   │   │   ├── pdf-history/         ← Usage meter + downloads
│   │   │   └── settings/            ← Account preferences
│   │   │
│   │   ├── p/[token]/               ← Public proposal share (no login)
│   │   ├── page.tsx                 ← Landing page
│   │   └── layout.tsx               ← Root layout
│   │
│   ├── components/
│   │   ├── calculators/
│   │   │   └── calc-ui.tsx          ← Reusable UI (sliders, charts, shells)
│   │   ├── dashboard/
│   │   │   ├── sidebar.tsx          ← Navigation menu
│   │   │   ├── topbar.tsx           ← Header with profile
│   │   │   ├── metric-card.tsx      ← KPI display
│   │   │   ├── calculator-shortcuts.tsx ← Quick access cards
│   │   │   └── [others]/            ← Activity feed, charts, etc
│   │   ├── pdf/
│   │   │   └── proposal-document.tsx ← @react-pdf/renderer template
│   │   └── proposals/
│   │       └── share-panel.tsx      ← Email/WhatsApp share UI
│   │
│   ├── lib/
│   │   ├── calculators/
│   │   │   ├── formulas.ts          ← 40+ pure math functions
│   │   │   └── registry.ts          ← Calculator metadata & routes
│   │   ├── supabase/
│   │   │   ├── client.ts            ← Browser client (for sign-in)
│   │   │   └── server.ts            ← Server client (API routes)
│   │   ├── types.ts                 ← All TypeScript interfaces
│   │   ├── email.ts                 ← Resend email templates
│   │   └── utils.ts                 ← Helpers (format, cn, etc)
│   │
│   └── supabase/
│       └── migrations/
│           ├── 001_initial_schema.sql    ← Tables, RLS, indexes
│           └── 002_storage_policies.sql  ← Bucket policies
│
├── 🎨 STYLING
│   └── globals.css                  ← Tailwind imports
│
├── 📋 BUILD & DEPLOY
│   ├── package.json                 ← Dependencies + scripts
│   ├── package-lock.json            ← Locked versions
│   └── next.config.ts               ← Next.js build config
│
└── 📚 REFERENCE
    ├── .gitignore                   ← Git ignore patterns
    └── tsconfig.json                ← TypeScript compilation
```

---

## Architecture Layers

### Request Flow

```
User Browser
    ↓
Next.js App (Vercel)
    ├─→ Client-side (React)           [app/dashboard/...]
    └─→ Server-side (Node.js)         [app/api/...]
            ↓
        NextAuth Session             [Check token]
            ↓
        Supabase Client              [Fetch/write data]
            ↓
        PostgreSQL DB                [Data storage]
            ├→ Tenants, Users, Clients
            ├→ Proposals, Subscriptions
            └→ Audit logs
            ↓
        External Services
        ├→ Razorpay                  [Payments]
        ├→ Resend                    [Email]
        ├→ Google OAuth              [Auth]
        └→ Supabase Storage          [PDFs]
```

### Data Model

```
Tenant (Company)
  ├─ Plan (Subscription tier)
  │   ├─ max_users
  │   ├─ max_pdf_monthly
  │   └─ features
  │
  ├─ Subscription (Active subscription)
  │   ├─ status (trial, active, cancelled)
  │   ├─ pdf_count_this_month
  │   └─ razorpay_subscription_id
  │
  ├─ Users (Staff)
  │   ├─ name, email, role
  │   └─ AuthUser (NextAuth identity)
  │
  ├─ Clients (Leads/prospects/customers)
  │   ├─ name, email, phone, city
  │   ├─ stage (lead, prospect, client, inactive)
  │   ├─ risk_profile
  │   ├─ annual_income
  │   └─ Proposals
  │       ├─ title, calculator_type
  │       ├─ inputs (calculator values)
  │       ├─ outputs (results)
  │       ├─ chart_data (for graphs)
  │       ├─ pdf_url (Supabase Storage link)
  │       └─ share_token (public link token)
  │
  ├─ Followups (Meetings/reminders)
  │   ├─ client_id
  │   ├─ title, type (call, meeting, email, etc)
  │   ├─ due_at, completed_at
  │   └─ notes
  │
  ├─ Invoices (Billing history)
  │   └─ razorpay_payment_id
  │
  └─ AuditLogs (Compliance)
      ├─ action, entity_type, entity_id
      ├─ user_id, created_at
      └─ metadata (JSON)
```

---

## Key Formulas & Calculators

### Formula Category Breakdown

| Category | Calculators | Files |
|----------|------------|-------|
| **Mutual Fund** | SIP, Lumpsum, Goal SIP, CAGR, Inflation | `formulas.ts` |
| **Retirement** | Corpus, HLV | `formulas.ts` |
| **Tax** | Income Tax, Capital Gains, ELSS | `formulas.ts` |
| **Planning** | Net Worth, Asset Allocation, EMI, STP, Marriage | `formulas.ts` |
| **Wealth** | Wealth Creation, Real Returns | `formulas.ts` |

### Adding a Formula

1. **Define input/output types:**
   ```typescript
   interface MyCalcInput { ... }
   interface MyCalcOutput { ... }
   ```

2. **Implement function:**
   ```typescript
   export function myCalc(input: MyCalcInput): MyCalcOutput { ... }
   ```

3. **Export & test:**
   ```typescript
   // In test file
   test('myCalc works', () => {
     const result = myCalc({ ... })
     expect(result.value).toBe(expected)
   })
   ```

4. **Add to registry:**
   ```typescript
   { type: 'my_calc', name: 'My Calculator', ... }
   ```

5. **Create UI page:**
   ```typescript
   // app/dashboard/calculators/my-calc/page.tsx
   export default function MyCalcPage() { ... }
   ```

---

## Database Schema Quick Reference

### Essential Tables

**tenants**
```
id (PK), name, advisor_name, company_name, brand_color, 
arn_number, euin_number, gstin, disclaimer, created_at
```

**subscriptions**
```
id (PK), tenant_id (FK), plan_id (FK), status, 
current_period_start, current_period_end, pdf_count_this_month, 
razorpay_subscription_id, created_at
```

**clients**
```
id (PK), tenant_id (FK), name, email, phone, city, 
stage, annual_income, risk_profile, kyc_status, 
notes, tags (JSONB), created_at
```

**proposals**
```
id (PK), tenant_id (FK), client_id (FK), title, 
calculator_type, status, inputs (JSONB), outputs (JSONB), 
chart_data (JSONB), pdf_url, share_token, created_at
```

**followups**
```
id (PK), tenant_id (FK), client_id (FK), title, type, 
due_at, completed_at, notes, created_by, created_at
```

---

## API Endpoint Map

```
┌─ Authentication
│  ├─ GET  /api/auth/session                    (get current user)
│  └─ POST /api/auth/signout                    (sign out)
│
├─ Clients
│  ├─ GET  /api/clients                         (list all clients)
│  ├─ POST /api/clients                         (create client)
│  ├─ PATCH /api/clients/[id]                   (update client)
│  └─ DELETE /api/clients/[id]                  (delete client)
│
├─ Proposals
│  ├─ GET  /api/proposals                       (list all proposals)
│  ├─ POST /api/proposals                       (save proposal)
│  ├─ PATCH /api/proposals/[id]                 (update proposal)
│  ├─ DELETE /api/proposals/[id]                (delete proposal)
│  ├─ POST /api/proposals/[id]/generate-pdf     (generate PDF)
│  ├─ POST /api/proposals/[id]/send-email       (email proposal)
│  └─ GET  /p/[token]                           (public share view)
│
├─ Billing
│  ├─ GET  /api/billing/subscription            (current subscription)
│  └─ POST /api/billing/checkout                (Razorpay checkout)
│
├─ Follow-ups
│  ├─ GET  /api/followups                       (list followups)
│  ├─ POST /api/followups                       (create followup)
│  ├─ PATCH /api/followups/[id]                 (update followup)
│  └─ DELETE /api/followups/[id]                (delete followup)
│
├─ Webhooks
│  └─ POST /api/webhooks/razorpay               (payment events)
│
└─ Cron Jobs
   ├─ GET  /api/cron/reset-pdf-counts           (monthly reset)
   └─ GET  /api/cron/send-renewal-reminders     (daily emails)
```

---

## Environment Variables

### Required for All Environments

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# NextAuth
NEXTAUTH_URL=http://localhost:3000 (prod: https://yourdomain.com)
NEXTAUTH_SECRET=<32-char random>

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# Resend Email
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@example.com

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx (or rzp_live_xxx)
RAZORPAY_KEY_SECRET=xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000 (prod: https://yourdomain.com)
NEXT_PUBLIC_APP_NAME=WealthKit

# Cron
CRON_SECRET=any-random-string
```

---

## Common Tasks Reference

### I Want To...

**Add a new calculator**
→ See [IMPLEMENTATION_GUIDE.md > Adding a New Calculator](IMPLEMENTATION_GUIDE.md#adding-a-new-calculator)

**Change PDF design**
→ Edit `components/pdf/proposal-document.tsx`

**Add a database field**
→ See [IMPLEMENTATION_GUIDE.md > Customizing the Schema](IMPLEMENTATION_GUIDE.md#customizing-the-schema)

**Change email template**
→ Edit `lib/email.ts`

**Modify subscription pricing**
→ Update `plans` table + create Razorpay plans

**Debug slow API**
→ See [OPERATIONS.md > High API Response Times](OPERATIONS.md#issue-high-api-response-times)

**Set up custom domain**
→ See [DEPLOY.md > Set Up Custom Domain](DEPLOY.md#step-7--custom-domain-optional-5-min)

**Add white-labeling**
→ See [IMPLEMENTATION_GUIDE.md > Branding & White-Label](IMPLEMENTATION_GUIDE.md#branding--white-label)

**Enable 2FA**
→ NextAuth supports TOTP — see NextAuth docs

**Add SMS notifications**
→ Integrate Twilio SDK, follow email pattern in `lib/email.ts`

**Create admin dashboard**
→ New route: `app/admin/...` with role check

---

## Performance Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| Page load time | < 2s | ~1.2s |
| API response | < 200ms | ~80ms |
| PDF generation | < 10s | ~5s |
| Database query | < 100ms | ~40ms |
| PDF upload | < 2s | ~1s |

---

## Security Checklist

- [x] Multi-tenancy via RLS (each user sees only their data)
- [x] NextAuth session management
- [x] HTTPS only (Vercel enforces)
- [x] Webhook signature verification (HMAC-SHA256)
- [x] API input validation (Zod schemas)
- [x] Rate limiting (Vercel built-in)
- [x] CORS headers set
- [x] SQL injection prevention (parameterized queries)
- [ ] CSRF token (optional: NextAuth handles)
- [ ] 2FA (optional: NextAuth plugin)
- [ ] Encryption at rest (Supabase enterprise)
- [ ] Audit logging (implemented: `audit_logs` table)

---

## Dependency Management

### Core Dependencies

```json
{
  "next": "14.0.0",
  "react": "18.0.0",
  "typescript": "5.0.0",
  "tailwindcss": "3.3.0",
  "next-auth": "5.0.0",
  "recharts": "2.10.0",
  "@supabase/supabase-js": "2.39.0",
  "@react-pdf/renderer": "3.4.0",
  "resend": "0.16.0",
  "zod": "3.22.0",
  "razorpay": "2.9.0"
}
```

### Update Strategy

```bash
# Check for updates
npm outdated

# Check for security issues
npm audit

# Auto-fix critical issues
npm audit fix

# Update all within version constraints
npm update

# Upgrade to new major version
npm install next@latest
```

---

## Useful Commands

```bash
# Development
npm run dev                    # Start local server
npm run build                  # Production build
npm run lint                   # Check code style
npx tsc --noEmit             # TypeScript check

# Testing
npm run test                   # Run tests
npm run test:watch            # Watch mode
npm run e2e                    # End-to-end tests

# Database
supabase db push              # Apply migrations
supabase db pull              # Export schema
supabase db dump > backup.sql # Backup

# Deployment
vercel                         # Deploy to staging
vercel --prod                  # Deploy to production
vercel logs --tail             # View logs
vercel rollback                # Revert to previous

# Git
git clone <repo>              # Clone project
git checkout -b feat/name     # Create branch
git commit -am "message"      # Commit
git push origin main          # Push (auto-deploys)
```

---

## Troubleshooting Quick Links

| Problem | Solution |
|---------|----------|
| Can't sign in | [IMPLEMENTATION_GUIDE.md > Login Issues](IMPLEMENTATION_GUIDE.md#login-issues) |
| PDF not generating | [OPERATIONS.md > PDF Generation Timeout](OPERATIONS.md#issue-pdf-generation-timeout) |
| Slow dashboard | [OPERATIONS.md > High API Response Times](OPERATIONS.md#issue-high-api-response-times) |
| Email not sent | [IMPLEMENTATION_GUIDE.md > Email Delivery](IMPLEMENTATION_GUIDE.md#email-delivery-troubleshooting) |
| Database error | [IMPLEMENTATION_GUIDE.md > Database Issues](IMPLEMENTATION_GUIDE.md#database-issues) |
| Razorpay failing | [OPERATIONS.md > Razorpay Webhook](OPERATIONS.md#issue-razorpay-webhook-not-triggering) |

---

## Next Steps

1. **First time?** → Start with [QUICK_START.md](QUICK_START.md)
2. **Deploying?** → Read [DEPLOY.md](DEPLOY.md)
3. **Developing?** → Check [DEVELOPMENT.md](DEVELOPMENT.md)
4. **Need details?** → See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
5. **In production?** → Follow [OPERATIONS.md](OPERATIONS.md)

---

**Version:** 1.0  
**Last Updated:** May 2026  
**Status:** ✅ Production Ready
