# GEOSEO — Traffic Measurement & Discovery Setup

Status as of 2026-06-30 (geoseo-tau.vercel.app):
- ✅ Code wired: `@vercel/analytics` + `SpeedInsights` in `layout.tsx`
- ✅ Speed Insights ENABLED (perf data collecting)
- ❌ **Web Analytics DISABLED** → `/_vercel/insights/script.js` returns 404 → **no page views recorded**
- ✅ Crawlable: robots.txt allows `/` + `/resources/*`, sitemap.xml = 125 URLs (HTTP 200)
- ❌ Google Search Console: sitemap not submitted (no search-traffic data)
- ❌ PostHog: `NEXT_PUBLIC_POSTHOG_KEY` unset → product analytics no-ops

---

## 1. Enable Vercel Web Analytics  ← THE fix for "no traffic data" (2 min, dashboard)

The component is already deployed; it just needs the project toggle on.

1. Open: https://vercel.com/rajputabhijay1-gmailcoms-projects/geoseo/analytics
2. Click **Enable** (Web Analytics). On Hobby it's free up to a monthly event cap.
3. Done — `/_vercel/insights/script.js` will start returning 200 and page views from real visitors begin recording immediately (no redeploy needed; redeploy optional).

Verify after enabling (run in this session with `!`):
```
! curl -s -o /dev/null -w "insights script: HTTP %{http_code}\n" https://geoseo-tau.vercel.app/_vercel/insights/script.js
```
Expect `HTTP 200`. Then view numbers in the Analytics tab (data appears within minutes of the first visit).

---

## 2. Google Search Console — get indexed + see search traffic (10 min, needs your Google login)

This is what gets the 125 pages crawled/indexed fast and shows impressions/clicks.

1. Open: https://search.google.com/search-console
2. **Add property** → **URL prefix** → `https://geoseo-tau.vercel.app`
3. **Verify** via the HTML-tag method:
   - GSC gives you a `<meta name="google-site-verification" content="XX['']" />` tag.
   - Add it to the site `<head>` (in `apps/web/src/app/layout.tsx` metadata, or as a `verification.google` field in the root `metadata` export), commit, deploy. *(I can do this code change for you — just paste the token.)*
4. After verification: **Sitemaps** → enter `sitemap.xml` → **Submit**.
5. Search-traffic data (impressions, clicks, queries) populates over the following days.

---

## 3. PostHog — product analytics / event tracking (5 min, CLI-doable)

Currently no-ops because the key is unset. To activate:

1. Get your project key from https://app.posthog.com → Project Settings → "Project API Key" (`phc_...`).
2. Add it to Vercel + redeploy (run with `!`, paste the key when prompted):
```
! cd /Users/abhijay/GEOSEO-main-deploy && vercel env add NEXT_PUBLIC_POSTHOG_KEY production
! cd /Users/abhijay/GEOSEO-main-deploy && vercel deploy --prod --yes
```
*(Or I can run the redeploy for you once the env var is set.)*

---

## 4. (Bonus) Lead capture notifications — `LEAD_WEBHOOK_URL`

Not traffic, but you'll want to know when traffic converts. Lead form posts to `/api/lead`; without a webhook, leads only sit in Vercel function logs.

1. Create a Slack incoming webhook (or Zapier catch hook).
2. Add + redeploy:
```
! cd /Users/abhijay/GEOSEO-main-deploy && vercel env add LEAD_WEBHOOK_URL production
! cd /Users/abhijay/GEOSEO-main-deploy && vercel deploy --prod --yes
```

---

## Reality check on expectations

The marketing site + resources hub are ~1 week old, and most of the 125 articles shipped in the last few days. Even with everything above enabled, meaningful organic + AI-citation traffic takes **weeks to months** to build after pages are crawled and indexed. Near-zero right now is normal — the point of steps 1–2 is to (a) start *measuring* so you can see it arrive, and (b) accelerate *discovery* so it arrives sooner.

Fastest leading indicators to watch:
- **Vercel Analytics** → any direct/referral visits (live within minutes of enabling)
- **GSC → Coverage/Pages** → how many of the 125 are indexed (days)
- **GSC → Performance** → first search impressions (1–3 weeks)
- **Server logs / GSC** → AI-crawler hits (GPTBot, PerplexityBot, etc.)
