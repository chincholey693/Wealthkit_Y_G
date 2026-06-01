# WealthKit Development Guide
## Local Development, Testing & Debugging

---

## Setting Up Development Environment

### IDE Setup (VSCode Recommended)

**Extensions to install:**
```
- ES7+ React/Redux/React-Native snippets (dsznajder.es7-react-js-snippets)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)
- Prettier - Code formatter (esbenp.prettier-vscode)
- Thunder Client or REST Client (for API testing)
- PostgreSQL (for database inspection)
```

**VSCode settings (.vscode/settings.json):**
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "typescript.tsserver.experimental.enableProjectDiagnostics": true,
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### Database Inspector

Connect to Supabase from local tools:

**Via Supabase CLI:**
```bash
npm install -g supabase
supabase login
supabase db pull  # Export current schema
supabase db push  # Apply migrations
```

**Via pgAdmin:**
1. Download pgAdmin: https://www.pgadmin.org
2. Create server connection:
   - Host: `[your-project].supabase.co`
   - Port: 5432
   - Username: `postgres`
   - Password: (from Supabase settings)
   - Database: `postgres`
3. Browse tables visually

---

## Running Tests

### Unit Tests

Create test files next to components:

**Example: `lib/calculators/formulas.test.ts`**

```typescript
import { calcSip } from './formulas'

describe('calcSip', () => {
  it('should calculate SIP value correctly', () => {
    const result = calcSip({
      monthlyAmount: 10000,
      annualReturn: 12,
      years: 10,
    })
    
    expect(result.totalValue).toBeGreaterThan(0)
    expect(result.totalValue).toBeGreaterThan(result.investedAmount)
    expect(result.investedAmount).toBe(10000 * 12 * 10)
  })
  
  it('should handle zero return rate', () => {
    const result = calcSip({
      monthlyAmount: 10000,
      annualReturn: 0,
      years: 10,
    })
    
    expect(result.totalValue).toBe(result.investedAmount)
  })
})
```

**Run tests:**
```bash
npm install --save-dev vitest @testing-library/react
npm run test
```

### E2E Tests (Playwright)

```bash
npm install -D @playwright/test
npx playwright install
```

**Example: `tests/auth.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'

test('user can sign in with email', async ({ page }) => {
  await page.goto('http://localhost:3000/auth/login')
  
  await page.click('button:has-text("Send magic link")')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.click('button:has-text("Send")')
  
  await expect(page).toContainText('Check your email')
})

test('user can create proposal', async ({ page, context }) => {
  // Sign in first (use cookie if available)
  // ... sign in logic ...
  
  // Navigate to calculator
  await page.goto('http://localhost:3000/dashboard/calculators/sip')
  
  // Adjust slider
  await page.fill('input[aria-label="Monthly amount"]', '25000')
  
  // Save
  await page.click('button:has-text("Save as proposal")')
  
  await expect(page).toHaveURL(/\/dashboard\/proposals\//)
})
```

**Run tests:**
```bash
npx playwright test
npx playwright test --ui  # Interactive mode
```

---

## Debugging Guide

### Browser Console Debugging

**Check for JavaScript errors:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red errors
4. Common issues:
   - `CORS error` — API endpoint blocked (check CORS headers)
   - `Uncaught TypeError` — Missing variable or typo
   - `ReferenceError: X is not defined` — Forgot to import

**Debug React components:**
```javascript
// In browser console
// Search for component in React DevTools
// See props, state, hooks

// Log during component render
const [x, setX] = useState(0)
useEffect(() => {
  console.log('Component mounted or x changed:', x)
}, [x])
```

### Server-Side Debugging

**View logs in terminal:**
```bash
npm run dev
# Watch for [API] logs

# Example output:
# [API] GET /api/clients took 125ms
# [API] PDF generation started for proposal-123
```

**Add debug logging:**
```typescript
// In API route
export async function GET(req: Request) {
  console.log('[DEBUG] GET /api/clients')
  console.log('[DEBUG] Headers:', Object.fromEntries(req.headers))
  
  const data = await fetchClients()
  console.log('[DEBUG] Found', data.length, 'clients')
  
  return NextResponse.json({ data })
}
```

**Use debugger breakpoints:**
```typescript
export async function POST(req: Request) {
  debugger  // Execution pauses here
  const body = await req.json()
  
  if (!body.name) {
    debugger  // Stop on error condition
    throw new Error('Name required')
  }
}
```

Run with inspector:
```bash
node --inspect-brk ./node_modules/.bin/next dev
# Then open chrome://inspect in browser
```

