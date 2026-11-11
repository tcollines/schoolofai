# Free "AI Fundamentals" Course — Study Report & Implementation Plan

**Prepared:** 11 Nov 2026 · **For:** COO / Engineering · **Status:** PLAN ONLY — nothing in the codebase has been changed.

---

## 0. The short version

We make the free AI Fundamentals course the front door of the website:

```
Website hero "Study AI for Free"
   → public course page (what you'll learn, outline, sponsor, live timetable, [Start studying])
   → register (existing signup, shortened for this entry) → auto-enrolled
   → course home (outline + "Resume") → player: video → practice → module quiz  (×6 modules)
   → final assessment → auto-issued certificate (signed by both CEOs, verifiable, shareable)
```

Alongside it we build four things that make it a business tool, not just a course:

1. **Staff referral links**, invisible to students, attributed permanently to the staff member.
2. **A staff portal** where staff log in, get their link, register students for any course, and see their own results. Whoever registers a student is recorded automatically.
3. **An admin analytics dashboard**: registrations → started → each module → completed → certificate, plus source, staff, and live-class stats.
4. **A live-class timetable** inside the course, so self-paced learners can join live sessions.

I also turn your three lesson decks into a **~6-hour, 7-module course (24 short videos)**. The recording scripts will come in a **separate response**, as you asked.

**Two things need attention before we expose any of this publicly** (details in §2.3): admin access control is currently client-side only, and quiz answers and progress are not stored safely or reportably. An analytics dashboard full of student data cannot sit behind a passcode that lives in the JavaScript bundle.

---

## 1. What I did

| Step | Result |
|---|---|
| Pulled latest | `main` already equals `origin/main` (commit `5b9f6f2`, 10 Nov). Nothing new to pull. One local file is modified: `backend/data/marzpay-transactions.json` (test payment from running the backend locally). |
| Re-studied the system | Repo has moved a lot since 27 Oct — see §2.1. |
| Read all 6 files in `FUNDAMENTALS IN AI/` | 3 teaching-deck PDFs (23 + 22 + 23 pages) and 3 PPTX (10 + 7 + 6 slides). Findings in §3. |
| Researched Coursera, HubSpot Academy, referral tracking, MOOC benchmarks | §4, with sources at the end. |

---

## 2. State of the system today

### 2.1 What already exists (and I will reuse)

| Area | What is there |
|---|---|
| Stack | React 19 + Vite + TS student app (`frontend/`), standalone `admin-portal/`, Express backend on Render, Supabase (Postgres/Auth/Realtime), Vercel hosting. |
| Registration | Public `/register` — a 2,600-line "Official 8-section registration form" with offline queue (`outreachSync.ts`), staff attribution via `?staff=` / `?mobilizer=`, campaigns, Uganda districts + university selector. |
| Admin CRM | `AdminRegistrations.tsx` (4,100 lines) — registrations dashboard, outreach campaigns, team control. |
| Staff roster | `outreach_staff` table: name, `staff_code` (e.g. `WSI-STF-001`), role, phone. **No logins** — a roster only. |
| Course catalog | `OFFICIAL_COURSE_CATALOG` already lists "Fundamentals of AI — Free (UGX 0)" next to the paid courses. |
| Player | `CoursePlayer.tsx` (998 lines): video/audio/article/quiz modules, timer, speed control, notes, Q&A, attendance codes for live lessons. `ExamPlayer`, `Certificates`, `Events` (RSVP + Meet links), cohorts + auto-cohort trigger. |
| Payments | MarzPay mobile-money checkout, USD/UGX toggle, corporate seats. |
| Landing page | Hero, features, pricing; "Register Now" link; hero button toggles between outreach/regular. |

### 2.2 What does **not** exist yet

- No dedicated **public page for the free course**, and no signup path that leads into a course.
- **No `?ref=` capture for self-signups.** Attribution exists only on the outreach form.
- **No staff logins**, staff portal, or leaderboard.
- **No server-side learning data.** Lesson progress is a single number (`enrollments.progress`). Quiz grades and the weekly-activity chart live in `localStorage`, so they cannot be reported on and vanish when a phone's browser data is cleared.
- **No automatic certificate.** Certificates are images an admin uploads and "verifies" by hand. There is no ID, no public verify page, no signatures.
- **No live timetable inside a course.** `EventsPage` is site-wide; the Google Meet endpoint is a stub that only builds a Calendar link.
- **Admin overview stats are mock** (e.g. revenue is `paid users × 29`).

