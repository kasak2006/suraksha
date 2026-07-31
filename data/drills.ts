import type { ArchetypeId } from "@/lib/engine/archetypes";
import type { TacticAxis } from "@/lib/engine/tactics";

/*
 * The "Scam or Safe?" drill deck (spec §5.6). Each card is a realistic message
 * the user judges by swiping/tapping Safe or Scam. Cards carry an `archetype`
 * and `tactics` so the adaptive scheduler (lib/learn/scheduler.ts) can serve
 * more of what the user gets wrong.
 *
 * The English cards are drawn verbatim from data/corpus.jsonl (the published,
 * quality-controlled dataset). The Gujarati/Hindi cards are authored here and
 * are pending native review — see messages/TRANSLATION-REVIEW.md. Legit cards
 * (hard negatives — real bank alerts, OTP notices) matter as much as the scams:
 * without them the drill would teach "everything is a scam".
 */

export interface DrillCard {
  id: string;
  text: string;
  lang: "gu" | "hi" | "en";
  isScam: boolean;
  /** Present on scam cards; null on legit cards. */
  archetype: ArchetypeId | null;
  tactics: TacticAxis[];
}

export const drillDeck: readonly DrillCard[] = [
  // --- English scams (from corpus) ---
  {
    id: "en-0001",
    text: "Dear customer, your SBI account will be blocked today as KYC is expired. Update now http://sbi-kyc.verify-in.xyz to avoid suspension.",
    lang: "en",
    isScam: true,
    archetype: "kyc-expiry",
    tactics: ["urgency", "authority", "fear"],
  },
  {
    id: "en-0004",
    text: "Pre-approved personal loan of Rs 5 lakh at 2% interest. No documents needed. Pay Rs 3999 processing fee to release amount. RBI approved lender.",
    lang: "en",
    isScam: true,
    archetype: "loan-advance-fee",
    tactics: ["reward", "authority"],
  },
  {
    id: "en-0005",
    text: "I sent Rs 5000 to your UPI by mistake. Please approve the request I am sending and return the money. I am a poor man please help.",
    lang: "en",
    isScam: true,
    archetype: "refund-reversal",
    tactics: ["trust", "irreversibility"],
  },
  {
    id: "en-0007",
    text: "This is CBI officer speaking. A parcel in your name contains illegal items. You are under digital arrest. Do not tell anyone including family until verification is complete.",
    lang: "en",
    isScam: true,
    archetype: "digital-arrest",
    tactics: ["authority", "fear", "secrecy"],
  },
  {
    id: "en-0009",
    text: "Scan this QR code to receive your refund of Rs 2400 from Flipkart. Enter your UPI PIN to confirm the credit.",
    lang: "en",
    isScam: true,
    archetype: "qr-receive",
    tactics: ["reward", "credential", "irreversibility"],
  },
  {
    id: "en-0011",
    text: "Your credit card limit has been upgraded to Rs 8 lakh. To activate, install AnyDesk and share the screen with our executive for verification.",
    lang: "en",
    isScam: true,
    archetype: "card-upgrade",
    tactics: ["reward", "credential", "authority"],
  },
  {
    id: "en-0013",
    text: "Customs has held your parcel due to prohibited contents. Pay clearance fee Rs 8500 within 2 hours or FIR will be registered against you.",
    lang: "en",
    isScam: true,
    archetype: "courier-parcel",
    tactics: ["authority", "fear", "urgency"],
  },
  {
    id: "en-0018",
    text: "You have a pending UPI collect request of Rs 4999 from RAHUL. Approve it to receive your Flipkart refund. Enter your UPI PIN to accept the credit before it expires.",
    lang: "en",
    isScam: true,
    archetype: "upi-collect",
    tactics: ["reward", "credential", "irreversibility"],
  },

  // --- English legit (hard negatives, from corpus) ---
  {
    id: "en-0101",
    text: "Rs 500.00 credited to your A/c XXXX1234 on 12-07-26 by UPI Ref 553412887. Available balance Rs 8412.55 -SBI",
    lang: "en",
    isScam: false,
    archetype: null,
    tactics: [],
  },
  {
    id: "en-0102",
    text: "124578 is your OTP for login. Valid for 10 minutes. Do not share this OTP with anyone including bank staff. -HDFC Bank",
    lang: "en",
    isScam: false,
    archetype: null,
    tactics: [],
  },
  {
    id: "en-0103",
    text: "Your KYC is due for periodic update. Please visit your nearest branch with ID proof at your convenience. No action needed online. -Bank of Baroda",
    lang: "en",
    isScam: false,
    archetype: null,
    tactics: [],
  },
  {
    id: "en-0106",
    text: "You are pre-approved for a personal loan up to Rs 3,00,000. Check eligibility in your ICICI iMobile app. No fee to check.",
    lang: "en",
    isScam: false,
    archetype: null,
    tactics: [],
  },
  {
    id: "en-0107",
    text: "Rs 249 debited from A/c XXXX9921 for Netflix subscription on 11-07-26. Not you? Call the number on your card.",
    lang: "en",
    isScam: false,
    archetype: null,
    tactics: [],
  },
  {
    id: "en-0108",
    text: "Your delivery agent will arrive between 2-4 PM. Please share the 4-digit delivery code shown in the app with him.",
    lang: "en",
    isScam: false,
    archetype: null,
    tactics: [],
  },

  // --- Gujarati (authored — pending native review) ---
  {
    id: "gu-d001",
    text: "પ્રિય ગ્રાહક, તમારું SBI ખાતું આજે બંધ થઈ જશે. KYC પૂર્ણ કરવા આ લિંક પર ક્લિક કરો http://sbi-kyc-verify.xyz અને તમારો OTP તાત્કાલિક આપો.",
    lang: "gu",
    isScam: true,
    archetype: "kyc-expiry",
    tactics: ["urgency", "authority", "credential"],
  },
  {
    id: "gu-d002",
    text: "હું CBI અધિકારી બોલું છું. તમારા નામે એક પાર્સલમાં ગેરકાયદે વસ્તુઓ મળી છે. તમે ડિજિટલ ધરપકડ હેઠળ છો. આ વાત પરિવારને પણ ન કહો.",
    lang: "gu",
    isScam: true,
    archetype: "digital-arrest",
    tactics: ["authority", "fear", "secrecy"],
  },
  {
    id: "gu-d003",
    text: "ફક્ત આધાર કાર્ડ પર ₹5,00,000 સુધીની ઇન્સ્ટન્ટ લોન, કોઈ દસ્તાવેજ નહીં. રકમ છૂટી કરવા પહેલાં ₹2,999 પ્રોસેસિંગ ફી ભરો. અમે RBI માન્ય છીએ.",
    lang: "gu",
    isScam: true,
    archetype: "loan-advance-fee",
    tactics: ["reward", "authority"],
  },
  {
    id: "gu-d004",
    text: "તમારું ₹4,999 નું Flipkart રિફંડ મેળવવા આ કલેક્ટ રિક્વેસ્ટ મંજૂર કરો અને તમારો UPI પિન નાખો.",
    lang: "gu",
    isScam: true,
    archetype: "upi-collect",
    tactics: ["reward", "credential", "irreversibility"],
  },
  {
    id: "gu-d005",
    text: "કસ્ટમ્સે તમારા નામનું પાર્સલ ગેરકાયદે વસ્તુઓ મળવાથી રોક્યું છે. 2 કલાકમાં ₹8,500 ક્લિયરન્સ ફી ભરો નહીંતર તમારા વિરુદ્ધ FIR થશે.",
    lang: "gu",
    isScam: true,
    archetype: "courier-parcel",
    tactics: ["authority", "fear", "urgency"],
  },
  {
    id: "gu-d006",
    text: "અભિનંદન! KBC લકી ડ્રૉમાં તમે ₹25,00,000 જીત્યા છો. ઇનામ મેળવવા હમણાં ₹5,500 ફી ભરો અને તમારો OTP શેર કરો.",
    lang: "gu",
    isScam: true,
    archetype: "lottery-prize",
    tactics: ["reward", "credential", "urgency"],
  },
  {
    id: "gu-d101",
    text: "તમારા ખાતા XXXX2233 માં 15-07-26 ના રોજ UPI દ્વારા રૂ. 1,000.00 જમા થયા. ઉપલબ્ધ બાકી રૂ. 6,540.20 -SBI",
    lang: "gu",
    isScam: false,
    archetype: null,
    tactics: [],
  },
  {
    id: "gu-d102",
    text: "લૉગિન માટે તમારો OTP 448120 છે. 10 મિનિટ માટે માન્ય. આ OTP કોઈને, બેંક સ્ટાફને પણ, ન આપો. -HDFC Bank",
    lang: "gu",
    isScam: false,
    archetype: null,
    tactics: [],
  },
  {
    id: "gu-d103",
    text: "તમારું KYC સમયાંતરે અપડેટ કરવાનું બાકી છે. અનુકૂળતાએ તમારી નજીકની શાખામાં ઓળખપત્ર સાથે જાઓ. ઑનલાઇન કંઈ કરવાની જરૂર નથી. -Bank of Baroda",
    lang: "gu",
    isScam: false,
    archetype: null,
    tactics: [],
  },
  {
    id: "gu-d104",
    text: "તમારો ઑર્ડર #40128 મોકલી દેવાયો છે અને ગુરુવાર સુધીમાં પહોંચશે. એપમાં ટ્રૅક કરો.",
    lang: "gu",
    isScam: false,
    archetype: null,
    tactics: [],
  },
  {
    id: "gu-d105",
    text: "યાદ અપાવણી: તમારું વીજ બિલ ₹1,240 તારીખ 28-07-2026 સુધીમાં ભરવાનું છે. સત્તાવાર એપ કે વેબસાઇટ પરથી ભરો.",
    lang: "gu",
    isScam: false,
    archetype: null,
    tactics: [],
  },
  {
    id: "gu-d106",
    text: "તમારા ખાતા XXXX9921 માંથી 11-07-26 ના રોજ Netflix સબ્સ્ક્રિપ્શન માટે ₹249 કપાયા. તમે નથી કર્યું? કાર્ડ પરના નંબર પર કૉલ કરો.",
    lang: "gu",
    isScam: false,
    archetype: null,
    tactics: [],
  },

  // --- Hindi (authored — pending native review) ---
  {
    id: "hi-d001",
    text: "बधाई हो! KBC लकी ड्रॉ में आपने 25,00,000 रुपये जीते हैं। इनाम पाने के लिए अभी 4999 रुपये फीस भरें और अपना बैंक OTP शेयर करें।",
    lang: "hi",
    isScam: true,
    archetype: "lottery-prize",
    tactics: ["reward", "credential", "urgency"],
  },
  {
    id: "hi-d002",
    text: "5 लाख रुपये का लोन बिना दस्तावेज़ तुरंत मंज़ूर। राशि जारी करने के लिए पहले 2999 रुपये प्रोसेसिंग फीस भेजें। हम RBI अप्रूव्ड हैं।",
    lang: "hi",
    isScam: true,
    archetype: "loan-advance-fee",
    tactics: ["reward", "authority"],
  },
  {
    id: "hi-d003",
    text: "प्रिय ग्राहक, KYC समाप्त होने से आपका SBI खाता आज बंद हो जाएगा। बंद होने से बचने के लिए अभी इस लिंक पर अपडेट करें http://sbi-kyc.verify-in.xyz",
    lang: "hi",
    isScam: true,
    archetype: "kyc-expiry",
    tactics: ["urgency", "authority", "fear"],
  },
  {
    id: "hi-d004",
    text: "मैं CBI अधिकारी बोल रहा हूँ। आपके नाम के पार्सल में अवैध सामान मिला है। आप डिजिटल अरेस्ट में हैं। जाँच पूरी होने तक परिवार को भी न बताएं।",
    lang: "hi",
    isScam: true,
    archetype: "digital-arrest",
    tactics: ["authority", "fear", "secrecy"],
  },
  {
    id: "hi-d005",
    text: "कस्टम ने प्रतिबंधित सामान के कारण आपका पार्सल रोका है। 2 घंटे में ₹8,500 क्लीयरेंस फीस भरें वरना आप पर FIR दर्ज होगी।",
    lang: "hi",
    isScam: true,
    archetype: "courier-parcel",
    tactics: ["authority", "fear", "urgency"],
  },
  {
    id: "hi-d006",
    text: "आपके क्रेडिट कार्ड की लिमिट ₹8 लाख हो गई है। एक्टिवेट करने के लिए AnyDesk इंस्टॉल करें और वेरिफिकेशन के लिए हमारे एग्ज़िक्यूटिव से स्क्रीन शेयर करें।",
    lang: "hi",
    isScam: true,
    archetype: "card-upgrade",
    tactics: ["reward", "credential", "authority"],
  },
  {
    id: "hi-d101",
    text: "आपके खाते XXXX7781 में 14-07-26 को UPI से रु. 750.00 जमा हुए। उपलब्ध शेष रु. 4,210.00 -SBI",
    lang: "hi",
    isScam: false,
    archetype: null,
    tactics: [],
  },
  {
    id: "hi-d102",
    text: "आपका ऑर्डर #55231 भेज दिया गया है और गुरुवार तक पहुँच जाएगा। ऐप में ट्रैक करें।",
    lang: "hi",
    isScam: false,
    archetype: null,
    tactics: [],
  },
  {
    id: "hi-d103",
    text: "लॉगिन के लिए आपका OTP 448120 है। 10 मिनट के लिए मान्य। यह OTP किसी को, बैंक स्टाफ को भी, न बताएं। -HDFC Bank",
    lang: "hi",
    isScam: false,
    archetype: null,
    tactics: [],
  },
  {
    id: "hi-d104",
    text: "आपका KYC समय-समय पर अपडेट के लिए देय है। सुविधानुसार अपनी नज़दीकी शाखा में पहचान पत्र लेकर जाएँ। ऑनलाइन कुछ करने की ज़रूरत नहीं। -Bank of Baroda",
    lang: "hi",
    isScam: false,
    archetype: null,
    tactics: [],
  },
  {
    id: "hi-d105",
    text: "याद दिलावा: आपका बिजली बिल ₹1,240, 28-07-2026 तक देय है। आधिकारिक ऐप या वेबसाइट से भुगतान करें।",
    lang: "hi",
    isScam: false,
    archetype: null,
    tactics: [],
  },
  {
    id: "hi-d106",
    text: "आपके खाते XXXX9921 से 11-07-26 को Netflix सब्सक्रिप्शन के लिए ₹249 काटे गए। आपने नहीं किया? कार्ड पर दिए नंबर पर कॉल करें।",
    lang: "hi",
    isScam: false,
    archetype: null,
    tactics: [],
  },
];
