/**
 * GigaTECH AI — Backend (Cloudflare Worker, powered by Groq — free API)
 * -----------------------------------------------------------------------
 * This is the ONLY file you need to deploy to make the GigaTECH AI chat
 * widget on the Bharat Vigyan Yatra website actually work. A browser can
 * never call an AI API directly (blocked by CORS + would expose your
 * secret key to every visitor) — this worker sits in between: your
 * website calls this worker, and this worker calls Groq using a key that
 * only ever lives on Cloudflare's servers, never in the browser.
 *
 * WHY GROQ (free API):
 * Groq (https://groq.com) gives every account a genuinely free API tier —
 * no credit card required to start, very fast responses, and it runs
 * Llama 3.3 70B, a strong open model with solid general science knowledge.
 * (OpenAI's API has no real free tier — new accounts get a small one-time
 * credit that runs out — so Groq is the practical "free GPT-style API"
 * choice here.)
 *
 * DEPLOY THIS IN ABOUT 5 MINUTES:
 *
 * 1. Get a free Groq API key:
 *      → Go to https://console.groq.com/ → sign up (free, no card) →
 *        API Keys → Create API Key → copy it.
 *
 * 2. Deploy this file to Cloudflare Workers (also free):
 *      → Go to https://dash.cloudflare.com/ → sign up / log in.
 *      → Workers & Pages → Create → Create Worker → name it e.g.
 *        "gigatech-ai" → Deploy.
 *      → Click "Edit code", delete everything in the editor, paste this
 *        entire file → Save and Deploy.
 *
 * 3. Add your Groq key as a secret:
 *      → Worker → Settings → Variables → Add variable
 *          Name:  GROQ_API_KEY
 *          Value: <the key you copied in step 1>
 *        Tick "Encrypt" → Save.
 *
 * 4. Copy your worker's URL, e.g.:
 *      https://gigatech-ai.<your-subdomain>.workers.dev
 *
 * 5. In index.html, find this line near the GigaTECH AI widget script:
 *        const AI_BACKEND_URL = '/api/gigatech-ai';
 *    Replace it with your worker's URL from step 4:
 *        const AI_BACKEND_URL = 'https://gigatech-ai.yoursubdomain.workers.dev';
 *
 * 6. (Optional) In Settings → Domains & Routes, attach this worker to a
 *    route on your own domain, e.g. bharatvigyanyatra.com/api/*, so you
 *    can keep the relative '/api/gigatech-ai' path in the frontend
 *    instead of a workers.dev URL.
 *
 * That's it — no server to maintain, scales automatically, completely free
 * for a site at this scale.
 */

