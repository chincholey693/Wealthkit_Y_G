# WealthKit — Final Deployment Guide
## Complete Step-by-Step to Production

**Status:** ✅ ALL MODULES COMPLETE & PRODUCTION READY

---

## 📋 Pre-Deployment Verification

### Code Status
```bash
# Verify no TypeScript errors
npx tsc --noEmit

# Expected output: (no output = success)
```

### Build Status
```bash
# Verify production build
npm run build

# Expected output: ✓ Build successful
```

### File Structure
```bash
# Verify all modules present
ls -la app/api/health/
ls -la app/dashboard/error.tsx
ls -la lib/monitoring.ts
ls -la lib/webhook-retry.ts
ls -la app/api/batch/import-clients/
ls -la app/api/export/clients/
```

All should exist. ✅

---

## 🚀 Deployment Steps (5 minutes)

### Step 1: Prepare Environment Variables

Create `.env.production` with all required variables:

```env
# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# NEXTAUTH
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<your-32-char-secret>

# GOOGLE OAUTH
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# RESEND EMAIL
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# RAZORPAY (LIVE MODE)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx

# APP CONFIG
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=WealthKit

# CRON JOBS
CRON_SECRET=your-random-secret
```

### Step 2: Apply Database Migrations

In **Supabase SQL Editor**, run these in order:

1. **001_initial_schema.sql** (already done)
2. **002_storage_policies.sql** (already done)
3. **003_webhooks_table.sql** (NEW - for webhook retry logic)

```sql
-- Paste entire content of 003_webhooks_table.sql
-- Click "Run"
```

### Step 3: Update Google OAuth Redirect URI

1. Go to **Google Cloud Console**
2. Find your OAuth 2.0 Client ID
3. Add production redirect URI:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```
4. Save

### Step 4: Update Razorpay Webhook

1. Go to **Razorpay Dashboard → Settings → Webhooks**
2. Find existing webhook or create new
3. Set URL to:
   ```
   https://yourdomain.com/api/webhooks/razorpay
   ```
4. Select events:
   - subscription.activated
   - subscription.charged
   - subscription.cancelled
   - subscription.halted

### Step 5: Deploy to Vercel

**Option A: Using Vercel Dashboard**

1. Go to https://vercel.com/dashboard
2. Select your WealthKit project
3. Go to Settings → Environment Variables
4. Add all variables from Step 1
5. Go to Deployments → Redeploy

**Option B: Using Vercel CLI**

```bash
# Install CLI
npm i -g vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... repeat for all variables

# Deploy to production
vercel --prod
```

### Step 6: Verify Deployment

```bash
# Check health endpoint
curl https://yourdomain.com/api/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2026-05-11T10:30:00.000Z",
#   "uptime": 125.45,
#   "environment": "production",
#   "database": "connected",
#   "response_time_ms": 45,
#   "version": "1.0.0",
#   "checks": {
#     "database": "ok",
#     "environment": "ok",
#     "memory": "125MB"
#   }
# }
```

### Step 7: Test Critical Flows

1. **Sign up:**
   - Visit https://yourdomain.com/auth/login
   - Sign up with Google or email
   - Should receive welcome email

2. **Create proposal:**
   - Go to /dashboard/calculators/sip
   - Adjust sliders
   - Click "Save as proposal"
   - Should save to database

3. **Generate PDF:**
   - Go to /dashboard/proposals
   - Click on a proposal
   - Click "Generate PDF"
   - PDF should download

4. **Test billing:**
   - Go to /dashboard/billing
   - Click "Upgrade"
   - Should redirect to Razorpay
   - (Use test card: 4111111111111111)

---

## 📊 Monitoring Setup

### Vercel Analytics (Built-in)

1. Go to Vercel Dashboard → Project → Analytics
2. Monitor:
   - Web Vitals (LCP, FID, CLS)
   - Request count
   - Error rate
   - Response times

### Health Check Monitoring

```bash
# Test health endpoint every 5 minutes
*/5 * * * * curl https://yourdomain.com/api/health >> /var/log/wealthkit-health.log

# Or use external service like:
# - Pingdom (https://www.pingdom.com)
# - Uptime Robot (https://uptimerobot.com)
# - New Relic (https://newrelic.com)
```

### Performance Monitoring

Access performance metrics:

```typescript
// In any API route
import { getMetricsSummary } from '@/lib/monitoring'

