# Setup Guide — wacrm (SaaS Edition)

## Step 1: Claim your GitHub Developer Pack benefits

| # | Service | What you get | How to claim |
|---|---------|-------------|-------------|
| 1 | **Supabase Pro** | Free for 1 year ($25/mo value) | https://supabase.com/github-dev-program |
| 2 | **Vercel Pro** | Free for 1 year ($20/mo value) | https://vercel.com/github-dev-program |
| 3 | **Namecheap** | Free .xyz domain for 1 year | https://nc.me |

## Step 2: Fork this repo

| # | Action | Details |
|---|--------|---------|
| 1 | Go to GitHub | https://github.com/ArnasDon/wacrm |
| 2 | Click **Fork** | Creates your own copy under your GitHub account |
| 3 | Clone your fork | Run the commands below |

```bash
git clone https://github.com/YOUR_USERNAME/wacrm.git
cd wacrm
```

## Step 3: Set up Supabase

### 3a — Create a project

| # | Action | Where |
|---|--------|-------|
| 1 | Go to Supabase and log in | https://supabase.com |
| 2 | Click **New project** | Dashboard |
| 3 | Name it `wacrm` (or anything) | Project details |
| 4 | Set a strong database password | Project details |
| 5 | Choose a region close to you | Project details |
| 6 | Click **Create new project** | Wait ~2 min for provisioning |

### 3b — Run the database migrations

| # | Action | Details |
|---|--------|---------|
| 1 | Go to **SQL Editor** in the left sidebar | Supabase dashboard |
| 2 | Open `supabase/combined-migration.sql` from this repo | In your code editor |
| 3 | **Copy the entire file** and paste into SQL Editor | Ctrl+A → Ctrl+C → Ctrl+V |
| 4 | Click **Run** | Creates all tables, indexes, RLS policies, triggers, and functions |

The combined migration creates these tables:

| # | Table | What it stores |
|---|-------|---------------|
| 1 | `profiles` | User profiles (name, email, avatar) |
| 2 | `contacts` | WhatsApp contacts (phone, name, company) |
| 3 | `tags` | Labels for contacts |
| 4 | `contact_tags` | Which tags are on which contact |
| 5 | `custom_fields` | Extra contact fields you define |
| 6 | `contact_custom_values` | Values for those custom fields |
| 7 | `contact_notes` | Notes on contacts |
| 8 | `conversations` | Chat threads (open/pending/closed) |
| 9 | `messages` | Individual messages in a conversation |
| 10 | `whatsapp_config` | WhatsApp API credentials (encrypted) |
| 11 | `message_templates` | Broadcast message templates |
| 12 | `pipelines` | Sales pipeline names |
| 13 | `pipeline_stages` | Stages inside a pipeline (Kanban columns) |
| 14 | `deals` | Deals linked to contacts and stages |
| 15 | `broadcasts` | Bulk message campaigns |
| 16 | `broadcast_recipients` | Who got which broadcast |
| 17 | `automations` | No-code automation rules |
| 18 | `automation_steps` | Steps inside an automation |
| 19 | `automation_logs` | Execution history of automations |
| 20 | `automation_pending_executions` | Delayed/waiting automation runs |

### 3c — Enable email auth

| # | Action | Where |
|---|--------|-------|
| 1 | Go to **Authentication → Providers** | Supabase sidebar |
| 2 | Make sure **Email** is **Enabled** | Toggle on |
| 3 | **Disable "Confirm email"** | For testing only (re-enable for production) |

### 3d — Get your credentials

| # | What to copy | Where to paste | Where to find it |
|---|-------------|---------------|------------------|
| 1 | `Project URL` | `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` | Supabase → Project Settings → API |
| 2 | `anon public key` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` | Same page |
| 3 | `service_role key` | `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` | Same page (click **Reveal**)

## Step 4: Generate encryption key

| Step | Command | Output goes to |
|------|---------|---------------|
| Run this in your terminal | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | `ENCRYPTION_KEY` in `.env.local` |

## Step 5: Configure .env.local

Open `.env.local` and fill in all values:

| Variable | Where to get it | Example value |
|----------|----------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page (click **Reveal**) | `eyJhbGciOiJIUzI1NiIs...` |
| `ENCRYPTION_KEY` | Generated in step 4 | `a1b2c3d4e5f6...` (64 hex chars) |
| `META_APP_SECRET` | Set to placeholder for now | `dev-placeholder` |
| `NEXT_PUBLIC_SITE_URL` | Your local URL | `http://localhost:3000` |

> **META_APP_SECRET** is only needed for WhatsApp webhook verification. For local dev/testing, just set it to `dev-placeholder`.

## Step 6: Run locally

```bash
npm run dev
```

| # | What should happen |
|---|-------------------|
| 1 | Open http://localhost:3000 |
| 2 | Click **Sign up** at the top right |
| 3 | Enter email + password → click Sign up |
| 4 | You should be redirected to the dashboard |

**Troubleshooting:** If you land on a blank page or get errors:

| Symptom | Fix |
|---------|-----|
| "profile not found" | The auto-profile trigger didn't run. Go to Supabase SQL Editor and run: `SELECT * FROM profiles;` — if empty, re-run the combined migration. |
| "Invalid API key" | Double-check your `NEXT_PUBLIC_SUPABASE_ANON_KEY` — it's different from the `service_role key`. |
| Blank white page | Open browser console (F12) and check for CORS errors — confirm your Supabase URL is correct. |

## Step 7: Deploy to Vercel

| # | Action | Details |
|---|--------|---------|
| 1 | Push your fork to GitHub | `git push origin main` |
| 2 | Go to Vercel | https://vercel.com |
| 3 | Click **Add New → Project** | Top right |
| 4 | Import your forked repo | Select it from the list |
| 5 | Add environment variables | Paste ALL 6 variables from `.env.local` |
| 6 | Click **Deploy** | Wait ~2 min |

After deploy, your app is live at `https://your-project.vercel.app`.

---

## Step 8: Set up WhatsApp Business API (when ready to go live)

You'll need to set up Meta's WhatsApp Business API to send/receive actual messages:

| # | What you need | Where to get it |
|---|--------------|-----------------|
| 1 | **Meta for Developers account** | https://developers.facebook.com |
| 2 | **Meta Business Suite** | https://business.facebook.com |
| 3 | **WhatsApp Business Account (WABA)** | Created inside Meta Business Manager |
| 4 | **Phone number** | Buy from Twilio (~$1/mo) or use your own |

Meta's official setup guide: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started

After setup, configure your webhook at Meta to point to:
```
https://yourdomain.com/api/whatsapp/webhook
```

---

## Step 9 (optional): Set up a free .xyz domain

| # | Action | Where |
|---|--------|-------|
| 1 | Go to https://nc.me | Namecheap (GitHub Dev Pack) |
| 2 | Claim your free `.xyz` domain | Choose any name |
| 3 | In Vercel, go to your project → **Domains** | Vercel dashboard |
| 4 | Add your domain and follow Vercel's DNS instructions | They'll tell you what to paste |

---

## Summary — your cost breakdown

| Service | Year 1 (GitHub Dev Pack) | Year 2+ |
|---------|--------------------------|---------|
| **Supabase Pro** | **$0** (free) | $25/mo |
| **Vercel Pro** | **$0** (free) | $20/mo |
| **Domain** | **$0** (free .xyz) | ~$10/yr |
| **WhatsApp API usage** | Pay-per-use (~$5-50/mo depending on volume) | Same |
| **Total** | **$0/mo + WhatsApp usage** | ~$45/mo + WhatsApp usage |

**You're now live with $0/mo infrastructure for the first year.**
