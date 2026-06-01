# WealthKit Operations Guide
## Running & Maintaining WealthKit in Production

---

## Weekly Checklist

### Monday Morning (5 min)

```bash
# Check system status
- Vercel dashboard: any errors/deployments?
- Supabase: storage usage, connection health
- Resend: email delivery status
- Razorpay: transaction volume, failed payments

# Quick health check
curl https://yourdomain.com/api/health
# Should return 200 OK
```

### Wednesday (Monitoring)

```bash
# Check metrics
- Vercel Analytics: request count, errors
- Database: query performance, table sizes
- Email: bounce rate, complaints
```

### Friday (Cleanup)

```bash
# Remove old test data
# Archive proposals older than 6 months (if needed)
# Update any pending security patches
```

---

## Monthly Maintenance

### 1st of Month

- **PDF Counter Reset:** Auto-runs via cron job
  - Check Vercel logs: `/api/cron/reset-pdf-counts`
  - Verify: `SELECT pdf_count_this_month FROM subscriptions;` (should be 0)

### 7th of Month

- **Review Billing:**
  - Razorpay Dashboard → Transactions
  - Expected MRR from subscription count
  - Check for failed renewals
  
- **Check Costs:**
  - Vercel invoice
  - Supabase usage
  - Resend email count
  - Razorpay fees

### 15th of Month

- **Database Maintenance:**
  ```sql
  -- Analyze query performance
  ANALYZE;
  
  -- Check bloat
  SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
  FROM pg_tables 
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
  
  -- Vacuum if needed
  VACUUM ANALYZE;
  ```

### 20th of Month

- **Security Review:**
  - Check for outdated dependencies: `npm outdated`
  - Review Vercel security alerts
  - Check GitHub security advisories
  - Update critical patches: `npm audit fix`

### 25th of Month

- **Backup Check:**
  - Verify Supabase automated backups completed
  - Test restore (on staging, not production)
  - Update runbook if needed

---

## Quarterly Review

### Q1, Q2, Q3, Q4

**Performance:**
- Analyze slowest API endpoints
- Review database indexes
- Optimize N+1 queries
- Profile PDF generation time

**Capacity:**
- Database size growth trend
- Storage usage trend
- Concurrent user capacity
- Plan for scale-up needs

**Features:**
- User feedback review
- Feature request prioritization
- Plan next quarter development

**Security:**
- Penetration test (or external firm)
- Access review (who has database credentials?)
- SSL certificate expiration
- Disaster recovery plan

---

## Common Production Issues & Fixes

### Issue: High API Response Times

**Diagnosis:**
```bash
# Check Vercel Analytics
# Identify slow endpoint (e.g., /api/proposals)

# Check database
SELECT 
  mean_exec_time,
  calls,
  query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Fix:**
1. Add index to frequently filtered column
   ```sql
   CREATE INDEX idx_proposals_status ON proposals(status);
   ```

2. Denormalize if needed (cache aggregated data)
   ```sql
   ALTER TABLE tenants ADD COLUMN cached_proposal_count INT;
   -- Update via trigger on proposal INSERT/DELETE
   ```

3. Paginate large result sets
   ```typescript
   // Bad: SELECT all 10k proposals
   const proposals = await supabase.from('proposals').select()
   
   // Good: Paginate
   const { data, count } = await supabase
     .from('proposals')
     .select('*', { count: 'exact' })
     .range(0, 49)  // First 50
   ```

### Issue: PDF Generation Timeout

**Diagnosis:**
```
Error: PDF generation took >60 seconds
```

**Fix:**
1. **Increase timeout in Vercel:**
   ```json
   // vercel.json
   "functions": {
     "app/api/proposals/[id]/generate-pdf/**": {
       "maxDuration": 120,
       "memory": 2048
     }
   }
   ```
   Redeploy: `vercel --prod`

2. **Optimize PDF template:**
   - Remove unnecessary charts
   - Simplify data rendering
   - Use smaller images

3. **Reduce data complexity:**
   - Limit chart data points
   - Simplify assumptions table

### Issue: Email Delivery Failures

**Diagnosis:**
```
SELECT COUNT(*) FROM audit_logs 
WHERE action = 'email_failed' 
AND created_at > NOW() - INTERVAL '24 hours';
```

**Check Resend Dashboard:**
- Failed deliveries tab
- Bounced addresses
- Complaint rate

**Fix:**
1. **If domain issue:**
   - Verify SPF/DKIM records
   - Check DNS propagation (24-48h)
   - Add IP to allowlist if needed

2. **If high bounce rate:**
   - Review email list quality
   - Implement double-opt-in
   - Remove invalid addresses
   - Add unsubscribe link

3. **If rate-limited:**
   - Upgrade Resend plan
   - Batch emails with delays
   - Use queue (Bull/BullMQ)

### Issue: Database Storage Growing Fast

**Diagnosis:**
```sql
-- Find large tables
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Fix:**
1. **Archive old proposals:**
   ```sql
   -- Move to archive table (one-time)
   INSERT INTO proposals_archive 
   SELECT * FROM proposals 
   WHERE created_at < NOW() - INTERVAL '1 year';
   
   DELETE FROM proposals 
   WHERE created_at < NOW() - INTERVAL '1 year';
   ```

