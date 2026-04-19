export type LangCode =
  | 'en' | 'hi' | 'ta' | 'te' | 'kn'
  | 'ml' | 'bn' | 'mr' | 'gu' | 'pa' | 'or';

export interface LanguageOption {
  code: LangCode;
  label: string;       // English name
  nativeLabel: string;  // Native script
  shortLabel: string;   // 2-3 char for toggle pill
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English',   nativeLabel: 'English',   shortLabel: 'EN' },
  { code: 'hi', label: 'Hindi',     nativeLabel: '\u0939\u093F\u0902\u0926\u0940',     shortLabel: '\u0939\u093F' },
  { code: 'ta', label: 'Tamil',     nativeLabel: '\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD',     shortLabel: '\u0BA4\u0BAE' },
  { code: 'te', label: 'Telugu',    nativeLabel: '\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41',    shortLabel: '\u0C24\u0C46' },
  { code: 'kn', label: 'Kannada',   nativeLabel: '\u0C95\u0CA8\u0CCD\u0CA8\u0CA1',   shortLabel: '\u0C95\u0CA8' },
  { code: 'ml', label: 'Malayalam', nativeLabel: '\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02', shortLabel: '\u0D2E\u0D32' },
  { code: 'bn', label: 'Bengali',   nativeLabel: '\u09AC\u09BE\u0982\u09B2\u09BE',   shortLabel: '\u09AC\u09BE' },
  { code: 'mr', label: 'Marathi',   nativeLabel: '\u092E\u0930\u093E\u0920\u0940',   shortLabel: '\u092E\u0930' },
  { code: 'gu', label: 'Gujarati',  nativeLabel: '\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0',  shortLabel: '\u0A97\u0AC1' },
  { code: 'pa', label: 'Punjabi',   nativeLabel: '\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40',   shortLabel: '\u0A2A\u0A70' },
  { code: 'or', label: 'Odia',      nativeLabel: '\u0B13\u0B21\u0B3F\u0B06',      shortLabel: '\u0B13\u0B21' },
];

interface UIStrings {
  forYou: string;
  ai: string;
  tech: string;
  startups: string;
  product: string;
  companies: string;
  world: string;
  learn: string;
  swipeForNext: string;
  askAI: string;
  summarize: string;
  keyTakeaways: string;
  explainSimply: string;
  whatsTheImpact: string;
  bothSides: string;
  askAnything: string;
  aiInsight: string;
  pickLanguages: string;
  chooseThree: string;
  defaultLang: string;
}