### 2.3 Risks I found that affect this project

These are cheap to fix now and expensive after launch:

| # | Risk | Why it matters here |
|---|---|---|
| 1 | **Admin/instructor login is client-side** with passcodes and default passwords in the JS bundle (`admin123`, `WELILE_ADMIN_2026`, `admin`/`adminpassword`, instructors default to `instructor`). | The new analytics and staff data would be readable by anyone who reads the bundle. **Phase 0 fixes this first.** |
| 2 | **Quiz answers ship to every browser.** `courses.select('*')` returns the full `quiz` JSON including `correctAnswer`. | A certificate that anyone can pass by reading the network tab is worth little. Final-exam grading must move server-side. |
| 3 | **Plaintext passwords** in `profiles.password` / `instructors.password`; admin screens display them. | Remove before we add thousands of free-course users. |
| 4 | **Payment and corporate records are stored in git-tracked JSON files** (`backend/data/*.json`) containing names, emails and phone numbers, and the Render disk is ephemeral. | Privacy exposure, and data can disappear on redeploy. Move to Supabase tables; add to `.gitignore`. |
| 5 | **Wide-open table access.** Backend `/api/data/:table` is unauthenticated generic CRUD; several tables use `USING (true)` policies. | Same as #1 — must be closed before collecting more personal data. |
| 6 | **Tailwind runs from the CDN in the browser** and the whole app ships as a single JS bundle over 500 kB, plus a WebGL "Orb" on the landing page. | This is slow on low-end Android phones on mobile data — exactly our audience. "All screen sizes" starts here. |
| 7 | **Only one Supabase project is evident** (the live one). | We need a staging project so migrations are tested before touching production. |
| 8 | **Data protection.** We will hold personal data of many people, some under 18. | Uganda's Data Protection and Privacy Act (2019) applies. Confirm consent text, retention and minors' handling with counsel. Not legal advice. |

---

## 3. Your lesson material — review and how I'll improve it

### 3.1 What you have

| File | Content | Verdict |
|---|---|---|
| **Lesson 1 deck (23 p)** | Have you used AI today → goal → what AI is (Maps, Translate, bank app) → "3 things AI is not" → AI family → ML (rules vs examples, mango analogy) → deep learning → generative AI → LLMs → next-word demo → hallucination warning → traditional vs generative table → 8-item quiz → one-sentence summary → key words → FAQ. | Strong. Local, plain-language, hands-on. |
| **Lesson 2 deck (22 p)** | Recap → 3-part prompt (context/task/format) → 4 jobs: brainstorm, draft, summarise, automate (each with "Try it now") → refine, don't restart → three checks → what never goes in a chatbot → match-the-job quiz → FAQ. | Strong. The prompt formula is buried; it deserves its own module. |
| **Lesson 3 deck (23 p)** | Win/miss check → hallucinations (+ lawyers 2023, Air Canada 2024) → 3-step fact-check → bias (+ Amazon hiring tool) → 4 habits → privacy (PII, safer habits, 3 rules) → 4 responsible-AI questions → human in the loop → green/amber/red guide + quiz → FAQ. | Very strong. |
| **3 PPTX** | Earlier, thinner versions (10 / 7 / 6 slides), branded "August Freemium Program 2026". | Superseded by the PDFs. I treat the **PDFs as canonical**. |

### 3.2 Gaps and how I'll fix them

