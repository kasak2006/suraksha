# Corpus labelling guide — Suraksha

**Target: 1,200 rows.** ~400 Gujarati, ~400 Hindi, ~400 English. Roughly 50/50 scam vs legitimate in each language.

If five people do 240 rows each, this is done in three days. Do not skip the legitimate half — a model trained mostly on scams flags everything and is worse than useless.

---

## File format

One JSON object per line in `data/corpus.jsonl`. No commas between lines, no wrapping array.

```json
{"id":"gu-0001","text":"તમારું KYC આજે સમાપ્ત થાય છે...","lang":"gu","label":"scam","archetype":"kyc-expiry","tactics":["urgency","authority","fear"],"source":"authored","notes":""}
```

### Fields

| Field | Values | Notes |
|---|---|---|
| `id` | `gu-0001`, `hi-0001`, `en-0001` | Prefix by language, zero-padded to 4. Each labeller takes a reserved block (see below). |
| `text` | the raw message | Verbatim. Keep typos, keep mixed script, keep the broken grammar — that's signal. |
| `lang` | `gu` `hi` `en` `mixed` | Use `mixed` for genuine code-mixing (Hinglish/Gujlish), not for a stray English word. |
| `label` | `scam` `legit` | Binary. See the decision rule below. |
| `archetype` | see list | `null` for legit rows. |
| `tactics` | array | Only for scam rows. Pick every axis that genuinely applies, usually 2–4. |
| `source` | `authored` `received` `public` `adapted` | Provenance. See below. |
| `notes` | free text | Anything a reviewer should know. Optional. |

### `source` values
- `authored` — you wrote it, modelled on a real scam type
- `received` — a real message someone actually got (**anonymise first**, see below)
- `public` — from a public dataset or an official awareness campaign
- `adapted` — a real message you translated or modified

---

## The label decision rule

**`scam`** — the message is trying to make the reader lose money, hand over credentials, or install something. Intent to defraud.

**`legit`** — everything else, *including annoying but honest messages*. Real bank alerts, real OTP delivery, real promotional offers from actual companies, delivery notifications, bill reminders, political/marketing SMS.

The hard part: **marketing spam is `legit`.** "50% off at Big Bazaar this weekend" is junk, but nobody loses their savings. If you label spam as scam, you build a spam filter instead of a fraud detector, and the whole project's premise collapses.

When you genuinely can't decide, label `legit` and write why in `notes`. A borderline row labelled scam does more damage than one labelled legit.

---

## Archetypes

Use exactly these strings.

| Archetype | What it is |
|---|---|
| `kyc-expiry` | Update/verify KYC or the account gets blocked |
| `upi-collect` | Approve a request / enter PIN "to receive" money |
| `refund-reversal` | "Sent by mistake, please return it" |
| `digital-arrest` | Fake police/CBI/court, threat of arrest, demand for secrecy |
| `courier-parcel` | Parcel held, illegal contents, pay or face action |
| `electricity-bill` | Power will be disconnected tonight, pay now |
| `army-officer` | Fake armed-forces buyer on OLX/marketplace |
| `loan-advance-fee` | Processing/GST/insurance fee before disbursal |
| `job-task` | Work-from-home, task/investment scam, upfront registration |
| `lottery-prize` | KBC, lucky draw, prize you never entered |
| `sim-swap` | SIM will be deactivated, share details |
| `card-upgrade` | Credit-limit upgrade, reward-point expiry |
| `investment-trading` | Guaranteed returns, trading group, doubling money |
| `qr-receive` | Scan this QR to *receive* money |
| `phishing-link` | Generic credential-harvesting link, no clear archetype |
| `other` | Real scam, none of the above — describe in `notes` |

---

## Tactic axes

Only for scam rows. Use these exact strings:

`urgency` · `authority` · `fear` · `reward` · `secrecy` · `credential` · `trust` · `irreversibility`

