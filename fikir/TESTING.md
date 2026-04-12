# EUEE Prep App — manual testing (Phase 14)

Use this checklist before releases. Run **backend** (`npm run dev` or `node src/index.js` from `backend/`) and **frontend** (`npm run dev` from `frontend/`) with a valid `.env` (PostgreSQL, `JWT_SECRET`, optional `GROQ_API_KEY`, Cloudinary vars for uploads).

---

## 1. Signup → Onboarding → Dashboard

1. Open the app, choose **Sign up**, enter name (or fullName), email, password (≥ 8 chars).
2. Confirm you land on **onboarding** (profile, preferences, diagnostic, complete).
3. Finish each step; verify **Dashboard** loads with sidebar and no console errors.
4. **Negative:** invalid email or short password should show a clear API/validation error (not a stack trace).

---

## 2. Daily study session (lesson + mark complete)

1. Go to **Subjects** → pick a subject → open a **lesson**.
2. For a video lesson, confirm the player/embed loads; for text, confirm content renders.
3. Mark **Complete**; confirm success feedback and progress updates on the subject list.
4. Re-open the same lesson; completed state should persist after refresh.

---

## 3. Adaptive practice test

1. Open **Practice**, start a **subject** or **topic** session (topic requires a topic string).
2. Answer several questions (include at least one wrong and one skip if the UI allows).
3. **Complete** the session; confirm results/summary and that the app returns to a stable state.
4. **Optional:** start a **mock** session (no single subjectId required server-side).

---

## 4. AI chatbot

1. Ensure `GROQ_API_KEY` is set; open the in-app **tutor/chatbot**.
2. Send a short EUEE-related question; confirm a reply appears and history loads on reload.
3. **Negative:** with no API key, expect a friendly “not configured” style message (503).
4. Rapid sends should eventually hit **rate limiting** (HTTP 429-style response); message should be readable.

---

## 5. Study plan generation

1. Open **Study Plan**; submit **exam date** (YYYY-MM-DD), **hours per week** (3–60), optional preferences.
2. With Groq configured, confirm a plan with tasks appears; without Groq, confirm a clear configuration error.
3. Mark a **task complete**; confirm it updates and does not error on repeat.

---

## 6. File upload to Cloudinary

1. Open **Resources** (or equivalent upload UI).
2. Upload a small PDF or image under the size limit; confirm it appears in the list with metadata.
3. **Negative:** oversized or wrong MIME should show a controlled error (not a raw multer stack in the UI).
4. **Rate limit:** many uploads in a short time may return a limit message.

---

## 7. Notifications

1. After **login**, **lesson complete**, or **practice complete**, check the **notification bell**.
2. Open the dropdown; use **keyboard** (Tab / Escape) if applicable.
3. Mark one notification read and **mark all read**; counts should update.
4. Confirm notifications persist or clear as designed after refresh.

---

## Automated tests (future)

Critical files include `// TEST:` comments pointing at good unit/integration targets: `authController.js`, `practiceController.js`, `chatbotController.js`, `resourceController.js`, `studyPlanController.js`, `onboardingController.js`. Add Jest/Vitest + supertest when you introduce a test runner.