| Gap | Fix |
|---|---|
| Decks are **live-facilitated** ("Shout it out", "Who wants to go first?"). | Convert each interaction into an on-screen activity: tap-to-answer polls, "pause and try this prompt" cards, and a discussion prompt in Q&A. |
| **Prompting is thin** (one slide). It is the most useful skill. | New standalone module: context/task/format, examples, role, giving source text, refining, and a prompt-checker exercise. |
| **No tool orientation** — learners don't know *where* to type. | Add a short "Pick a tool and set it up" lesson: free tiers, how to sign in, privacy settings. Stay tool-neutral. |
| **No capstone.** | Module 6 ends with "Your 30-day AI plan" and a personal AI-use rules worksheet (downloadable PDF). |
| **No assessment bank.** | Per-module quizzes (5–8 questions) plus a 40-question pool for the final, all with explanations. |
| **No audio-only / text fallback.** | Every lesson gets a transcript and a one-page summary. Data costs matter in Uganda. |
| Mixed branding ("August Freemium", "Collines T" vs facilitator "Timothy Christian Waniaye"). | Rebrand to one course identity; confirm who is on camera (§11). |
| Time-sensitive claims (Google principles 2018 vs 2025, lawsuit amounts). | I will re-verify every fact and citation when writing scripts, and date-stamp them. |

### 3.3 Proposed course: **AI Fundamentals — Use AI with Confidence**
*Free · Sponsored by Welile Technologies · self-paced, about 6 hours · 7 modules · 24 short videos*

| # | Module | Built from | Videos | Video min | Practice + quiz | Total |
|---|---|---|---|---|---|---|
| 0 | Welcome & how this course works | new | 1 | 4 | 6 | ~10 min |
| 1 | What AI really is | Lesson 1 | 5 | 35 | 25 | ~60 min |
| 2 | How to talk to AI (prompting) | Lesson 2, expanded | 4 | 28 | 27 | ~55 min |
| 3 | Make AI work for you: brainstorm, draft, summarise, automate | Lesson 2 | 5 | 40 | 30 | ~70 min |
| 4 | When AI gets it wrong: hallucinations & fact-checking | Lesson 3 | 3 | 22 | 33 | ~55 min |
| 5 | Fair and private: bias & data privacy | Lesson 3 | 4 | 26 | 29 | ~55 min |
| 6 | Using AI responsibly: green/amber/red & your 30-day plan | Lesson 3 + new | 2 | 15 | 35 | ~50 min |
| — | Final assessment, rating, certificate | new | — | — | 30 | ~30 min |
| | **Total** | | **24** | **≈170 min** | | **≈6 h 25 min** |

**Rules (my recommended defaults):**
- A lesson counts as complete when ≥ 90% of the video is watched (readings: "Mark complete").
- Module quiz: 70% to pass, unlimited retakes, shuffled options, explanations shown.
- Final assessment: 20 questions drawn from a pool of 40, 80% to pass, 3 attempts per 24 hours.
- **Certificate requires:** all lessons complete + all module quizzes passed + final passed.
- Navigation is open (learners can jump around and resume), as on Coursera and HubSpot. The certificate checklist is what enforces completeness.