Quick definitions:
- **urgency** — manufactured deadline, "within 24 hours", "today only"
- **authority** — claims to be a bank, RBI, police, government, telecom
- **fear** — threat of loss, blocking, arrest, legal action
- **reward** — prize, refund, cashback, subsidy, easy money
- **secrecy** — don't tell family/bank/police; isolation from help
- **credential** — asks for OTP, PIN, CVV, password, or remote-access install
- **trust** — fake familiarity, spoofed known name, long rapport-building
- **irreversibility** — pushes toward UPI, crypto, gift cards — rails that can't be reversed

Most scams score 2–4. If you're tagging six, you're probably over-reading.

---

## Getting real messages (`source: received`)

The most valuable rows. Ask family, hostel friends, neighbours, shopkeepers — anyone. WhatsApp forwards count.

**Anonymise before the row goes in the file:**
- Replace real phone numbers with `98XXXXXXXX`
- Replace real names with `[NAME]`
- Replace account/card digits with `XXXX1234`
- Replace real amounts only if they'd identify someone; otherwise keep them, amounts are signal
- Keep scam URLs verbatim — they're the point. Do not visit them.

Do not record who gave you the message. Nothing in the corpus should trace back to a person.

---

## Getting legitimate messages

Easier than you think and just as important. Sources:

- Your own inbox: bank alerts, OTP deliveries, UPI credit/debit notifications, delivery updates, bill reminders, appointment confirmations
- Real promotional SMS from real companies
- Genuine government SMS (vaccination, subsidy, exam results)

Deliberately include the **hard negatives** — legitimate messages that superficially look like scams:

- A real OTP SMS that says "do not share this with anyone" *(this already broke our secrecy rule once — we need these in the corpus)*
- A real bank asking you to update KYC at the branch
- A real "₹500 credited to your account" alert
- A real loan pre-approval from a bank you actually have an account with
- A real delivery message asking for your area PIN code

These are where the model earns its keep. Aim for **at least 15% of your legit rows to be hard negatives.**

---

## Writing authored rows

When you can't find a real one, write it — but write it as it would actually arrive, not as a textbook example.

Good: `SBI Alert: Aapka KYC 24 ghante me expire ho raha hai. Turant update karein http://sbi-kyc.verify-in.xyz warna account block ho jayega.`

Bad: `This is a scam message asking you to update your KYC urgently with a suspicious link.`

Rules for authored rows:
- Real-length. Most scam SMS are 100–250 characters.
- Include the artefacts: shortened URLs, sender-ID style prefixes, broken capitalisation, missing punctuation
- Vary the phrasing. Ten rows that all say "તાત્કાલિક" teach the model one word, not one concept.
- Code-mix the way people actually do — Hindi/Gujarati in Latin script is extremely common in real scam SMS

**Gujarati and Hindi rows must be written or reviewed by a native speaker.** Machine-translated rows will teach the model translationese and a Gujarati juror will spot it instantly. If you write a row you're unsure of, put `TODO-review` in `notes`.

---

## ID blocks

Reserve a block before you start so nobody collides:

| Labeller | Gujarati | Hindi | English |
|---|---|---|---|
| Person 1 | gu-0001–0080 | hi-0001–0080 | en-0001–0080 |
| Person 2 | gu-0081–0160 | hi-0081–0160 | en-0081–0160 |
| Person 3 | gu-0161–0240 | hi-0161–0240 | en-0161–0240 |
| Person 4 | gu-0241–0320 | hi-0241–0320 | en-0241–0320 |
| Person 5 | gu-0321–0400 | hi-0321–0400 | en-0321–0400 |

Each person keeps their own `.jsonl` file; concatenate at the end.

---

## Quality checks before training

Run `python scripts/validate_corpus.py` (in the notebook). It checks:

- Every line is valid JSON with all required fields
- No duplicate `id`
- No duplicate or near-duplicate `text`
- `archetype` and `tactics` use only the allowed strings
- `archetype` is null exactly when `label` is `legit`
- Per-language and per-label counts are roughly balanced
- Flags any row under 20 characters

**Double-label a sample.** Have two people independently label the same 50 rows and compare. If you disagree on more than about 10%, your definitions have drifted — fix the guide before labelling another 1,000 rows. Report this agreement number in the README; juries take it as a sign you know what you're doing.
