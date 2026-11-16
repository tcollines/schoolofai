# Cohorts, reminders and sales agents: how to use it

## 1. Cohorts and weekly groups (nothing to set up)
- **Cohort** = the month of a live week (for example "November 2026").
- **Group** = one run of the Monday, Wednesday and Friday live classes. It is identified by that week's Monday.
- A learner is placed in the **first group whose opening class had not started** when they enrolled. Someone who registers after Monday's class goes to next week's group.
- Everyone gets the **recorded course immediately** and can **join any live class** in any week. The group only decides who is **reminded**.
- It is computed, not stored, so it never goes out of date. As soon as you publish the next week's sessions, the people waiting for them are placed and sent a welcome email with their timetable.

**Your weekly job:** Admin > Live Classes > create the Monday, Wednesday and Friday sessions for the coming week with **Visible to students** ticked. Nothing else.

See group sizes: Admin > Staff & Links > "Cohorts and weekly groups".

## 2. Reminders (automatic)
| Email | Who gets it |
|---|---|
| 24 hours before | Everyone in that week's group |
| 15 minutes before | Everyone in that week's group |
| 8:00 am on the day | Only group members who have **not opened the course that week** |
| Welcome + timetable | Anyone who joined after a group started (once) |

Nobody is emailed about a class if they: already attended that lecture (Monday = lecture 1, Wednesday = lecture 2, Friday = lecture 3), finished the course, or switched reminders off. Every email has a **one-click "turn off live-class reminders"** link. Learners can also change this on their Live classes page.

## 3. Making someone a sales agent
Agents start as normal students.
1. They register on the website like any student.
2. Admin > Staff & Links > **Make a student a sales agent** > enter their email > Make agent.
3. They immediately get: a personal sign-up link `https://www.welileschoolofai.org/join/<their-name>` and the **Agent portal** (new item in their left menu, or `/staff`).

To remove an agent, press **Deactivate** next to their name. Their past numbers stay.

## 4. What an agent does
**A. Share the quick sign-up link.** Agent portal > Overview > Quick sign-up link (copy, WhatsApp or QR). The client sees a very short form: name, email, phone, password, and the course they want (free AI Fundamentals first, other courses in the list). They confirm their email and are counted for that agent automatically.

**B. Open an account for a client in the portal.** Agent portal > Register a student. Fill in name, phone, email, tick consent. Leave "Open their account now" ticked, tap **Generate** for a temporary password, and register. The screen then shows the temporary password and a **Send sign-in details on WhatsApp** button.
- The client gets a confirmation email, signs in with the temporary password, and is **forced to choose their own password** straight away.
- The free course opens for them automatically.
- If the client has no email, untick "Open their account now": they are saved as a lead and can sign up later with the agent's link.

## 5. Stats
- **Agents** (Agent portal > Overview): link clicks, registered, accounts opened, in the free course, studying the recorded lessons, joined a live class, active in 7 days, completed and certified, plus a count by course.
- **You** (Admin > Staff & Links > Agent performance): the same columns for every agent side by side.

## 6. Good to know
- Agent-created accounts need the client to confirm their email before first sign-in (this proves the email is real).
- For paid courses the agent records interest and the account; payment and enrolment still go through the normal course process.
- Rotate the Gmail app password soon: it was pasted in chat. Update it in Supabase (Auth > SMTP) and in GitHub as `SMTP_PASS`.