**Why 24 short videos, not a few 20-minute lessons:** research on MOOC video shows engagement drops sharply as videos get longer (Guo, Kim & Rubin, 2014; the "about 6 minutes" figure is commonly cited, but I couldn't confirm the exact number in the search results). I target **4–9 minutes per video**. It is also easier to re-record one bad lesson than a 20-minute one. If you prefer fewer, longer videos, we can merge — it only changes the scripts.

---

## 4. What Coursera and HubSpot Academy do, and what we copy

I am copying **patterns**, not Coursera's or HubSpot's code, design assets, wording or trademarks.

| Pattern | How the leaders do it | Our version |
|---|---|---|
| **Course landing page** | What you'll learn, modules, time estimate, instructors, rating, "Enroll for free". | `/free/ai-fundamentals`: outcomes, 7-module accordion, hours, sponsor strip, live timetable preview, FAQ, sticky mobile CTA. |
| **Course structure** | Modules contain videos, readings, and graded assignments; a minimum grade (commonly 80%) is needed for the certificate; the certificate doesn't show grades. | Same: 7 modules, 80% final, certificate without grades. |
| **Account first, then learn** | HubSpot: a free Academy account is required to start; certification needs passing a final exam with its own pass mark, time limit and retake policy. | Register to start; final exam with pass mark, time limit, retake policy. |
| **Player layout** | Left outline with check marks, main video, tabs for transcript/notes, "Next" and mark-complete, resume where you left off. | Same; outline becomes a slide-over drawer on phones. |
| **Certificate** | Shareable URL, downloadable/printable, LinkedIn-ready; HubSpot lets you view, download and embed. | Verified public URL + PDF + QR + LinkedIn / WhatsApp share. |
| **Completion is hard** | MOOC completion medians are low (6.5% of enrollees in one analysis, 12.6% in a review of 221 courses). Drop-off is steepest in week 1. A commitment device raised completion by 40% in one study; reminders alone did nothing measurable. | Design for week 1: a quick win in lesson 1, visible progress, a "plan your schedule" commitment step, live sessions as social commitment, and reminders **paired** with it. |

**Where we go beyond them:**
- **Low-bandwidth mode** (default 360p on mobile, audio-only, transcripts) — they don't optimise for UGX data costs.
- **Mobile-money-era local examples** (mobile money PINs, boda boda, Luganda) rather than generic Western ones.
- **Live sessions inside the self-paced course.**
- **Staff-attributed growth** built in.

---

## 5. The learner journey (detailed)

1. **Website hero → "Study AI for Free".** Replaces the Orb/neon-purple hero with a calm photo-led hero (see §9).
2. **Course page** (public, SEO + WhatsApp/Facebook share previews via Open Graph). Contains: promise, what you'll learn, outline, hours, sponsor ("Sponsored by Welile Technologies"), certificate preview, live timetable, FAQ, **[Start studying]**.
3. **Start studying →** if logged out, go to `/signup?course=ai-fundamentals`. The intent is stored in the URL **and** localStorage so it survives email verification and Google sign-in.
4. **Shortened onboarding for this entry:** skip the paid-plan and recommended-courses steps. Collect only name, email/phone, country/district, and "how did you hear about us" (skipped when attribution is already known). Everything else is asked later in the profile.
5. **Auto-enrol** the moment the account is verified; land on the **course home** (outline, progress ring, **Resume**, next live session).
6. **Player:** Lesson video → "Try it now" activity → next lesson → … → module quiz → module celebration → next module.
7. **Final assessment → rating (1–5 + comment) → certificate** with name confirmation first.
8. **After completion:** share the certificate, then "What's next" cards for paid courses (this is where free → paid conversion is measured).
9. **Re-engagement:** email nudges at 24h, day 3, day 7 of inactivity; "next live class" reminders.

**Edge cases I'll handle:** verify email on a different device; Google OAuth return; already-registered user clicking Start (goes straight to Resume); user with an outreach registration (matched by email/phone, not duplicated); resume after clearing browser data (server-side progress).

---

## 6. The player and UX (Coursera-style, all screen sizes)

| Area | Desktop | Phone |
|---|---|---|
| Layout | Outline left (collapsible), video centre, tabs below: **Overview · Transcript · Notes · Q&A · Resources**. | Video pinned at top, tabs beneath, outline as a bottom-sheet. Sticky **Next / Mark complete** bar. |
| Video | Speed, captions, keyboard shortcuts, picture-in-picture, resume position. | Quality auto-selects 360p on mobile data, **Data saver** and **Audio only** toggles. |
| Progress | Ring + per-module checkmarks. | Same, compact. |
| Quiz | Questions with explanations after submit; timer optional; retake. | One-question-at-a-time view for thumbs. |
| Accessibility | WCAG 2.2 AA target: captions on every video, keyboard-complete, visible focus, contrast, reduced motion. | Tap targets ≥ 44 px, no horizontal scroll at 320 px. |
| Offline-ish | Transcripts and one-page summaries downloadable as PDF. | Same. |

I will build the new player as **new components** under `frontend/components/learn/` that share hooks with the existing code, instead of growing the 998-line `CoursePlayer.tsx`. That keeps the paid cohort courses from regressing.

**Responsive test matrix:** 320, 360, 390, 768, 1024, 1440 px; Chrome on low-end Android, Safari on iPhone, desktop Chrome/Edge/Firefox.

---

## 7. Certificate

- **Issued automatically** the moment the checklist is met; created **server-side** so it cannot be forged from the browser.
- **Content:** learner's name (confirmed by them first — spelling is permanent), course title, completion date, unique ID (e.g. `WSAI-FUND-2026-000123`), QR code to the verify page, "Sponsored by Welile Technologies".
- **Signatures:** **Collines Tumwine — CEO, Welile School of AI** and **Benjamin Muhangzi — CEO, Welile Technologies** (names as you gave them; confirm spellings, §11). I need their signature images and the Welile Technologies logo.
- **Public verify page** `/verify/:id`: shows name, course, date, status (valid/revoked). No other personal data.
- **Formats:** PDF (A4, print-ready) + PNG; email copy; "Add to LinkedIn" (LinkedIn's `profile/add` URL takes name, issuer, date, credential ID and URL; **I could not confirm the exact parameter names from official docs, so I will test them in a real session**); WhatsApp / Facebook / X share.
- **Revocation** and re-issue by admin if a name was wrong.
- The existing manual upload-and-verify flow stays for paid courses.

---

## 8. Live classes and timetable

Inside the course: a **Live** tab and a "Next live session" card on the course home.

- **Timetable:** week/list view in **EAT** by default, auto-converted to the viewer's time zone.
- **Per session:** title, host, linked module, time, Meet link, capacity (optional), status.
- **Join button** activates 10 minutes before the start. **Add to calendar** (Google Calendar link + `.ics`).
- **Reminders:** email 24h and 1h before (WhatsApp/SMS is possible later, with a cost; flagged in §11).
- **After class:** admin pastes the recording; it appears as "Missed it? Watch the replay" under the linked module.
- **Suggested rhythm** (you decide): a weekly "Live Clinic" per module, plus one weekend session for people who work weekdays.
- **Attendance** is tracked (join clicks; optional attendance code reusing the existing `validate_livelesson_attendance` RPC) for statistics. It is **not** required for the certificate.
- **Build:** new `live_sessions` table, administered from the admin portal. I will bridge it to the existing `events` table so the site-wide Events page still shows them.
- Meet links are created manually at first (the current backend endpoint is a stub). Calendar-API automation can follow.

---

## 9. Look and feel — "not AI-ish"

You said to change themes if I see fit. My proposal, scoped to the landing and learn areas first, not a whole-site reskin:

- **Calm and editorial:** warm off-white background, near-black ink, generous space, one deep-violet accent for primary actions; lime (already a brand token) as a highlight. **No** neon glow, orbs, sparkles, robots or gradient mesh.
- **Type:** Inter for UI and a readable serif (e.g. Source Serif 4) for headings and certificate — it reads as education/publishing.
- **Imagery:** real learners and classrooms (you already have photos in `/public`), human-scale illustrations.
- **Voice:** plain language, no "unlock your potential", no "AI-powered" slogans. The course teaches AI; the product should feel like a good school.
- **Dark mode** kept (the app already supports it).
- The WebGL `Orb` leaves the hero. It is heavy on cheap phones and is the most AI-cliché element.

---

## 10. Staff referral and attribution

### 10.1 The link
Each staff member gets a permanent link **and** a short vanity link:

```
https://<domain>/r/collines   →   /free/ai-fundamentals   (ref captured, URL cleaned)
```

Also usable for **any** page or course (`/r/collines?to=/discover/<course>`), plus a QR code and one-tap WhatsApp / SMS share text.

### 10.2 Invisible to the student
- `/r/<slug>` is a redirect. The server logs a click, sets a **first-party cookie on our own domain**, and sends the visitor to the clean course page.
- The page then removes any `ref` from the address bar (`history.replaceState`), so what a student copies or screenshots has no tag.
- **Safari/iPhone caveat:** Safari's tracking prevention limits JavaScript-set cookies and `localStorage` to about 7 days in some situations, and link-decorated URLs more aggressively (sources differ on exact limits). So we do **not** rely on browser storage alone:
  1. Server-set first-party cookie (via our own domain) — primary.
  2. `localStorage` copy — fallback.
  3. **Write the ref into the account at the moment of signup** (`signUp` user metadata) — so even if verification happens days later on another device, attribution is already attached.
  4. After verification, a server function `claim_referral` copies it to the profile.

### 10.3 Rules (recommended defaults)
- **First touch wins**, set once, immutable except by admin: `profiles.referred_by_staff_id`, `referral_source`, `referred_at`.
- **Staff-registered students** take priority: the logged-in registrar is recorded automatically.
- **Attribution window:** 90 days from first click.
- **Anti-gaming:** no self-referral (matching email/phone/device), rate limits, duplicate-device flags, and rewards count **qualified conversions**, not raw signups.
- **Suggested scoring for the leaderboard** (you set the real values): verified signup = 1, started a lesson = 2, completed course = 5, enrolled in a paid course = 20. This rewards staff who bring people who actually learn and buy.

### 10.4 Staff portal (`/staff`, role `STAFF`)
Staff become **real Supabase users** with role `STAFF` (today they are only roster rows). Seed from `outreach_staff`; admin invites by email.

| Feature | Notes |
|---|---|
| My link, QR, share buttons | Plus UTM variants per channel (WhatsApp, Facebook, flyer…). |
| My results | Clicks → signups → started → completed → paid, by week. |
| My students | Only their own: name, progress, last active, status. |
| **Register a student** | Short form: name, email, phone, course (free **or** paid), campaign. Creates a pending registration and emails the student a set-password / start link. The registering staff is stamped automatically. Works offline using the existing sync queue. |
| Leaderboard | Opt-in visibility; period filters. |
| Lead follow-up | Statuses (new → contacted → enrolled), reusing the registrations CRM. |

Existing `outreach_registrations` stays the CRM for paper-form/outreach paid enrolments; I add `profile_id` / `source` so one person is not counted twice.

---

## 11. Admin analytics — what we measure and why

Everything is derived from server-side data (§12), not `localStorage`.

### 11.1 Headline funnel (the one chart that matters)

```
Link clicks / landing views
  → "Start studying" clicks
    → Account created
      → Email verified & enrolled
        → Started (≥1 lesson watched)          ← activation
          → Reached Module 1 … 6 (per module)
            → Final assessment passed
              → Certificate issued → shared
                → Enrolled in a paid course
```

### 11.2 Metric dictionary

| Group | Metrics | Why |
|---|---|---|
| **Acquisition** | Signups/day & week; by source (website, staff, outreach, social/UTM); by staff; by district/country; age band; institution. | Which channels and people produce learners. |
| **Activation** | % started within 24h / 7 days; time from signup to first lesson. | The biggest leak in MOOCs is week 1. |
| **Progress** | Learners per module reached; lessons completed; stalled learners (no activity 7d) with one-click nudge. | Shows the "levels" you asked about. |
| **Learning quality** | Quiz attempts & pass rate per module; **per-question difficulty** (flag < 30% or > 95% correct); average attempts; final-exam pass rate. | Finds bad questions and confusing lessons. |
| **Video** | Watch % per lesson; **drop-off curve by lesson**; replays; device split; data-saver/audio-only usage. | Tells you which video to re-record. |
| **Completion** | Completion rate (7 / 14 / 30 days); certificates issued; median days and active hours to finish. | Core success KPI. Benchmark context in §4. |
| **Satisfaction** | End-of-course rating, per-lesson thumbs, comments, Q&A volume. | Quality signal. |
| **Live** | Registrations vs attendance per session; replay views; attendance → completion correlation. | Whether live sessions help. |
| **Growth / business** | **Staff leaderboard**; free → paid conversion; certificate shares and verify-page views; cohort retention (signup-week → completion). | Rewards, ROI, upsell. |
| **Sponsor report** | Reach, learners, completions, certificates, geography — **aggregated, no personal data** — exportable PDF/CSV for Welile Technologies. | They're funding it. |

### 11.3 The dashboard
KPI strip → funnel → module drop-off bars → source and staff tables → live-session table → searchable **learner table** with per-learner timeline drawer → CSV export. Date range and period-over-period comparison. Live counters via Supabase Realtime. Charts with `recharts` (already installed, currently unused in admin).

---

## 12. Technical design

### 12.1 New data (Supabase, in migrations, with RLS)

| Table | Purpose |
|---|---|
| `learn_courses`, `learn_modules`, `learn_lessons` | Normalised content with **stable lesson IDs** (the current JSON blob makes per-lesson analytics fragile). Seeded from files in `content/ai-fundamentals/` so scripts, quizzes, transcripts are versioned in git. |
| `quiz_questions` (+ options) | Correct answers **never sent to the browser**. |
| `lesson_progress` | user, lesson, watched seconds, % , completed_at, last position. |
| `quiz_attempts` | user, quiz, answers, score, passed, attempt no., created_at (graded by RPC). |
| `learning_events` | Append-only: `lesson_started`, `lesson_completed`, `video_progress`, `quiz_submitted`, `live_joined`, etc., with device, session id. Feeds the dashboard. |
| `certificates` | id, user, course, issued_at, name_on_cert, status, verify code. |
| `live_sessions`, `live_rsvps` | Timetable and attendance. |
| `staff_members` | user_id, staff_code, slug, active (links to `outreach_staff`). |
| `referral_clicks` | staff, time, landing, hashed UA/IP. |
| `profiles` additions | `referred_by_staff_id`, `referral_source`, `referred_at`, `registered_by_staff_id`, `signup_source`. |
| `course_ratings` | rating + comment. |

**Server logic** (RPC / Supabase Edge Functions, not browser code): `submit_quiz`, `issue_certificate`, `claim_referral`, `record_event`, staff-scoped read views, `is_admin()`/`is_staff()` helpers used by RLS.

### 12.2 Frontend
- New routes: `/free/ai-fundamentals`, `/learn/:course`, `/learn/:course/:lesson`, `/verify/:id`, `/r/:slug`, `/staff/*`.
- New admin sections in **both** `admin-portal/` and `frontend/components/admin/` (the duplication means every admin change needs both; I'll extract the new pages into one shared source to avoid worsening the drift).
- Route-level **code-splitting**; move Tailwind from CDN to a build step (I'll do this on its own branch with a visual check, since the dark-mode CSS overrides in `index.html` depend on it).

### 12.3 Video hosting (decision needed)
| Option | Pros | Cons |
|---|---|---|
| YouTube unlisted (works today via `videoId`) | Free, zero setup. | Branding, suggestions, can be blocked, weak analytics, no real quality control. |
| **Bunny Stream or Cloudflare Stream (recommended)** | Adaptive HLS (low-bandwidth friendly), signed URLs, per-video analytics, captions, no suggestions. | Small monthly cost (I haven't verified current prices). |

### 12.4 Environments and process
- **Create a staging Supabase project** and test every migration there first. **I will not run migrations against the live project without your explicit go-ahead.**
- Feature branches + PRs; no commits or pushes without your say-so.
- First automated tests in the repo: signup → enrol → complete → certificate; referral attribution; RLS checks.

---

## 13. Phases

Sizes: **S** ≈ 1–2 days, **M** ≈ 3–5 days, **L** ≈ 1–2 weeks (rough, one engineer).

| Phase | Scope | Size | Output you can see |
|---|---|---|---|
| **0 — Safety foundations** | Real admin/instructor auth with roles; RLS baseline; remove plaintext passwords; move payment/corporate JSON to the DB and `.gitignore` it; staging Supabase. | M | Admin login that can't be bypassed. |
| **1 — Data & content model** | Migrations, seed pipeline, event + progress tables, server-side quiz grading. | M | Course content loads from the DB. |
| **2 — Front door** | New hero, public course page, shortened signup → auto-enrol, **referral capture (`/r/:slug`)**. | M | Staff can start sharing links; attribution is recorded from day one. |
| **3 — Learn experience** | Course home, player, quizzes, final assessment, rating, **certificate + verify page**. | L | Full learner journey; placeholder videos until recordings land. |
| **4 — Live timetable** | Table, admin scheduling, timetable UI, reminders, calendar links, replays. | M | Live tab working. |
| **5 — Staff portal + analytics** | Staff accounts, assisted registration, leaderboard, admin dashboard, sponsor report. | L | Dashboard and leaderboard. |
| **6 — Polish & launch** | Accessibility pass, performance budget, responsive QA, email nudges, load test, launch checklist. | M | Go-live. |

**Order logic:** Phase 2 comes early because every day of link sharing before attribution exists is data we can't recover. Videos are being recorded in parallel; the player ships with "coming soon" states and swaps in real video IDs as each lesson is uploaded.

**Suggested launch cut:** Phases 0–3 + the referral capture and a basic stats page = a launchable v1. Staff portal, full analytics and live timetable follow immediately after.

---

## 14. Scripts and recordings (separate response)

For each of the 24 videos you'll get: objective, target length, on-screen slide cues (reusing your decks), the **word-for-word script** (≈130–150 words/min → ~6-minute video ≈ 800–900 words), examples with local context, the live demo steps to perform on screen, a "pause and try" prompt, a recap line, and a bridge to the next lesson. Each module also gets its quiz bank with explanations, a key-words sheet and a transcript-ready text. Plus: the final exam pool, the capstone worksheet and certificate wording.

---

## 15. Decisions I need from you (with my recommended default)

| # | Decision | Default if you say "go" |
|---|---|---|
| 1 | Exact certificate names, titles and spellings (**Collines Tumwine**, **Benjamin Muhangzi**); signature images; Welile Technologies logo and sponsor wording. | Use as written; placeholder signatures until supplied. |
| 2 | Who is on camera? The decks credit **Timothy Christian Waniaye** (PDFs) and "Collines T" (PPTX). | One presenter, confirmed by you. |
| 3 | Pass marks and retakes. | Module 70% unlimited; final 80%, 3 attempts / 24h. |
| 4 | Referral rewards: what counts, values, window, visibility of leaderboard. | Scoring in §10.3, 90 days, opt-in visibility. |
| 5 | Must students have an email? (needed for login, certificate, reminders) | **Yes** for the free course. Phone-only walk-ins get an invite link by email later. |
| 6 | Video host and budget. | Bunny/Cloudflare Stream. |
| 7 | Domain and short-link domain; email sender for transactional mail. | Same domain, `/r/slug`; a transactional provider (e.g. Resend). |
| 8 | Live schedule: days, times, host, who creates Meet links. | Weekly Live Clinic + one weekend session. |
| 9 | Reminders by WhatsApp/SMS (costs money) or email only. | Email now, WhatsApp/SMS later. |
| 10 | Tailwind CDN → build migration now (touches the whole UI). | Yes, on its own branch with visual checks. |
| 11 | Staging Supabase project: can I create one, or will you? | I draft the setup; you create the project. |
| 12 | Consent and privacy text, handling of under-18s, data retention. | Draft for counsel's review. |

---

## 16. What I will not do without your go-ahead

- Run any migration on the live Supabase project, or change production env vars.
- Commit, push, or open PRs.
- Send any emails or messages to students or staff.
- Reskin existing paid-course pages beyond what the free course needs.

---

## Sources

- Coursera structure, 80% pass mark and certificate sharing (third-party summaries; Coursera's own help pages weren't in the results): [Google Certificates on Coursera](https://help.pathstream.com/en/articles/11868512-google-certificates-on-coursera), [Course Certificate (NUS wiki)](https://nus.atlassian.net/wiki/x/TlQrAg), [Coursera — Wikipedia](https://Www.Wikipedia.org/wiki/Coursera)
- HubSpot Academy: free account, final exam with pass mark / time limit / retake policy, shareable certificate: [HubSpot Academy certifications](https://academy.hubspot.com/certification), [HubSpot Service Hub Certification](https://academy.hubspot.com/courses/hubspot-service-software)
- LinkedIn "Add to profile" parameters (unofficial; to be tested): [URL builder](https://certificate.facepaintingschool.com/linkedin-add-to-profile-url-builder)
- MOOC completion benchmarks and week-1 drop-off: [Course completion rates](https://resources.rework.com/libraries/edtech-growth/course-completion-rates), [Retention and intention in MOOCs (EDUCAUSE)](https://er.educause.edu/articles/2013/6/retention-and-intention-in-massive-open-online-courses-in-depth), [Penn GSE](https://www.gse.upenn.edu/news/new-study-shows-few-moocs-students-follow-through)
- Video length and engagement: [Guo, Kim & Rubin (2014)](https://www.cs.rochester.edu/hci/pubs/pdfs/edX-MOOC-video-production-and-engagement_LAS-2014.pdf)
- Referral attribution and Safari ITP limits (vendor sources, limits vary by source): [Safari ITP and affiliate attribution](https://www.scaleo.io/blog/safari-itp-is-killing-affiliate-program-attribution/), [Cookies and storage](https://www.referly.so/docs/developer-documentation/tracking/cookies-and-storage)