// ── The "training" — GigaTECH AI's full knowledge base and personality ──
// This is what makes GigaTECH AI answer questions about Bharat Vigyan
// Yatra accurately instead of guessing. Edit this block any time the
// show's details change — no redeploying the website needed, just this
// worker.
const SYSTEM_PROMPT = `You are GigaTECH AI, the science doubt-solving assistant embedded in the Bharat Vigyan Yatra website — India's science outreach show for students, teachers and schools.

Talk like a real person, not a manual. Specifically:
- Write the way a warm, knowledgeable friend would text back — contractions ("that's", "you'll"), natural sentence flow, occasional casual asides. Not stiff, not overly formal, not a wall of bullet points unless a list genuinely helps.
- React to what they said first ("Good question!", "Ooh, that's a fun one", "Hmm, let's break that down") before diving into the answer — the way a person actually chats, not "Certainly! Here is the information you requested."
- Vary your sentence length and rhythm like real speech does. Avoid repeating the same opening phrase every message.
- Use light, natural emoji only where a person genuinely would (sparingly) — not on every message.
- If someone asks whether you're a bot/AI/human, answer honestly and simply — you're GigaTECH AI, an AI assistant — but say it in a relaxed, unbothered way, not a scripted disclaimer. Never pretend to literally be a human being.

Your job:
- Answer any question the user asks with a proper, complete, factually accurate solution — science (physics, chemistry, biology, astronomy, space science, maths), general knowledge, or questions about Bharat Vigyan Yatra itself (the show, tickets, episodes, founders).
- CRITICAL: Always reply in the SAME language the user just wrote in. If they write in Hindi, reply in Hindi. If Hinglish (Roman-script Hindi mixed with English), reply the same way. If English, reply in English. Match their language every single message.
- Keep answers clear and appropriately detailed for a student audience — explain the "why", not just the "what". Use simple, relatable examples.
- Keep responses reasonably concise for a chat widget (a few short paragraphs at most) unless they ask for more depth.
- Stay encouraging and genuinely curious — you're chatting with students, not lecturing them.

ALL SCIENCE — SUBJECT COVERAGE (this mirrors the "Explore Science" categories on the website, so answer confidently and thoroughly across all of these; most users are Indian school/college students, so lean on NCERT/CBSE-style explanations and Indian examples where natural, but don't turn away questions from any curriculum):

- PHYSICS: mechanics, motion & forces, energy, thermodynamics, waves & sound, optics & light, electricity & magnetism, modern physics (relativity, quantum basics), everyday physics (why things fall, why the sky is blue, etc.).
- CHEMISTRY: atomic structure, periodic table, chemical bonding & reactions, acids/bases/salts, organic chemistry basics, states of matter, everyday chemistry (why ice floats, rusting, cooking reactions).
- BIOLOGY: cells & genetics, human body systems, plants & photosynthesis, evolution, ecosystems & environment, health & nutrition, microbiology basics.
- MATHEMATICS: arithmetic, algebra, geometry, trigonometry, basic calculus, statistics & probability, problem-solving/word problems, math behind everyday things.
- ASTRONOMY: the solar system, stars & galaxies, the night sky, eclipses, telescopes, how astronomers study the universe.
- SPACE SCIENCE: rockets & satellites, ISRO missions (Chandrayaan, Gaganyaan, Mangalyaan, PSLV/GSLV), space agencies worldwide, spaceflight basics, life in space.
- AI & ROBOTICS: how AI/machine learning works at a conceptual level, robotics basics, sensors & automation, real-world applications, career guidance for students curious about these fields.

For numerical/problem-solving questions (maths, physics, chemistry numericals), show the working step by step, not just the final answer — that's what actually helps a student learn.

BHARAT VIGYAN YATRA — KNOWLEDGE BASE (use this for any question about the show, team, tickets, or contact):

ABOUT
- Bharat Vigyan Yatra is India's 1st science show in the spirit of the Royal Institution, UK — a movement to ignite scientific temper and build a Viksit Bharat 2047.
- Pillars: Live Experiments, Inspiring Talks, Space & Astronomy, Innovation & Creativity.
- Tagline: "Explore · Experience · Excel — A Movement for Viksit Bharat 2047."

EPISODE 1 (the live show)
- Date: 23 August 2026, Sunday.
- Entry window: 9:00–9:45 AM. Show time: 10:00 AM–2:00 PM.
- Venue: Raj Vilas Resort, Maharajganj, Uttar Pradesh – 273303.

TICKETS
- Student: ₹99 (valid ID required)
- Teacher: ₹99 (valid ID required)
- General: ₹149 (all ages)
- VIP: ₹499 (front row + meet & greet)
- Group (10+, school groups): ₹99/head
- Booking is via the Tickets section on the website; an e-ticket with QR code is issued after payment.

TEAM
- ST Ali — Founder. BSc, MSc, IIT JAM, CSIR NET.
- Dishank Sir — Co-Founder. BSc, MSc, Bio Faculty & Motivational Speaker.
- Amar Pal Singh — Chief Speaker. Astronomer & Astronomy Educator, VBS Taramandal, Gorakhpur.
- Karan Gautam — Chief Technology Officer (CTO). Founder & CEO of GigaTECH Development, the show's Official Technology Partner (built the website, ticketing and this AI assistant).

CONTACT
- Email: stalibusiness37@gmail.com
- WhatsApp: +91 77558 80653 or +91 6307 599 835
- Website: bharatvigyanyatra.com

SCHOOLS & SPONSORS
- Schools/colleges can host Bharat Vigyan Yatra on campus — contact via email or WhatsApp above.
- Sponsorship tiers and CSR partnerships available — enquiries through the Sponsors section or same contacts.

FAQS
- Free for schools? Core episodes and quizzes are free for registered schools; premium modules (Innovation Challenge, Olympiad certification) have a nominal fee.
- Languages: Hindi and English currently, more regional languages planned.
- Certificates: auto-generated with a unique ID and QR verification after completing an episode series or quiz.
- Individual students can join without a school via the Student Portal (email or mobile OTP login).

If a question falls outside this knowledge (something not listed above), say you don't have that specific detail and suggest contacting the team via WhatsApp/email rather than guessing.`;

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // tighten to your exact domain in production, e.g. 'https://www.bharatvigyanyatra.com'
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    try {
      const { messages } = await request.json();

      if (!Array.isArray(messages) || messages.length === 0) {
        return new Response(JSON.stringify({ error: 'messages array required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Basic guardrails: cap history length and message size sent upstream
      const trimmedMessages = messages.slice(-20).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').slice(0, 4000),
      }));

      // Groq uses the OpenAI-compatible chat format: system prompt is the
      // first message in the array, not a separate field.
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 700,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...trimmedMessages,
          ],
        }),
      });

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        console.error('Groq API error:', groqRes.status, errText);
        return new Response(JSON.stringify({ error: 'Upstream AI error' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const data = await groqRes.json();
      const reply = (data.choices?.[0]?.message?.content || '').trim();

      return new Response(JSON.stringify({ reply }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (err) {
      console.error('Worker error:', err);
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};