2. **Delete old logs:**
   ```sql
   DELETE FROM audit_logs 
   WHERE created_at < NOW() - INTERVAL '6 months';
   ```

3. **Cleanup PDFs:**
   ```bash
   # In Supabase Storage, delete old PDF files
   # Via dashboard: Storage → wealthkit-pdfs → select old files → delete
   ```

### Issue: Razorpay Webhook Not Triggering

**Diagnosis:**
```bash
# Check Razorpay Dashboard → Settings → Webhooks
# Look at delivery attempts
# See if webhook URL is correct
# Check "Recent Deliveries" tab
```

**Fix:**
1. **Verify webhook URL:**
   - Should be: `https://yourdomain.com/api/webhooks/razorpay`
   - Not localhost or staging URL

2. **Check HMAC verification:**
   ```typescript
   // In webhook handler, add logging
   console.log('Webhook secret:', process.env.RAZORPAY_WEBHOOK_SECRET)
   console.log('Received signature:', signature)
   console.log('Computed signature:', computed)
   ```

3. **Test webhook manually:**
   ```bash
   # Get a recent payment ID from Razorpay
   # Construct webhook payload
   curl -X POST https://yourdomain.com/api/webhooks/razorpay \
     -H "Content-Type: application/json" \
     -H "x-razorpay-signature: test-sig" \
     -d '{"event":"subscription.activated",...}'
   ```

4. **Re-save webhook URL:**
   - Delete old webhook
   - Create new webhook with correct URL
   - Test from Razorpay dashboard

### Issue: Authentication Failures

**Problem: Users can't sign in**

**Diagnosis:**
```bash
# Check browser console (F12)
# Common errors:
# - "Invalid redirect_uri" → Google OAuth mismatch
# - "Email service error" → Resend API key invalid
# - "Session cookie error" → NEXTAUTH_SECRET mismatch
```

**Fix:**

1. **Google OAuth:**
   - Google Cloud Console → APIs & Services → Credentials
   - Find your OAuth 2.0 Client ID
   - Add redirect URI: `https://yourdomain.com/api/auth/callback/google`
   - Wait 15 minutes for changes to propagate

2. **Resend:**
   - Check API key in Vercel: `RESEND_API_KEY`
   - Verify domain is verified (if custom domain)
   - Test with test email first

3. **NextAuth:**
   - Verify `NEXTAUTH_SECRET` exists and is same in prod
   - Clear browser cookies
   - Try incognito/private window

---

## Monitoring Setup

### Vercel Analytics

**Already included.** View at: Vercel Dashboard → Project → Analytics

**Key metrics:**
- Web Vitals: LCP, FID, CLS (user experience)
- Request count by route
- Error rate
- Average response time

### Sentry Error Tracking (Optional)

```bash
npm install @sentry/nextjs
```

**Initialize in next.config.ts:**
```typescript
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig = {
  // ... config
}

export default withSentryConfig(nextConfig, {
  org: "your-org",
  project: "wealthkit",
  authToken: process.env.SENTRY_AUTH_TOKEN,
})
```

**Monitor in Sentry Dashboard:**
- Real-time error alerts
- Stack traces
- User sessions
- Performance monitoring

### Database Monitoring

**Supabase built-in:**
1. Supabase Dashboard → Monitoring
2. View slow queries
3. Check connections
4. Monitor storage

**Custom monitoring (optional):**
```bash
npm install @supabase/supabase-js pg-boss
```

Track important metrics:
```typescript
// In API route
const start = Date.now()
const result = await db.query(sql)
const duration = Date.now() - start

if (duration > 1000) {
  console.warn(`[SLOW QUERY] ${duration}ms: ${sql}`)
  // Alert if > 5s
  if (duration > 5000) {
    await sendAlert(`Slow query: ${sql}`)
  }
}
```

### Email Monitoring

**Resend Dashboard:**
- View all sent emails
- Check bounce rate (should be < 2%)
- Monitor complaint rate (should be < 0.1%)
- View delivery status by domain

**Set up alerts:**
- Bounce rate > 5% → investigate
- Complaint > 1% → review content
- Failed sends > 100 → check API key

---

## Disaster Recovery

### Backup Strategy

**Supabase auto-backups:**
- Daily snapshots (kept 7 days)
- Monthly snapshots (kept 365 days)
- Recovery Point Objective (RPO): 1 day
- Recovery Time Objective (RTO): ~1 hour

**Manual backup (monthly):**
```bash
supabase db dump > backup-$(date +%Y%m%d).sql
# Compress and store offsite
gzip backup-*.sql
# Upload to S3 or Google Drive
```

### Restore Procedure

**If database is corrupted:**

1. **Contact Supabase support**
   - Provide backup timestamp
   - Confirm restore point
   - Wait for restore (30 min - 2 hours)

2. **Or restore manually:**
   ```bash
   # Get backup file
   # Create new Supabase project
   # Import backup:
   supabase db push --db-url "postgresql://..."
   ```

