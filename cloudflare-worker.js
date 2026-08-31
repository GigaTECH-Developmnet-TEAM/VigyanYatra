# GigaTECH AI — Setup Guide (one file to deploy, powered by Groq's free API)

This is everything you need to make the GigaTECH AI chat widget on
**bharatvigyanyatra.com** actually answer questions. Two files total:

- `index.html` — the website (already has the chat widget built in)
- `cloudflare-worker.js` — the one backend file you deploy

---

## Why this is needed at all

A browser can never call an AI API directly — it's blocked by CORS, and it
would expose your secret API key to every visitor if it somehow worked.
You need a small server in between:

```
Website (index.html)  →  cloudflare-worker.js  →  Groq API  →  back to visitor
```

Your worker holds the real API key. The website never sees it.

## Why Groq (the free API)

[Groq](https://groq.com) gives every account a genuinely free API tier —
no credit card required to start, very fast responses, and it runs
**Llama 3.3 70B**, a strong open model with solid general science
knowledge. OpenAI's API has no real free tier (a small one-time credit
that runs out), so Groq is the practical free choice here.

GigaTECH AI's personality, its full science subject coverage (physics,
chemistry, biology, maths, astronomy, space science, AI & robotics — the
same categories as the "Explore Science" section on the site), and its
Bharat Vigyan Yatra knowledge base (team, tickets, dates, venue, FAQs) are
all built into `cloudflare-worker.js` as its system prompt — that's the
"training." Edit that one block any time the show's details change or you
want to tune its subject coverage; no website redeploy needed.

---

## Setup (about 5 minutes)

### 1. Get a free Groq API key
Go to **https://console.groq.com/** → sign up (free, no card) →
**API Keys** → **Create API Key** → copy it.

### 2. Deploy the worker
- Go to **https://dash.cloudflare.com/** → sign up / log in (free).
- **Workers & Pages** → **Create** → **Create Worker** → name it e.g.
  `gigatech-ai` → **Deploy**.
- Click **Edit code**, delete everything in the editor, paste the full
  contents of `cloudflare-worker.js` → **Save and Deploy**.

### 3. Add your Groq key as a secret
- Worker → **Settings → Variables** → **Add variable**
  - Name: `GROQ_API_KEY`
  - Value: the key from step 1
  - Tick **Encrypt** → **Save**.

### 4. Copy your worker's URL
Looks like: `https://gigatech-ai.<your-subdomain>.workers.dev`

### 5. Point the website at it
In `index.html`, find this line near the GigaTECH AI widget script:
```js
const AI_BACKEND_URL = '/api/gigatech-ai';
```
Replace it with your worker's URL from step 4:
```js
const AI_BACKEND_URL = 'https://gigatech-ai.yoursubdomain.workers.dev';
```

### 6. (Optional, recommended) Use your own domain
In the worker's **Settings → Domains & Routes**, attach a route like
`bharatvigyanyatra.com/api/*` so you can keep the clean relative path
`/api/gigatech-ai` in the frontend instead of a workers.dev URL.

---

## Checklist

- [ ] Got a free Groq API key
- [ ] Deployed `cloudflare-worker.js` to Cloudflare Workers
- [ ] Added `GROQ_API_KEY` as an encrypted environment variable
- [ ] Copied the live worker URL
- [ ] Updated `AI_BACKEND_URL` in `index.html` to that URL
- [ ] Re-uploaded/redeployed `index.html`
- [ ] Tested the chat widget live on the site

Once checked off, GigaTECH AI answers for real — warm, human-like,
language-mirroring, and grounded in the Bharat Vigyan Yatra knowledge
baked into the worker.

## Updating GigaTECH AI's knowledge later

Open `cloudflare-worker.js`, find the `SYSTEM_PROMPT` block near the top,
edit the facts (new event date, new ticket price, new team member, etc.),
paste the updated file back into the Cloudflare Worker editor, and hit
**Save and Deploy**. Takes under a minute — the website itself never
needs to change for a knowledge update.