const strings: Record<string, UIStrings> = {
  en: {
    forYou: 'For You',
    ai: 'AI',
    tech: 'Tech',
    startups: 'Startups',
    product: 'Product',
    companies: 'Companies',
    world: 'World',
    learn: 'Learn',
    swipeForNext: 'Swipe for next',
    askAI: 'Ask AI',
    summarize: 'Summarize',
    keyTakeaways: 'Key takeaways',
    explainSimply: 'Explain simply',
    whatsTheImpact: "What's the impact?",
    bothSides: 'Both sides',
    askAnything: 'Ask anything about this article...',
    aiInsight: 'AI Insight',
    pickLanguages: 'Pick your languages',
    chooseThree: 'Choose 3 languages. First one is your default.',
    defaultLang: 'Default',
  },
  hi: {
    forYou: '\u0906\u092A\u0915\u0947 \u0932\u093F\u090F',
    ai: 'AI',
    tech: '\u091F\u0947\u0915',
    startups: '\u0938\u094D\u091F\u093E\u0930\u094D\u091F\u0905\u092A',
    product: '\u092A\u094D\u0930\u094B\u0921\u0915\u094D\u091F',
    companies: '\u0915\u0902\u092A\u0928\u093F\u092F\u093E\u0901',
    world: '\u0926\u0941\u0928\u093F\u092F\u093E',
    learn: '\u0938\u0940\u0916\u0947\u0902',
    swipeForNext: '\u0905\u0917\u0932\u0947 \u0915\u0947 \u0932\u093F\u090F \u0938\u094D\u0935\u093E\u0907\u092A \u0915\u0930\u0947\u0902',
    askAI: 'AI \u0938\u0947 \u092A\u0942\u091B\u0947\u0902',
    summarize: '\u0938\u093E\u0930\u093E\u0902\u0936',
    keyTakeaways: '\u092E\u0941\u0916\u094D\u092F \u092C\u093E\u0924\u0947\u0902',
    explainSimply: '\u0938\u0930\u0932 \u092D\u093E\u0937\u093E \u092E\u0947\u0902',
    whatsTheImpact: '\u0915\u094D\u092F\u093E \u092A\u094D\u0930\u092D\u093E\u0935 \u0939\u0948?',
    bothSides: '\u0926\u094B\u0928\u094B\u0902 \u092A\u0915\u094D\u0937',
    askAnything: '\u0907\u0938 \u0932\u0947\u0916 \u0915\u0947 \u092C\u093E\u0930\u0947 \u092E\u0947\u0902 \u0915\u0941\u091B \u092D\u0940 \u092A\u0942\u091B\u0947\u0902...',
    aiInsight: 'AI \u0905\u0902\u0924\u0930\u094D\u0926\u0943\u0937\u094D\u091F\u093F',
    pickLanguages: '\u0905\u092A\u0928\u0940 \u092D\u093E\u0937\u093E\u090F\u0901 \u091A\u0941\u0928\u0947\u0902',
    chooseThree: '3 \u092D\u093E\u0937\u093E\u090F\u0901 \u091A\u0941\u0928\u0947\u0902\u0964 \u092A\u0939\u0932\u0940 \u0906\u092A\u0915\u0940 \u0921\u093F\u092B\u0949\u0932\u094D\u091F \u0939\u094B\u0917\u0940\u0964',
    defaultLang: '\u0921\u093F\u092B\u0949\u0932\u094D\u091F',
  },
  ta: {
    forYou: '\u0BA4\u0B99\u0BCD\u0B95\u0BB3\u0BC1\u0B95\u0BCD\u0B95\u0BBE\u0B95',
    ai: 'AI',
    tech: '\u0BA4\u0BCA\u0BB4\u0BBF\u0BB2\u0BCD',
    startups: '\u0BB8\u0BCD\u0B9F\u0BBE\u0BB0\u0BCD\u0B9F\u0BCD\u0B85\u0BAA\u0BCD',
    product: '\u0BAA\u0BCA\u0BB0\u0BC1\u0BB3\u0BCD',
    companies: '\u0BA8\u0BBF\u0BB1\u0BC1\u0BB5\u0BA9\u0B99\u0BCD\u0B95\u0BB3\u0BCD',
    world: '\u0BA9\u0BB2\u0B95\u0BAE\u0BCD',
    learn: '\u0B95\u0BB1\u0BCD\u0BB1\u0BB2\u0BCD',
    swipeForNext: '\u0B85\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BA4\u0BB1\u0BCD\u0B95\u0BC1 \u0BB8\u0BCD\u0BB5\u0BC8\u0BAA\u0BCD',
    askAI: 'AI-\u0BAF\u0BBF\u0B9F\u0BAE\u0BCD \u0B95\u0BC7\u0BB3\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD',
    summarize: '\u0B9A\u0BC1\u0BB0\u0BC1\u0B95\u0BCD\u0B95\u0BAE\u0BCD',
    keyTakeaways: '\u0BAE\u0BC1\u0B95\u0BCD\u0B95\u0BBF\u0BAF \u0B95\u0BC1\u0BB1\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD',
    explainSimply: '\u0B8E\u0BB3\u0BBF\u0BAE\u0BC8\u0BAF\u0BBE\u0B95',
    whatsTheImpact: '\u0B8E\u0BA9\u0BCD\u0BA9 \u0BAA\u0BBE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1?',
    bothSides: '\u0B87\u0BB0\u0BC1 \u0BAA\u0B95\u0BCD\u0B95\u0BAE\u0BC1\u0BAE\u0BCD',
    askAnything: '\u0B87\u0BA8\u0BCD\u0BA4 \u0B95\u0B9F\u0BCD\u0B9F\u0BC1\u0BB0\u0BC8 \u0BAA\u0BB1\u0BCD\u0BB1\u0BBF \u0B95\u0BC7\u0BB3\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD...',
    aiInsight: 'AI \u0BA8\u0BC1\u0BA3\u0BCD\u0BA3\u0BB1\u0BBF\u0BB5\u0BC1',
    pickLanguages: '\u0BAE\u0BCA\u0BB4\u0BBF\u0B95\u0BB3\u0BC8 \u0BA4\u0BC7\u0BB0\u0BCD\u0BA8\u0BCD\u0BA4\u0BC6\u0B9F\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD',
    chooseThree: '3 \u0BAE\u0BCA\u0BB4\u0BBF\u0B95\u0BB3\u0BC8 \u0BA4\u0BC7\u0BB0\u0BCD\u0BA8\u0BCD\u0BA4\u0BC6\u0B9F\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD',
    defaultLang: '\u0B87\u0BAF\u0BB2\u0BCD\u0BAA\u0BC1',
  },
  te: {
    forYou: '\u0C2E\u0C40 \u0C15\u0C4B\u0C38\u0C02',
    ai: 'AI',
    tech: '\u0C1F\u0C46\u0C15\u0C4D',
    startups: '\u0C38\u0C4D\u0C1F\u0C3E\u0C30\u0C4D\u0C1F\u0C05\u0C2A\u0C4D',
    product: '\u0C09\u0C24\u0C4D\u0C2A\u0C24\u0C4D\u0C24\u0C3F',
    companies: '\u0C15\u0C02\u0C2A\u0C46\u0C28\u0C40\u0C32\u0C41',
    world: '\u0C2A\u0C4D\u0C30\u0C2A\u0C02\u0C1A\u0C02',
    learn: '\u0C28\u0C47\u0C30\u0C4D\u0C1A\u0C41\u0C15\u0C4B\u0C02\u0C21\u0C3F',
    swipeForNext: '\u0C24\u0C26\u0C41\u0C2A\u0C30\u0C3F \u0C15\u0C4B\u0C38\u0C02 \u0C38\u0C4D\u0C35\u0C48\u0C2A\u0C4D',
    askAI: 'AI\u0C28\u0C3F \u0C05\u0C21\u0C17\u0C02\u0C21\u0C3F',
    summarize: '\u0C38\u0C3E\u0C30\u0C3E\u0C02\u0C36\u0C02',
    keyTakeaways: '\u0C2E\u0C41\u0C16\u0C4D\u0C2F \u0C05\u0C02\u0C36\u0C3E\u0C32\u0C41',
    explainSimply: '\u0C38\u0C30\u0C33\u0C02\u0C17\u0C3E',
    whatsTheImpact: '\u0C2A\u0C4D\u0C30\u0C2D\u0C3E\u0C35\u0C02 \u0C0F\u0C2E\u0C3F\u0C1F\u0C3F?',
    bothSides: '\u0C30\u0C46\u0C02\u0C21\u0C41 \u0C35\u0C48\u0C2A\u0C41\u0C32\u0C41',
    askAnything: '\u0C08 \u0C15\u0C25\u0C28\u0C02 \u0C17\u0C41\u0C30\u0C3F\u0C02\u0C1A\u0C3F \u0C0F\u0C26\u0C48\u0C28\u0C3E \u0C05\u0C21\u0C17\u0C02\u0C21\u0C3F...',
    aiInsight: 'AI \u0C05\u0C02\u0C24\u0C30\u0C4D\u0C26\u0C43\u0C37\u0C4D\u0C1F\u0C3F',
    pickLanguages: '\u0C2D\u0C3E\u0C37\u0C32\u0C28\u0C41 \u0C0E\u0C02\u0C1A\u0C41\u0C15\u0C4B\u0C02\u0C21\u0C3F',
    chooseThree: '3 \u0C2D\u0C3E\u0C37\u0C32\u0C28\u0C41 \u0C0E\u0C02\u0C1A\u0C41\u0C15\u0C4B\u0C02\u0C21\u0C3F',
    defaultLang: '\u0C21\u0C3F\u0C2B\u0C3E\u0C32\u0C4D\u0C1F\u0C4D',
  },
};

// For languages without full translations, fall back to English
export function getUIStrings(lang: LangCode): UIStrings {
  return strings[lang] || strings.en;
}

export function getLanguageByCode(code: LangCode): LanguageOption | undefined {
  return LANGUAGES.find((l) => l.code === code);
}