const summary = getMetricsSummary()
console.log(summary)
// {
//   total: 150,
//   errors: 2,
//   slow: 15,
//   average_duration: 245,
//   slowest: { label: 'fetch-clients', duration: 1230 }
// }
```

---

## 🔄 Post-Deployment Checklist

### Immediately After Deployment

- [ ] Health check returns 200 OK
- [ ] Sign up works (Google OAuth)
- [ ] Email sign-in works (magic link)
- [ ] Calculators load and calculate
- [ ] Proposals save to database
- [ ] PDFs generate and upload
- [ ] Share links work publicly
- [ ] Branding displays correctly
- [ ] Analytics dashboard shows data
- [ ] Error boundaries catch errors

### First 24 Hours

- [ ] Monitor Vercel Analytics for errors
- [ ] Check email delivery (Resend dashboard)
- [ ] Verify Razorpay webhook trigger (pay with test card)
- [ ] Monitor database performance (Supabase dashboard)
- [ ] Check error logs for any issues
- [ ] Test all 19 calculators
- [ ] Verify multi-tenancy (create 2 accounts, confirm isolation)

### First Week

- [ ] Invite beta testers
- [ ] Collect feedback
- [ ] Monitor metrics daily
- [ ] Fix any issues that arise
- [ ] Optimize slow endpoints (if any)
- [ ] Update documentation with live URLs
- [ ] Setup automated backups (Supabase auto-backs up)

---

## 🛠️ Troubleshooting Deployment Issues

### Issue: "Invalid redirect_uri" on sign-in

**Fix:**
1. Google Cloud Console → OAuth 2.0 Client ID
2. Add: `https://yourdomain.com/api/auth/callback/google`
3. Wait 15 minutes for changes to propagate
4. Clear browser cookies
5. Try again

### Issue: Email not being sent

**Fix:**
1. Check Resend Dashboard → Emails
2. Verify API key in Vercel env vars
3. Verify domain is verified (if using custom domain)
4. Check sender email matches allowed senders
5. Test with test email first

### Issue: PDF generation timeout

**Fix:**
1. Increase timeout in vercel.json:
   ```json
   "functions": {
     "app/api/proposals/[id]/generate-pdf/**": {
       "maxDuration": 120,
       "memory": 2048
     }
   }
   ```
2. Redeploy: `vercel --prod`

### Issue: Database connection failed

**Fix:**
1. Verify `SUPABASE_SERVICE_ROLE_KEY` in env vars
2. Check Supabase project is active
3. Verify database isn't at capacity
4. Check RLS policies allow access

### Issue: Razorpay webhook not triggering

**Fix:**
1. Verify webhook URL in Razorpay dashboard
2. Check webhook secret is set
3. Test webhook manually in Razorpay dashboard
4. Check Vercel function logs for errors
5. Re-save webhook in Razorpay

---

## 🔐 Security Post-Deployment

### 1. SSL/TLS
- ✅ Vercel handles automatically
- Certificate auto-renews
- Force HTTPS: Vercel enforces

### 2. Authentication
- ✅ NextAuth.js configured
- ✅ Google OAuth secured
- ✅ Session cookies secure (HttpOnly)

### 3. Database
- ✅ Row-level security enabled
- ✅ API keys not exposed
- ✅ Backups enabled (Supabase auto-backup)

### 4. API Security
- ✅ CORS headers configured
- ✅ Rate limiting enabled (Vercel)
- ✅ Input validation (Zod schemas)
- ✅ Webhook signature verification (HMAC)

### 5. Secrets Management
- ✅ All secrets in Vercel (not in code)
- ✅ No env vars in git
- ✅ Rotate secrets quarterly

---

## 📈 Performance Baselines

These are expected performance metrics:

| Metric | Target | Acceptable |
|--------|--------|-----------|
| Page load time | < 2s | < 3s |
| API response | < 200ms | < 500ms |
| PDF generation | < 10s | < 15s |
| Database query | < 100ms | < 200ms |
| Error rate | < 0.5% | < 1% |

Monitor via Vercel Analytics.

---

## 🚀 Launch Checklist

- [ ] All code deployed to production
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Health check passing
- [ ] Sign up working
- [ ] Email sending working
- [ ] PDFs generating
- [ ] Razorpay configured
- [ ] Analytics working
- [ ] Monitoring enabled
- [ ] Backups enabled
- [ ] Error tracking enabled
- [ ] Documentation updated
- [ ] Support email configured
- [ ] Privacy policy published
- [ ] Terms of service published

---

## 📞 Support & Monitoring

### Daily Checks (5 minutes)
```bash
# Check health
curl https://yourdomain.com/api/health

# Check error count in Vercel
# Check email bounce rate in Resend
# Check webhook status in database
```

### Weekly Checks
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Check slow queries
SELECT mean_exec_time, calls, query 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;

-- Check for failed webhooks
SELECT COUNT(*) FROM webhooks WHERE status = 'failed';
```

### Monthly Checks
- Review Vercel analytics
- Review Resend delivery metrics
- Review Razorpay transactions
- Update dependencies (npm audit fix)
- Review error logs
- Performance optimization

---

## 🎉 You're Live!

Congratulations! WealthKit is now in production.

**Next steps:**
1. Market your product
2. Onboard beta customers
3. Gather feedback
4. Iterate and improve
5. Scale to ₹1Cr ARR

---

## Quick Reference

**Health check:** `curl https://yourdomain.com/api/health`

**Admin health:** Check Vercel Dashboard → Analytics

**Database health:** Supabase Dashboard → Monitoring

**Email health:** Resend Dashboard → Emails

**Payment health:** Razorpay Dashboard → Transactions

**Logs:** Vercel Dashboard → Deployments → Logs

---

**Your WealthKit SaaS is now live and ready to serve India's MFDs!** 🎉