### Database Debugging

**Check query performance:**
```sql
-- In Supabase SQL Editor
EXPLAIN ANALYZE
SELECT * FROM proposals WHERE tenant_id = 'xxx' ORDER BY created_at DESC;

-- Look for slow index scans
-- Add index if needed:
CREATE INDEX idx_proposals_tenant_created ON proposals(tenant_id, created_at);
```

**View real-time activity:**
```sql
-- Watch active queries
SELECT 
  pid, 
  usename, 
  query, 
  query_start 
FROM pg_stat_activity 
WHERE state = 'active';

-- Kill long-running query
SELECT pg_terminate_backend(pid);
```

**Check table sizes:**
```sql
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

---

## Common Development Tasks

### Adding a New API Endpoint

**Example: POST /api/bulk-create-clients**

1. **Create file:** `app/api/bulk-create-clients/route.ts`

```typescript
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const clientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
})

const bulkSchema = z.object({
  clients: z.array(clientSchema).min(1).max(100),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { clients } = bulkSchema.parse(body)

    const supabase = await createAdminClient()

    // Insert all clients
    const { data, error } = await supabase
      .from('clients')
      .insert(
        clients.map(c => ({
          ...c,
          tenant_id: session.user.tenantId,
          stage: 'lead',
          created_at: new Date().toISOString(),
        }))
      )
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      tenant_id: session.user.tenantId,
      user_id: session.user.id,
      action: 'bulk_import_clients',
      entity_type: 'clients',
      metadata: { count: clients.length },
    })

    return NextResponse.json({
      data,
      success: true,
      count: data.length,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: err.errors },
        { status: 400 }
      )
    }
    
    console.error('[ERROR] bulk-create-clients:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

2. **Test endpoint:**
```bash
curl -X POST http://localhost:3000/api/bulk-create-clients \
  -H "Content-Type: application/json" \
  -d '{
    "clients": [
      {"name": "Client 1", "email": "c1@example.com"},
      {"name": "Client 2", "phone": "+91 98765 43210"}
    ]
  }'
```

### Adding a New Database Table

1. **In Supabase SQL Editor:**

```sql
-- Create table
CREATE TABLE client_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Create indexes
CREATE INDEX idx_client_meetings_tenant_id ON client_meetings(tenant_id);
CREATE INDEX idx_client_meetings_client_id ON client_meetings(client_id);
CREATE INDEX idx_client_meetings_scheduled_at ON client_meetings(scheduled_at);

-- Enable RLS
ALTER TABLE client_meetings ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Tenants can see their own meetings"
  ON client_meetings
  FOR SELECT
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Tenants can insert meetings"
  ON client_meetings
  FOR INSERT
  WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id'::text);
```

2. **Update TypeScript types:** `lib/types.ts`

```typescript
export interface ClientMeeting {
  id: string
  tenant_id: string
  client_id: string
  title: string
  description?: string
  scheduled_at: string
  completed_at?: string
  notes?: string
  created_at: string
  updated_at: string
}
```

3. **Create API route:** `app/api/client-meetings/route.ts`

```typescript
// Follow pattern from other routes
```

### Modifying a Calculator

**Example: Add "lump-sum bonus" to SIP calculation**

1. **Update formula:** `lib/calculators/formulas.ts`

```typescript
export interface CalcSipInput {
  monthlyAmount: number
  annualReturn: number
  years: number
  lumpsumBonus?: number  // NEW
  lumpsumBonusMonth?: number  // NEW
}

export function calcSip(input: CalcSipInput): CalcSipOutput {
  const { monthlyAmount, annualReturn, years, lumpsumBonus = 0, lumpsumBonusMonth = 1 } = input
  
  const rMonthly = annualReturn / 100 / 12
  let value = 0
  const data = []

  for (let m = 1; m <= years * 12; m++) {
    value = (value + monthlyAmount) * (1 + rMonthly)
    
    // Add bonus if applicable
    if (m === lumpsumBonusMonth && lumpsumBonus > 0) {
      value += lumpsumBonus
    }
    
    if (m % 12 === 0 || m === years * 12) {
      data.push({
        year: m / 12,
        value: r2(value),
        invested: r2(monthlyAmount * m + (m >= lumpsumBonusMonth ? lumpsumBonus : 0)),
      })
    }
  }

  return {
    totalValue: r2(value),
    investedAmount: r2(monthlyAmount * years * 12 + lumpsumBonus),
    totalReturns: r2(value - (monthlyAmount * years * 12 + lumpsumBonus)),
    yearlyData: data,
  }
}
```

2. **Update UI:** `app/dashboard/calculators/sip/page.tsx`

```typescript
const [monthlySip, setMonthlySip] = useState(15000)
const [lumpsumBonus, setLumpsumBonus] = useState(0)  // NEW
const [lumpsumBonusMonth, setLumpsumBonusMonth] = useState(1)  // NEW

const result = useMemo(() => 
  calcSip({
    monthlyAmount: monthlySip,
    annualReturn: rate,
    years,
    lumpsumBonus,  // NEW
    lumpsumBonusMonth,  // NEW
  }),
  [monthlySip, rate, years, lumpsumBonus, lumpsumBonusMonth]
)

// In inputs:
<SliderInput
  label="Bonus amount (optional)"
  value={lumpsumBonus}
  min={0}
  max={500000}
  step={10000}
  format="currency"
  onChange={setLumpsumBonus}
/>
<SliderInput
  label="Month to apply bonus"
  value={lumpsumBonusMonth}
  min={1}
  max={years * 12}
  format="month"
  onChange={setLumpsumBonusMonth}
/>
```

3. **Test locally:**
```bash
npm run dev
# Go to http://localhost:3000/dashboard/calculators/sip
# Adjust bonus slider
# Verify calculation changed
```

---

## Performance Optimization

### Identify Slow Pages

**Check Vercel Analytics:**
1. Vercel Dashboard → Project → Analytics
2. View "Slowest routes"
3. Typical targets:
   - `/dashboard` (fetches multiple data sets)
   - `/api/proposals` (DB query on large dataset)

### Optimize Database Queries

**Before (slow):**
```typescript
const clients = await supabase
  .from('clients')
  .select('*')
  .eq('tenant_id', tenantId)

// Then in loop:
for (const client of clients) {
  const proposals = await supabase
    .from('proposals')
    .select('*')
    .eq('client_id', client.id)
}
```

**After (fast):**
```typescript
const clients = await supabase
  .from('clients')
  .select('*, proposals(*)')  // Fetch related data
  .eq('tenant_id', tenantId)
```

### Cache API Responses

```typescript
// In API route
export async function GET(req: Request) {
  // Add cache header
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  })
}
```

### Optimize Frontend Components

**Use React.memo for expensive components:**
```typescript
const ProposalCard = React.memo(({ proposal }) => {
  return (
    <div>
      {/* expensive render */}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.proposal.id === nextProps.proposal.id
})
```

**Lazy load components:**
```typescript
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <p>Loading chart...</p>,
})
```

---

## Environment Variables for Development

**Create `.env.development.local` for dev-only vars:**

```env
# Development overrides
DEBUG=wealthkit:*
NODE_ENV=development
LOG_LEVEL=debug

# Use slower test data
MOCK_SLOW_API=true  # Simulates 3s delays
MOCK_CALCULATE_ERRORS=true  # Random calculation errors

# Stripe test mode
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feat/add-sms-notifications

# Make changes, test locally
npm run dev
npm run build
npm run lint

# Commit
git add .
git commit -m "feat: add SMS notifications for follow-ups

- Use Twilio SDK
- Store phone preferences in clients table
- Add settings toggle
- Fixes #123"

# Push and create PR
git push origin feat/add-sms-notifications

# In GitHub, create PR with:
- Description of changes
- Link to issue
- Checklist of testing done
- Screenshots (if UI changes)
```

---

## Deployment Preview

**Deploy preview to Vercel before production:**

```bash
git push origin feat/my-feature
# Vercel auto-creates preview URL
# Share preview with team for testing

# Once approved:
git checkout main
git pull
git merge feat/my-feature
git push origin main
# Auto-deploys to production
```

---

## Debugging Checklist

- [ ] Check browser console for errors (F12)
- [ ] Check terminal logs for server errors
- [ ] Verify `.env.local` values are correct
- [ ] Clear browser cache (`Cmd+Shift+Delete`)
- [ ] Restart dev server (`Ctrl+C`, then `npm run dev`)
- [ ] Check database table exists and has data
- [ ] Use Supabase Dashboard to inspect data
- [ ] Test API endpoint manually with curl
- [ ] Check RLS policies allow your user
- [ ] Verify Redux/Context state (React DevTools)

---

## Getting Help

- **Check existing issues:** GitHub Issues
- **Read error messages carefully** — they usually tell you what's wrong
- **Search Stack Overflow** for the error message
- **Ask in Discord/Slack** if available
- **Check commit history** if code was working before
- **Pair program** with a colleague

---

**Happy coding!** 🚀
