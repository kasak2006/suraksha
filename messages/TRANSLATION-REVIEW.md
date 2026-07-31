# Translation review ledger

JSON can't carry comments, so pending-native-review strings are tracked here.
Every Gujarati/Hindi string written by the build agent starts as
`TODO(gu-review)` / `TODO(hi-review)` and is flipped to `reviewed` by a native
speaker before submission (spec §4.5: "have the Gujarati-fluent teammate review
every line").

| Key | gu | hi | Notes |
|---|---|---|---|
| `app.name` | TODO(gu-review) | TODO(hi-review) | |
| `app.tagline` | TODO(gu-review) | TODO(hi-review) | |
| `languages.switchLabel` | TODO(gu-review) | TODO(hi-review) | |
| `layout.skipToContent` | TODO(gu-review) | TODO(hi-review) | |
| `footer.disclaimer` | TODO(gu-review) | TODO(hi-review) | Appears on every screen — review first. Passbook/branch phrasing for card-less Jan Dhan users. |
| `home.*` (heading, subheading, input/tiles/examples labels — 15 keys) | TODO(gu-review) | TODO(hi-review) | Example *labels* only; the seeded scam texts live in `data/examples.ts`. |
| `check.*` (bands, verdictLine, headings — 20 keys) | TODO(gu-review) | TODO(hi-review) | verdictLine.danger is the spoken/plain verdict — must read naturally. |
| `reasons.credential.*` (3 keys) | TODO(gu-review) | TODO(hi-review) | |
| `reasons.upi.*` (5 keys) | TODO(gu-review) | TODO(hi-review) | collectToReceive teaches the §5.4 invariant — review carefully. |
| `reasons.url.*` (9 keys) | TODO(gu-review) | TODO(hi-review) | |
| `reasons.loan.*` (3 keys) | TODO(gu-review) | TODO(hi-review) | rbiClaim cites the RBI NBFC list — keep the guidance accurate. |
| `reasons.impersonation.*` (3 keys) | TODO(gu-review) | TODO(hi-review) | digitalArrest phrasing must not itself frighten — review tone. |
| `reasons.urgency.*` (2 keys) | TODO(gu-review) | TODO(hi-review) | |
| `reasons.reward.*` (3 keys) | TODO(gu-review) | TODO(hi-review) | |
| `reasons.textual.*` (3 keys) | TODO(gu-review) | TODO(hi-review) | |
| `data/examples.ts` gu + hi scam texts | TODO(gu-review) | TODO(hi-review) | Seeded demo scams — must read like real Gujarati/Hindi scam SMS, not translations. |
| `pwa.*` (5 keys) | TODO(gu-review) | TODO(hi-review) | Install/offline banners (Phase 4). |
| `call.*` (~24 keys) | TODO(gu-review) | TODO(hi-review) | Call guard (Phase 4). `dangerWarning` is spoken aloud — must read naturally and calmly. `honestyNote` states the speakerphone constraint (§9). |
| `learn.*` (~22 keys) | TODO(gu-review) | TODO(hi-review) | Drill UI (Phase 4). Non-shaming tone (§8): `wrong` must not scold. |
| `lessons.*` (otp/receiveNoPin/checkLender, 8 keys) | TODO(gu-review) | TODO(hi-review) | TTS-read micro-lessons (Phase 4) — must sound natural spoken aloud. |
| `data/drills.ts` gu + hi cards (`gu-d*`, `hi-d*`, 8 cards) | TODO(gu-review) | TODO(hi-review) | Authored drill cards — must read like real Gujarati/Hindi messages, not translations. |
