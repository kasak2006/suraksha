# Playbook sources & citations

Every helpline number, URL and factual claim used in the guided playbooks
(`lib/engine/playbooks.ts` + `messages/*.json` → `playbook.*`) is listed here with
its source, per the honest-engineering rule (spec §9.7 — no fabricated helplines,
URLs, or statistics). Verify these are still current before each submission.

| Fact used in the app | Source |
|---|---|
| **1930** — National Cyber Crime Helpline (report financial cyber fraud) | Indian Cyber Crime Coordination Centre (I4C), Ministry of Home Affairs — https://cybercrime.gov.in (helpline 1930) |
| **cybercrime.gov.in** — National Cyber Crime Reporting Portal | Ministry of Home Affairs, Government of India |
| **"Golden hour"** — reporting a cyber-financial fraud quickly (ideally within the first hour) improves the chance of freezing/recovering funds | I4C / RBI public awareness messaging on the Citizen Financial Cyber Fraud Reporting and Management System |
| **Banks never ask for OTP/PIN/CVV** | RBI / NPCI public "do not share" awareness guidance |
| **Entering a UPI PIN only debits (sends) money; receiving never needs a PIN** | NPCI UPI product behaviour / NPCI safe-UPI awareness |
| **A genuine lender does not take an advance fee to release a loan** | RBI caution on advance-fee loan fraud |

Notes:
- 1930 and cybercrime.gov.in are the two channels the app tells users to use; both
  are official Government of India channels for cyber-financial fraud.
- The app never invents bank phone numbers — it always tells the user to call the
  number printed on their own card/passbook, never one from the scam message.
