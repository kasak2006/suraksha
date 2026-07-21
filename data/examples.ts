/*
 * Three realistic seeded scams (spec §5.1) — one written in each language — so
 * a judge can demo without typing Gujarati. The text is the scam itself and is
 * the same regardless of the UI locale; only the button label is translated.
 * Each is crafted from real Indian scam patterns and lands at DANGER.
 */

export interface ScamExample {
  /** Matches messages `home.examples.<id>`. */
  id: "gu" | "hi" | "en";
  text: string;
}

export const scamExamples: readonly ScamExample[] = [
  {
    id: "gu",
    // KYC-expiry SMS: lookalike link + OTP ask + same-day deadline.
    text: "પ્રિય ગ્રાહક, તમારું SBI ખાતું આજે બંધ થઈ જશે. KYC પૂર્ણ કરવા આ લિંક પર ક્લિક કરો http://sbi-kyc-verify.xyz અને તમારો OTP તાત્કાલિક આપો.",
  },
  {
    id: "hi",
    // KBC lottery: prize bait + urgency + processing fee + OTP ask.
    text: "बधाई हो! KBC लकी ड्रॉ में आपने 25,00,000 रुपये जीते हैं। इनाम पाने के लिए अभी 4999 रुपये फीस भरें और अपना बैंक OTP शेयर करें।",
  },
  {
    id: "en",
    // Loan advance-fee: no-documents + processing fee + fake RBI approval.
    text: "Congratulations! Your loan of Rs 5,00,000 is pre-approved with no documents and instant approval. Pay Rs 2,999 processing fee to release the funds. We are an RBI approved lender.",
  },
];
