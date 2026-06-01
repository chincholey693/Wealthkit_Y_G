# WealthKit
## The Complete SaaS Platform for Mutual Fund Distributors

![Version](https://img.shields.io/badge/version-1.0-blue) ![License](https://img.shields.io/badge/license-proprietary-red) ![Status](https://img.shields.io/badge/status-production%20ready-green)

---

**WealthKit** is a **production-ready SaaS platform** for India's 1.2L+ registered Mutual Fund Distributors (MFDs), IFAs, Wealth Advisors, and Insurance Advisors.

### What It Does

- **40+ financial calculators** (SIP, retirement, tax, insurance, capital gains, etc)
- **Branded PDF proposals** — one-click generation
- **Client CRM** — leads pipeline, follow-up reminders
- **Subscription billing** — Razorpay integration
- **Email + WhatsApp sharing** — instant client outreach
- **Multi-tenant architecture** — complete data isolation
- **Zero DevOps required** — Vercel + Supabase, works on free tiers

---

## Getting Started

### Quick Start (5 minutes)

```bash
unzip wealthkit-complete.zip && cd wealthkit
npm install
cp .env.local.example .env.local
# Fill in Supabase, Google, Resend, Razorpay credentials
npm run dev
# Open http://localhost:3000
```

**See [QUICK_START.md](QUICK_START.md) for detailed setup instructions.**

### Deploy to Vercel (3 minutes)

```bash
npm i -g vercel
vercel login
vercel --prod
# Set environment variables
```

**See [DEPLOY.md](DEPLOY.md) for detailed deployment guide.**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 + React 18 + TypeScript |
| **UI** | Tailwind CSS + Recharts |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | NextAuth.js + Google OAuth |
| **Email** | Resend |
| **Payments** | Razorpay |
| **PDF** | @react-pdf/renderer |
| **Hosting** | Vercel |

---

## Features

### 40+ Calculators
- **SIP** — Monthly investments
- **Lumpsum** — One-time investments
- **Retirement Corpus** — Plan for retirement
- **HLV** — Insurance needs
- **Tax Planning** — Old/new regime
- **Child Education** — Goal planning
- **Capital Gains** — Tax calculations
- ...and 33 more

### PDF Proposals
- Auto-generated with calculations
- Branded with company colors
- Include charts and graphs
- Shareable via link, email, WhatsApp

### CRM
- Client profiles & pipeline
- Lead stages (lead → prospect → client)
- Follow-up reminders
- Kanban board

### Billing
- **Starter:** ₹499/mo (1 user, 25 PDFs)
- **Professional:** ₹1,299/mo (3 users, 100 PDFs, CRM)
- **Premium:** ₹2,999/mo (10 users, unlimited PDFs)
- **Enterprise:** Custom pricing

---

## Documentation

| Document | Purpose |
|----------|---------|
| [QUICK_START.md](QUICK_START.md) | 15-minute setup guide |
| [DEPLOY.md](DEPLOY.md) | Deployment walkthrough |
| [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) | 2000+ line reference manual |

---

## Project Structure

```
wealthkit/
├── app/
│   ├── api/                    # REST API endpoints
│   ├── auth/                   # Login pages
│   ├── dashboard/              # Protected area
│   │   ├── calculators/        # 20+ calculator pages
│   │   ├── clients/            # CRM
│   │   ├── proposals/          # Saved proposals
│   │   ├── meetings/           # Follow-ups
│   │   ├── analytics/          # Dashboard
│   │   └── billing/            # Subscription
│   └── p/[token]/              # Public proposal share
│
├── components/                 # Reusable UI components
├── lib/
│   ├── calculators/            # 40+ formula functions
│   ├── supabase/               # Database clients
│   ├── types.ts                # TypeScript interfaces
│   └── utils.ts                # Helper functions
│
├── supabase/
│   └── migrations/             # Database schema
│
├── auth.ts                     # NextAuth config
├── middleware.ts               # Route protection
└── README.md                   # This file
```

---

## Cost

| Service | At 0 Customers | At 100 Subs |
|---------|----------------|------------|
| Vercel | Free | ₹2,000 |
| Supabase | Free | ₹5,000 |
| Resend | Free | ₹2,000 |
| Razorpay | 0% | 2% per transaction |
| Domain | ₹800/year | ₹800/year |
| **Total** | **₹~67/mo** | **~₹9,800/mo** |

---

## Key Endpoints

- `GET /api/clients` — List clients
- `POST /api/proposals` — Save proposal
- `POST /api/proposals/[id]/generate-pdf` — Generate PDF
- `GET /api/billing/subscription` — Check subscription

[Full API docs in IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md#api-documentation)

---

## Customization

### Add Calculator
1. Add formula in `lib/calculators/formulas.ts`
2. Create page in `app/dashboard/calculators/[name]/page.tsx`
3. Test locally

### White-Label
- Change brand color, logo, advisor name
- Generate branded PDFs automatically
- Custom domain support (future)

### Extend Database
- Add columns to Supabase tables
- Update TypeScript types
- Update forms in UI

---

## Production Checklist

- [ ] All env variables in Vercel
- [ ] Custom domain configured
- [ ] Razorpay webhook URL set
- [ ] Google OAuth redirect URI updated
- [ ] Database backups enabled
- [ ] Monitoring set up

---

## Troubleshooting

**Login fails?** Check `.env.local` values  
**PDF not generating?** Verify Supabase Storage bucket is public  
**Razorpay error?** Check test mode in dashboard  

See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md#troubleshooting-guide) for more.

---

## Support

- **Setup help:** [QUICK_START.md](QUICK_START.md)
- **Deployment:** [DEPLOY.md](DEPLOY.md)
- **Deep dive:** [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)

---

## License

Proprietary. See LICENSE file for details.

---

**Ready to launch?** Start with [QUICK_START.md](QUICK_START.md) 🚀