3. **Verify after restore:**
   - Check row counts match
   - Test critical flows
   - Verify RLS policies still apply
   - Update env vars if new project

### Failover Checklist

**If main project down:**

- [ ] Supabase Status Page shows incident?
- [ ] Try alternative database (standby)?
- [ ] Contact Supabase support
- [ ] Estimate recovery time
- [ ] Notify customers
- [ ] Switch DNS to backup (if available)
- [ ] Monitor restore progress
- [ ] Test after recovery

---

## Scaling Checklist

**When approaching limits:**

### Supabase Database
- **Free tier limit:** 500 MB
- **When to upgrade:** At 400 MB
- **Cost:** ~₹50/GB/month
- **Upgrade path:** Go to Settings → Upgrade

### Vercel Functions
- **Default timeout:** 60 seconds
- **When to optimize:** Response times > 30s
- **Solutions:** 
  - Increase timeout (up to 900s)
  - Optimize code
  - Use background jobs

### Resend Email
- **Free tier:** 3,000/month
- **When to upgrade:** At 2,500/month
- **Cost:** ₹0.20 per email above limit
- **Solutions:** Batch emails, implement unsubscribe

### Storage
- **Supabase free:** 1 GB
- **When to upgrade:** At 800 MB
- **Solutions:** Archive old PDFs, compress images
- **Cost:** ₹50/GB/month

---

## Security Checklist

### Monthly
- [ ] Review access logs
- [ ] Check for failed login attempts (> 10 = breach?)
- [ ] Verify API keys haven't leaked (GitHub alerts)
- [ ] Update dependencies: `npm outdated`

### Quarterly
- [ ] Rotate sensitive credentials (API keys, secrets)
- [ ] Review user permissions
- [ ] Security audit of code changes
- [ ] Penetration test (hire firm or use tools)

### Annually
- [ ] Full security audit
- [ ] SOC 2 compliance review (if B2B)
- [ ] Privacy policy update
- [ ] Data retention policy review

---

## Runbook Examples

### Adding a New Distributor Manually

```bash
# In Supabase SQL Editor
INSERT INTO tenants (
  name, advisor_name, company_name, brand_color
) VALUES (
  'Rajesh Advisors',
  'Rajesh Agarwal',
  'Agarwal Wealth Advisors',
  '#2563eb'
);

-- Get the new tenant ID, then:
INSERT INTO subscriptions (
  tenant_id, plan_id, status, trial_ends_at
) VALUES (
  'NEW-UUID',
  'PLAN-UUID',
  'trial',
  NOW() + INTERVAL '14 days'
);

-- Send welcome email manually (if needed)
```

### Fixing a Failed PDF Generation

```bash
# 1. Check error in Vercel logs
vercel logs --tail

# 2. Find the proposal
# Supabase → proposals table → filter by ID

# 3. Retry generation
curl -X POST https://yourdomain.com/api/proposals/PROPOSAL-ID/generate-pdf

# 4. If still fails, regenerate PDF locally
# (requires access to proposal data)
npm run regenerate-pdf PROPOSAL-ID
```

### Handling a Refund Request

```bash
# 1. Customer asks for refund via email
# 2. Check in Razorpay Dashboard
# 3. Issue refund:
#    Razorpay → Invoices → select → Refund → confirm
# 4. Update subscription status:
#    UPDATE subscriptions SET status = 'cancelled' WHERE id = 'SUB-ID';
# 5. Send refund confirmation email
# 6. Log in audit_logs:
#    INSERT INTO audit_logs (...) VALUES (...);
```

---

## Communicating Issues to Customers

### Minor Issue (< 1 hour downtime)

Email template:
```
Subject: Brief service maintenance

We performed a quick maintenance on the WealthKit platform.
Downtime: 5 minutes (10:00 AM - 10:05 AM IST)
Impact: None to your service
No action needed.

— WealthKit Team
```

### Major Issue (> 1 hour)

Post on status page (if you have one):
```
INCIDENT: PDF Generation Service Unavailable

Status: INVESTIGATING (10:00 AM)
Impact: Users cannot generate PDFs
Workaround: Try again in 5 minutes

Will update every 15 minutes.
```

### Post-Incident Review

```
Incident Date: 2025-05-10
Duration: 2 hours
Impact: 10 customers affected
Root Cause: Database connection limit exceeded
Fix: Added connection pooling
Prevention: Monitor connection usage daily
```

---

## Documentation to Maintain

- [ ] Runbook (procedures for common issues)
- [ ] Architecture diagram (tech stack, data flow)
- [ ] Security policies (access control, data handling)
- [ ] Disaster recovery plan (backup, restore, failover)
- [ ] Incident response plan (who to notify, communication)
- [ ] On-call schedule (who responds to issues)

---

## Escalation Path

**Issue → Action → Escalation**

```
User reports problem
    ↓
Check dashboards (Vercel, Supabase, Resend)
    ↓
If < 5 min fix → Fix
    ↓
If 5-60 min fix → Notify status page, post update
    ↓
If > 60 min → Notify customers, engage vendor support
    ↓
If critical (no logins) → All hands on deck
```

---

**Remember: Boring is good. The goal is for nothing to break! 🎯**
