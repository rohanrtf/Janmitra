import { useState, useEffect, useRef } from "react";
import { saveWorker } from "./supabase.js";

// ─── THEME & CONSTANTS ────────────────────────────────────────────────────────
const COLORS = {
  saffron: "#E8690B",
  saffronLight: "#F5A043",
  saffronDark: "#B84D00",
  green: "#1A7A4A",
  greenLight: "#2CA865",
  greenPale: "#E8F5EE",
  gold: "#C9960A",
  goldLight: "#F5D76E",
  navy: "#0D2240",
  navyMid: "#1A3A5C",
  slate: "#3A4A5C",
  mist: "#F4F6F8",
  white: "#FFFFFF",
  red: "#C0392B",
  redLight: "#FADBD8",
  amber: "#D4820A",
  amberLight: "#FEF3E2",
};

const SCHEMES = [
  {
    id: "pmjjby", name: "PMJJBY", fullName: "Pradhan Mantri Jeevan Jyoti Bima Yojana",
    type: "insurance", benefit: "₹2 lakh life insurance", benefitScore: 70,
    applies_to: ["worker", "any"], category: "Central",
    eligibility: { minAge: 18, maxAge: 50, requiresBankAccount: true },
    docs: ["Aadhaar", "Bank Passbook"],
    difficulty: 20, difficultyLabel: "Easy",
    icon: "🛡️",
    description_bn: "যেকোনো কারণে মৃত্যুতে ₹২ লাখ জীবন বীমা",
    description_hi: "किसी भी कारण से मृत्यु पर ₹2 लाख जीवन बीमा",
    description_en: "₹2 lakh life insurance for death due to any reason",
  },
  {
    id: "pmsby", name: "PMSBY", fullName: "Pradhan Mantri Suraksha Bima Yojana",
    type: "insurance", benefit: "₹2 lakh accident insurance", benefitScore: 68,
    applies_to: ["worker", "any"], category: "Central",
    eligibility: { minAge: 18, maxAge: 70, requiresBankAccount: true },
    docs: ["Aadhaar", "Bank Passbook"],
    difficulty: 15, difficultyLabel: "Easy",
    icon: "⚕️",
    description_bn: "দুর্ঘটনায় মৃত্যু/অক্ষমতায় ₹২ লাখ বীমা",
    description_hi: "दुर्घटना मृत्यु/विकलांगता पर ₹2 लाख बीमा",
    description_en: "₹2 lakh insurance for accidental death/disability",
  },
  {
    id: "apy", name: "APY", fullName: "Atal Pension Yojana",
    type: "pension", benefit: "₹1000–₹5000/month pension from age 60", benefitScore: 75,
    applies_to: ["worker", "any"], category: "Central",
    eligibility: { minAge: 18, maxAge: 40, requiresBankAccount: true },
    docs: ["Aadhaar", "Bank Passbook"],
    difficulty: 25, difficultyLabel: "Easy",
    icon: "🏦",
    description_bn: "৬০ বছর পর মাসিক ₹১০০০–₹৫০০০ পেনশন",
    description_hi: "60 वर्ष के बाद ₹1000–₹5000 मासिक पेंशन",
    description_en: "₹1000–₹5000/month pension after age 60",
  },
  {
    id: "pm_sym", name: "PM-SYM", fullName: "Pradhan Mantri Shram Yogi Mandhan",
    type: "pension", benefit: "₹3000/month pension from age 60", benefitScore: 82,
    applies_to: ["worker"], category: "Central",
    eligibility: { minAge: 18, maxAge: 40, unorganisedWorker: true, monthlyIncomeMax: 15000 },
    docs: ["Aadhaar", "Bank Passbook"],
    difficulty: 30, difficultyLabel: "Easy",
    icon: "👷",
    description_bn: "অসংগঠিত শ্রমিকদের জন্য ₹৩০০০/মাস পেনশন",
    description_hi: "असंगठित मजदूरों के लिए ₹3000/माह पेंशन",
    description_en: "₹3000/month pension for unorganised workers",
  },
  {
    id: "swasthya_sathi", name: "Swasthya Sathi", fullName: "Swasthya Sathi Health Scheme",
    type: "health", benefit: "₹5 lakh health cover/family/year", benefitScore: 95,
    applies_to: ["worker", "family"], category: "West Bengal",
    eligibility: { stateWB: true },
    docs: ["Aadhaar", "Photo", "Address Proof"],
    difficulty: 40, difficultyLabel: "Medium",
    icon: "🏥",
    description_bn: "পরিবারপ্রতি বার্ষিক ₹৫ লাখ স্বাস্থ্য সুরক্ষা",
    description_hi: "परिवार को ₹5 लाख सालाना स्वास्थ्य बीमा",
    description_en: "₹5 lakh annual health cover per family",
  },
  {
    id: "lakshmir_bhandar", name: "Lakshmir Bhandar", fullName: "Lakshmir Bhandar Scheme",
    type: "cash_transfer", benefit: "₹1000–₹1200/month", benefitScore: 85,
    applies_to: ["wife", "daughter", "female"],  category: "West Bengal",
    eligibility: { gender: "female", minAge: 25, maxAge: 60, stateWB: true },
    docs: ["Aadhaar", "Ration Card", "Bank Passbook"],
    difficulty: 35, difficultyLabel: "Easy",
    icon: "🌸",
    description_bn: "WB মহিলাদের মাসিক ₹১০০০–₹১২০০ আর্থিক সহায়তা",
    description_hi: "WB महिलाओं को ₹1000–₹1200 मासिक सहायता",
    description_en: "₹1000–₹1200/month for WB women aged 25–60",
  },
  {
    id: "rupashree", name: "Rupashree Prakalpa", fullName: "Rupashree Prakalpa",
    type: "one_time", benefit: "₹25,000 one-time marriage grant", benefitScore: 75,
    applies_to: ["daughter", "female"], category: "West Bengal",
    eligibility: { gender: "female", minAge: 18, unmarried: true, annualFamilyIncomeMax: 150000 },
    docs: ["Aadhaar", "Income Certificate", "Marriage Certificate", "Bank Passbook"],
    difficulty: 50, difficultyLabel: "Medium",
    icon: "💐",
    description_bn: "বিয়ের আগে মেয়েদের ₹২৫,০০০ একবারের অনুদান",
    description_hi: "शादी से पहले बेटियों को ₹25,000 एकमुश्त",
    description_en: "₹25,000 one-time grant before daughter's marriage",
  },
  {
    id: "wb_old_age_pension", name: "WB Old Age Pension", fullName: "West Bengal Old Age Pension",
    type: "pension", benefit: "₹1000/month", benefitScore: 78,
    applies_to: ["parent", "any"], category: "West Bengal",
    eligibility: { minAge: 60, stateWB: true },
    docs: ["Aadhaar", "Age Proof", "Bank Passbook"],
    difficulty: 35, difficultyLabel: "Easy",
    icon: "👴",
    description_bn: "৬০+ বয়সী বয়স্কদের জন্য মাসিক ₹১০০০ পেনশন",
    description_hi: "60+ वरिष्ठों के लिए ₹1000 मासिक पेंशन",
    description_en: "₹1000/month pension for senior citizens above 60",
  },
  {
    id: "tapasili_bandhu", name: "Tapasili Bandhu", fullName: "Tapasili Bandhu Pension Scheme",
    type: "pension", benefit: "₹1000/month (SC seniors)", benefitScore: 78,
    applies_to: ["parent", "any"], category: "West Bengal",
    eligibility: { minAge: 60, caste: ["SC"], stateWB: true },
    docs: ["Aadhaar", "Caste Certificate", "Age Proof", "Bank Passbook"],
    difficulty: 45, difficultyLabel: "Medium",
    icon: "🏅",
    description_bn: "SC শ্রেণির ৬০+ বয়স্কদের মাসিক ₹১০০০",
    description_hi: "SC वर्ग के 60+ वरिष्ठों को ₹1000 मासिक",
    description_en: "₹1000/month for SC senior citizens",
  },
  {
    id: "jai_johar", name: "Jai Johar", fullName: "Jai Johar Pension Scheme",
    type: "pension", benefit: "₹1000/month (ST seniors)", benefitScore: 78,
    applies_to: ["parent", "any"], category: "West Bengal",
    eligibility: { minAge: 60, caste: ["ST"], stateWB: true },
    docs: ["Aadhaar", "Caste Certificate", "Age Proof", "Bank Passbook"],
    difficulty: 45, difficultyLabel: "Medium",
    icon: "🌿",
    description_bn: "ST শ্রেণির ৬০+ বয়স্কদের মাসিক ₹১০০০",
    description_hi: "ST वर्ग के 60+ वरिष्ठों को ₹1000 मासिक",
    description_en: "₹1000/month for ST senior citizens",
  },
  {
    id: "manabik", name: "Manabik (Disability)", fullName: "WB Disability Pension Scheme",
    type: "pension", benefit: "₹1000/month (40%+ disability)", benefitScore: 78,
    applies_to: ["worker", "any"], category: "West Bengal",
    eligibility: { disabilityMinPercent: 40, stateWB: true },
    docs: ["Aadhaar", "Disability Certificate", "Bank Passbook"],
    difficulty: 40, difficultyLabel: "Medium",
    icon: "♿",
    description_bn: "৪০%+ অক্ষমতায় মাসিক ₹১০০০ পেনশন",
    description_hi: "40%+ विकलांगता पर ₹1000 मासिक पेंशन",
    description_en: "₹1000/month for 40%+ disability (no income criteria)",
  },
  {
    id: "widow_pension", name: "WB Widow Pension", fullName: "West Bengal Widow Pension",
    type: "pension", benefit: "₹1000/month", benefitScore: 78,
    applies_to: ["wife", "any"], category: "West Bengal",
    eligibility: { maritalStatus: "widow", annualFamilyIncomeMax: 72000, stateWB: true },
    docs: ["Aadhaar", "Death Certificate (Husband)", "Income Certificate", "Bank Passbook"],
    difficulty: 50, difficultyLabel: "Medium",
    icon: "🕊️",
    description_bn: "বিধবা মহিলাদের মাসিক ₹১০০০ পেনশন",
    description_hi: "विधवा महिलाओं को ₹1000 मासिक पेंशन",
    description_en: "₹1000/month pension for widows (income < ₹72,000/yr)",
  },
  {
    id: "svmcm", name: "SVMCM Scholarship", fullName: "Swami Vivekananda Merit Cum Means Scholarship",
    type: "scholarship", benefit: "₹12,000–₹96,000/year scholarship", benefitScore: 80,
    applies_to: ["daughter", "son", "student"], category: "West Bengal",
    eligibility: { student: true, annualFamilyIncomeMax: 250000, stateWB: true },
    docs: ["Aadhaar", "Income Certificate", "Marksheet", "Admission Proof", "Bank Passbook"],
    difficulty: 45, difficultyLabel: "Medium",
    icon: "📚",
    description_bn: "WB ছাত্র-ছাত্রীদের জন্য বার্ষিক ₹১২,০০০–₹৯৬,০০০ বৃত্তি",
    description_hi: "WB छात्रों के लिए ₹12,000–₹96,000 वार्षिक छात्रवृत्ति",
    description_en: "₹12,000–₹96,000/yr scholarship for WB students",
  },
  {
    id: "student_credit_card", name: "Student Credit Card", fullName: "WB Student Credit Card",
    type: "loan", benefit: "Loan up to ₹10 lakh @ 4% interest", benefitScore: 72,
    applies_to: ["daughter", "son", "student"], category: "West Bengal",
    eligibility: { student: true, maxAge: 40, stateWB: true },
    docs: ["Aadhaar", "Admission Proof", "Bank Passbook"],
    difficulty: 55, difficultyLabel: "Medium",
    icon: "🎓",
    description_bn: "WB ছাত্রদের জন্য ₹১০ লাখ পর্যন্ত ৪% সুদে ঋণ",
    description_hi: "WB छात्रों के लिए ₹10 लाख तक 4% ब्याज पर लोन",
    description_en: "Loan up to ₹10 lakh at 4% for WB students (age ≤40)",
  },
  {
    id: "samajik_mukti", name: "Samajik Mukti Card", fullName: "Bina Mulya Samajik Suraksha Yojana",
    type: "social_security", benefit: "PF + health + death compensation card", benefitScore: 88,
    applies_to: ["worker"], category: "West Bengal",
    eligibility: { unorganisedWorker: true, monthlyFamilyIncomeMax: 6500, stateWB: true },
    docs: ["Aadhaar", "Income Proof", "Bank Passbook"],
    difficulty: 35, difficultyLabel: "Easy",
    icon: "🪪",
    description_bn: "অসংগঠিত শ্রমিকদের জন্য সামাজিক সুরক্ষা কার্ড",
    description_hi: "असंगठित मजदूरों के लिए सामाजिक सुरक्षा कार्ड",
    description_en: "Social security card for unorganised workers (income ≤₹6500/month)",
  },
  {
    id: "pm_kisan", name: "PM-KISAN", fullName: "PM Kisan Samman Nidhi Yojana",
    type: "farm_subsidy", benefit: "₹6,000/year (3 installments)", benefitScore: 65,
    applies_to: ["worker", "any"], category: "Central",
    eligibility: { farmer: true },
    docs: ["Aadhaar", "Land Records", "Bank Passbook"],
    difficulty: 50, difficultyLabel: "Medium",
    icon: "🌾",
    description_bn: "কৃষকদের জন্য বার্ষিক ₹৬,০০০ আর্থিক সহায়তা",
    description_hi: "किसानों को ₹6,000 सालाना सहायता",
    description_en: "₹6,000/year financial support for farmers",
  },
  {
    id: "krishak_bandhu", name: "Krishak Bandhu", fullName: "Krishak Bandhu Scheme",
    type: "farm_subsidy", benefit: "₹4,000–₹10,000/year", benefitScore: 67,
    applies_to: ["worker", "any"], category: "West Bengal",
    eligibility: { farmer: true, stateWB: true },
    docs: ["Aadhaar", "Land Records", "Bank Passbook"],
    difficulty: 50, difficultyLabel: "Medium",
    icon: "🌱",
    description_bn: "WB কৃষকদের বার্ষিক ₹৪,০০০–₹১০,০০০",
    description_hi: "WB किसानों को ₹4,000–₹10,000 वार्षिक",
    description_en: "₹4,000–₹10,000/year for WB farmers",
  },
  {
    id: "sukanya", name: "Sukanya Samriddhi", fullName: "Sukanya Samriddhi Yojana",
    type: "savings", benefit: "8.2% interest savings for girl child", benefitScore: 70,
    applies_to: ["daughter"], category: "Central",
    eligibility: { gender: "female", maxAge: 10 },
    docs: ["Aadhaar", "Birth Certificate"],
    difficulty: 20, difficultyLabel: "Easy",
    icon: "👧",
    description_bn: "১০ বছরের কম বয়সী মেয়েদের ৮.২% সুদে সঞ্চয়",
    description_hi: "10 साल से कम बेटी के लिए 8.2% ब्याज बचत खाता",
    description_en: "8.2% savings account for girl child below 10 years",
  },
];

const DOC_SERVICES = [
  { id: "aadhaar", name: "Aadhaar Card", icon: "🪪", description_bn: "আধার কার্ড নথিভুক্তি/আপডেট", description_hi: "आधार कार्ड नामांकन/अपडेट", description_en: "Aadhaar enrolment or update" },
  { id: "caste_cert", name: "Caste Certificate", icon: "📜", description_bn: "জাতি শংসাপত্র (SC/ST/OBC)", description_hi: "जाति प्रमाण पत्र (SC/ST/OBC)", description_en: "Caste certificate (SC/ST/OBC-A/OBC-B)" },
  { id: "income_cert", name: "Income Certificate", icon: "📋", description_bn: "আয় শংসাপত্র", description_hi: "आय प्रमाण पत्र", description_en: "Income certificate" },
  { id: "ration_card", name: "Ration Card", icon: "🗂️", description_bn: "রেশন কার্ড", description_hi: "राशन कार्ड", description_en: "Ration card" },
  { id: "epfo_ekyc", name: "EPFO e-KYC", icon: "🏛️", description_bn: "EPFO ই-কেওয়াইসি", description_hi: "EPFO ई-केवाईसी", description_en: "Seed Aadhaar/PAN/bank with UAN" },
];

// ─── STATUS PIPELINE ──────────────────────────────────────────────────────────
const STATUSES = ["Created", "Docs Pending", "Docs Received", "Under Verification", "Ready to Submit", "Submitted", "Completed"];
const STATUS_COLORS = {
  "Created": "#6C757D",
  "Docs Pending": "#E8690B",
  "Docs Received": "#C9960A",
  "Under Verification": "#1A3A5C",
  "Ready to Submit": "#7B2CBF",
  "Submitted": "#2CA865",
  "Completed": "#1A7A4A",
};

// ─── MESSAGE TEMPLATES ────────────────────────────────────────────────────────
const MSG = {
  created: {
    en: (ref, scheme) => `Jan Setu Ref ${ref} created for ${scheme}. Status: In process. We will update you at each step.`,
    hi: (ref, scheme) => `Jan Setu Ref ${ref} (${scheme}) बन गया है। स्थिति: प्रक्रिया में। हर स्टेप पर अपडेट मिलेगा।`,
    bn: (ref, scheme) => `Jan Setu Ref ${ref} (${scheme}) তৈরি হয়েছে। স্ট্যাটাস: প্রক্রিয়াধীন। প্রতিটি ধাপে আপডেট দেব।`,
  },
  submitted: {
    en: (ref, ack) => `Ref ${ref} has been submitted. Acknowledgement: ${ack}.`,
    hi: (ref, ack) => `Ref ${ref} सबमिट हो गया। पावती: ${ack}।`,
    bn: (ref, ack) => `Ref ${ref} জমা হয়েছে। স্বীকৃতি: ${ack}।`,
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function generateRef() {
  const d = new Date();
  return `JM-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${String(Math.floor(Math.random()*9000)+1000)}`;
}

function checkPersonEligibility(scheme, person, household) {
  const e = scheme.eligibility;
  const age = parseInt(person.age) || 0;
  const reasons = [];
  const failures = [];

  // ── Age checks ──────────────────────────────────────────────────────────────
  // Only apply minAge if explicitly set (not 0/undefined)
  if (e.minAge !== undefined && e.minAge !== null) {
    if (age < e.minAge) failures.push(`Age ${age} < minimum ${e.minAge}`);
    else reasons.push(`Age ${age} ✓`);
  }
  if (e.maxAge !== undefined && e.maxAge !== null) {
    if (age > e.maxAge) failures.push(`Age ${age} > maximum ${e.maxAge}`);
  }

  // ── Gender check ─────────────────────────────────────────────────────────────
  // Only fail if the scheme explicitly requires a specific gender
  if (e.gender) {
    if (person.gender !== e.gender) {
      failures.push(`Gender: need ${e.gender}, got ${person.gender || "not set"}`);
    } else {
      reasons.push(`Gender: ${person.gender} ✓`);
    }
  }

  // ── Unorganised worker ───────────────────────────────────────────────────────
  // Check on the PERSON (worker), not via household.worker (which was the bug)
  if (e.unorganisedWorker) {
    if (!person.unorganised) failures.push("Must be unorganised worker");
    else reasons.push("Unorganised worker ✓");
  }

  // ── Income checks ────────────────────────────────────────────────────────────
  // monthlyIncomeMax → check household monthly income
  if (e.monthlyIncomeMax !== undefined) {
    const mi = parseInt(household.monthlyIncome) || 0;
    if (mi > e.monthlyIncomeMax) failures.push(`Monthly income ₹${mi} > limit ₹${e.monthlyIncomeMax}`);
    else reasons.push(`Monthly income ₹${mi} ≤ ₹${e.monthlyIncomeMax} ✓`);
  }
  // monthlyFamilyIncomeMax → same (alias for Samajik Mukti Card)
  if (e.monthlyFamilyIncomeMax !== undefined) {
    const mi = parseInt(household.monthlyIncome) || 0;
    if (mi > e.monthlyFamilyIncomeMax) failures.push(`Family monthly income ₹${mi} > limit ₹${e.monthlyFamilyIncomeMax}`);
    else reasons.push(`Family income ₹${mi}/month ≤ ₹${e.monthlyFamilyIncomeMax} ✓`);
  }
  // annualFamilyIncomeMax → check household annual income
  if (e.annualFamilyIncomeMax !== undefined) {
    const ai = parseInt(household.annualIncome) || 0;
    if (ai > e.annualFamilyIncomeMax) failures.push(`Annual income ₹${ai} > limit ₹${e.annualFamilyIncomeMax}`);
    else reasons.push(`Annual income ₹${ai} ≤ ₹${e.annualFamilyIncomeMax} ✓`);
  }

  // ── Farmer ───────────────────────────────────────────────────────────────────
  if (e.farmer) {
    if (!person.farmer) failures.push("Must be a farmer");
    else reasons.push("Farmer ✓");
  }

  // ── Student ───────────────────────────────────────────────────────────────────
  if (e.student) {
    if (!person.student) failures.push("Must be a student");
    else reasons.push("Student ✓");
  }

  // ── Unmarried (for Rupashree — bride must be unmarried at time of application) ──
  if (e.unmarried) {
    if (person.maritalStatus !== "unmarried") failures.push("Must be unmarried");
    else reasons.push("Unmarried ✓");
  }

  // ── Marital status exact match (for widow pension) ────────────────────────────
  if (e.maritalStatus) {
    if (person.maritalStatus !== e.maritalStatus) failures.push(`Marital status: need ${e.maritalStatus}`);
    else reasons.push(`${e.maritalStatus} ✓`);
  }

  // ── Disability ───────────────────────────────────────────────────────────────
  if (e.disabilityMinPercent !== undefined) {
    const dis = parseInt(person.disability) || 0;
    if (dis < e.disabilityMinPercent) failures.push(`Disability ${dis}% < minimum ${e.disabilityMinPercent}%`);
    else reasons.push(`Disability ${dis}% ≥ ${e.disabilityMinPercent}% ✓`);
  }

  // ── Caste (ONLY for caste-specific pension schemes) ────────────────────────────
  // If no caste requirement → open to all castes, never fail
  if (e.caste && e.caste.length > 0) {
    const personCaste = person.caste || "General";
    if (!e.caste.includes(personCaste)) failures.push(`Caste ${personCaste} not in [${e.caste.join(", ")}]`);
    else reasons.push(`Caste: ${personCaste} ✓`);
  }

  // ── Bank account ──────────────────────────────────────────────────────────────
  // Only fail if explicitly false (not just undefined/null)
  if (e.requiresBankAccount) {
    if (person.bankAccount === false) failures.push("Needs bank account");
    else reasons.push("Has bank account ✓");
  }

  // ── stateWB — always true for this pilot (pre-filled West Bengal) ─────────────
  // Never fail on stateWB in this MVP — all workers are in WB
  if (e.stateWB) {
    reasons.push("West Bengal resident ✓");
  }

  return { eligible: failures.length === 0, reasons, failures };
}

function getEligibleSchemes(household) {
  const { worker, members } = household;
  const results = [];

  // Show ALL schemes the person is demographically eligible for.
  // Do NOT block on bank account, documents, or income when not entered (= 0).
  // Income checks only apply when income was actually entered > 0.
  const normPerson = (p, relation) => ({
    name:          p.name || relation,
    age:           parseInt(p.age) || 0,
    gender:        (p.gender || "male").toLowerCase(),
    caste:         p.caste || "General",
    maritalStatus: p.maritalStatus || "married",
    disability:    parseInt(p.disability) || 0,
    bankAccount:   true,
    farmer:        !!p.farmer,
    unorganised:   p.unorganised !== false,
    student:       !!p.student,
    pregnant:      !!p.pregnant,
    firstChild:    !!p.firstChild,
    relation,
    phone:         p.phone || worker?.phone || "",
    aadhaarLast4:  p.aadhaarLast4 || worker?.aadhaarLast4 || "",
    bankName:      p.bankName || worker?.bankName || "",
    bankAccountNo: p.bankAccountNo || "",
  });

  // Only block on income if the household actually entered it
  const householdForCheck = {
    ...household,
    monthlyIncome: parseInt(household.monthlyIncome) > 0 ? household.monthlyIncome : 999999,
    annualIncome:  parseInt(household.annualIncome)  > 0 ? household.annualIncome  :
                   parseInt(household.worker?.annualIncome) > 0 ? household.worker.annualIncome : 999999,
  };

  const checkPerson = (person, relation) => {
    const norm = normPerson(person, relation);
    const allSchemes = [...SCHEMES, ...NEW_SCHEMES];
    allSchemes.forEach(scheme => {
      const { eligible, reasons, failures } = checkPersonEligibility(scheme, norm, householdForCheck);
      if (eligible) results.push({ scheme, person: norm, reasons });
    });
  };

  checkPerson(worker, "Worker");
  (members || []).forEach(m => checkPerson(m, m.relation || "Family Member"));

  const seen = new Set();
  return results
    .filter(r => {
      const key = r.scheme.id + "||" + r.person.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.scheme.difficulty - b.scheme.difficulty || b.scheme.benefitScore - a.scheme.benefitScore);
}

// ─── NEW SCHEMES (Kanyashree, PMMVY, Kanya Vivah, NSP, UDID) ─────────────────
const NEW_SCHEMES = [
  {
    id: "kanyashree_k1",
    name: "Kanyashree K1", fullName: "Kanyashree K1 — Annual Scholarship",
    type: "scholarship", benefit: "₹1,000/year", benefitScore: 72,
    applies_to: ["family"], category: "West Bengal",
    eligibility: { gender: "female", minAge: 13, maxAge: 17, student: true, maritalStatus: "unmarried", annualIncomeMax: 120000, stateWB: true },
    docs: ["Aadhaar", "School ID / Enrollment Certificate", "Bank Account (girl's own)", "Income Certificate", "Passport Photo"],
    difficulty: 25, difficultyLabel: "Easy",
    icon: "🎓",
    description_en: "Annual scholarship of ₹1,000 for unmarried girls aged 13–18 enrolled in Class 8 or above.",
    description_bn: "অষ্টম শ্রেণী বা তার উপরে পড়া ১৩–১৮ বছরের অবিবাহিত মেয়েদের বার্ষিক ₹১,০০০ বৃত্তি।",
    description_hi: "कक्षा 8 या उससे ऊपर में पढ़ने वाली 13–18 वर्ष की अविवाहित लड़कियों के लिए ₹1,000 वार्षिक छात्रवृत्ति।",
  },
  {
    id: "kanyashree_k2",
    name: "Kanyashree K2", fullName: "Kanyashree K2 — One-Time Grant",
    type: "scholarship", benefit: "₹25,000 one-time", benefitScore: 88,
    applies_to: ["family"], category: "West Bengal",
    eligibility: { gender: "female", minAge: 18, maxAge: 19, student: true, maritalStatus: "unmarried", annualIncomeMax: 120000, stateWB: true },
    docs: ["Aadhaar", "Institution Enrollment Certificate", "Bank Account (girl's own)", "Income Certificate", "Age Proof"],
    difficulty: 28, difficultyLabel: "Easy",
    icon: "🌸",
    description_en: "One-time grant of ₹25,000 for unmarried girls aged 18–19 enrolled in education/vocational training.",
    description_bn: "১৮–১৯ বছরের অবিবাহিত মেয়েদের জন্য শিক্ষা/প্রশিক্ষণে নথিভুক্ত থাকলে ₹২৫,০০০ এককালীন অনুদান।",
    description_hi: "शिक्षा/व्यावसायिक प्रशिक्षण में नामांकित 18–19 वर्ष की अविवाहित लड़कियों के लिए ₹25,000 एकमुश्त अनुदान।",
  },
  {
    id: "pmmvy",
    name: "PMMVY", fullName: "Pradhan Mantri Matru Vandana Yojana",
    type: "maternity", benefit: "₹5,000 in 3 instalments", benefitScore: 80,
    applies_to: ["family"], category: "Central",
    eligibility: { gender: "female", pregnant: true, firstChild: true },
    docs: ["Aadhaar", "Bank Account (mother's own)", "MCP Card / Hospital Registration"],
    difficulty: 30, difficultyLabel: "Easy",
    icon: "🤱",
    description_en: "₹5,000 maternity benefit in 3 instalments for first live birth — credited directly to mother's bank account.",
    description_bn: "প্রথম সন্তানের জন্মে মায়ের ব্যাংক অ্যাকাউন্টে সরাসরি ₹৫,০০০ তিন কিস্তিতে।",
    description_hi: "पहले जीवित बच्चे के जन्म पर माँ के बैंक खाते में ₹5,000 तीन किस्तों में।",
  },
  {
    id: "kanya_vivah",
    name: "Kanya Vivah", fullName: "Kanya Vivah Yojana (WB Unorganised Workers)",
    type: "marriage_grant", benefit: "₹25,000 one-time", benefitScore: 85,
    applies_to: ["worker"], category: "West Bengal",
    eligibility: { unorganisedWorker: true, stateWB: true, hasMarriageDaughter: true },
    docs: ["Worker's Aadhaar", "Daughter's Aadhaar", "Marriage Certificate", "Age Proof (daughter ≥18)", "WB Domicile / Address Proof", "Income Certificate (≤ ₹6,500/month)"],
    difficulty: 45, difficultyLabel: "Medium",
    icon: "💐",
    description_en: "₹25,000 one-time grant from WB Labour Dept for registered unorganised worker at time of daughter's marriage.",
    description_bn: "নথিভুক্ত অসংগঠিত শ্রমিকের মেয়ের বিয়েতে WB Labour Dept থেকে ₹২৫,০০০ এককালীন অনুদান।",
    description_hi: "पंजीकृत असंगठित श्रमिक की बेटी की शादी पर WB Labour Dept से ₹25,000 एकमुश्त अनुदान।",
  },
  {
    id: "nsp_prematric",
    name: "NSP Pre-Matric", fullName: "NSP Pre-Matric Scholarship (SC/ST/OBC)",
    type: "scholarship", benefit: "₹225–525/month + ₹750–1000 ad-hoc", benefitScore: 65,
    applies_to: ["family"], category: "Central",
    eligibility: { student: true, minAge: 9, maxAge: 18, casteInList: ["SC","ST","OBC-A","OBC-B"], annualIncomeMax: 250000 },
    docs: ["Aadhaar", "Caste Certificate", "Income Certificate", "Bank Account (student's own)", "School Bonafide Certificate", "Previous Year Marksheet"],
    difficulty: 40, difficultyLabel: "Medium",
    icon: "📚",
    description_en: "Central scholarship for SC/ST/OBC students in Class 9–10. Monthly stipend + ad-hoc grant for books and uniforms.",
    description_bn: "SC/ST/OBC ছাত্রছাত্রীদের জন্য কেন্দ্রীয় বৃত্তি (নবম-দশম শ্রেণী)। মাসিক ভাতা + বইখাতার অনুদান।",
    description_hi: "SC/ST/OBC छात्रों के लिए केंद्रीय छात्रवृत्ति (कक्षा 9–10)। मासिक वजीफा + पुस्तक अनुदान।",
  },
  {
    id: "udid_card",
    name: "UDID Card", fullName: "Unique Disability ID (UDID) Card",
    type: "document_service", benefit: "Unlocks all disability schemes", benefitScore: 90,
    applies_to: ["worker","family"], category: "Central",
    eligibility: { disability: true },
    docs: ["Aadhaar", "Disability Certificate from Govt Hospital (CMO)", "Passport Photo", "Address Proof"],
    difficulty: 35, difficultyLabel: "Easy",
    icon: "🪪",
    description_en: "Unique Disability ID — mandatory prerequisite for Manabik pension, disability scholarships, and all disability benefits.",
    description_bn: "অনন্য প্রতিবন্ধী পরিচয়পত্র — মানবিক পেনশন, প্রতিবন্ধী বৃত্তি সহ সমস্ত প্রতিবন্ধী সুবিধার জন্য বাধ্যতামূলক।",
    description_hi: "विकलांगता के सभी लाभों के लिए अनिवार्य पहचान पत्र।",
  },
];

// ─── DOCUMENT HEALTH ENGINE ───────────────────────────────────────────────────
const ASANSOL_ASK = {
  name: "Aadhaar Seva Kendra — Asansol",
  address: "Ground Floor, Surya Sen Park, 170 G.T. Road (West), Asansol, West Bengal — 713304",
  hours: "9:30 AM – 5:30 PM (Mon–Sat). Last token: 5:30 PM.",
  distance: "~12 km from Jamuria",
  fees: "Demographic update (name/address/DOB/mobile): ₹50 | Biometric update: ₹100",
  bookingUrl: "https://bookappointment.uidai.gov.in/",
  locatorUrl: "https://appointments.uidai.gov.in/easearch.aspx",
};

function generateDocIssues(worker, members, questionnaire) {
  const issues = [];
  let id = 1;
  const add = (cfg) => issues.push({ id: id++, status: "open", ...cfg });

  const w = worker || {};
  const q = questionnaire || {};

  // ── WORKER: Name mismatch Aadhaar vs Bank ──────────────────────────────────
  if (w.aadhaarName && w.bankAccountName) {
    const norm = s => (s||"").toLowerCase().replace(/[^a-z]/g,"");
    if (norm(w.aadhaarName) !== norm(w.bankAccountName)) {
      add({
        person: w.name, personType: "Worker",
        severity: "critical", category: "name_mismatch", code: "NAME_AADHAAR_BANK",
        title: "Name mismatch: Aadhaar ≠ Bank account",
        detail: `Aadhaar: "${w.aadhaarName}" vs Bank: "${w.bankAccountName}". Even minor spelling differences silently fail DBT transfers.`,
        paths: [
          {
            id: "bank_kyc", label: "Fix at Bank (faster)", icon: "🏦", recommended: true, days: "3–7 days",
            steps: ["Visit bank branch with original Aadhaar card","Ask for 'KYC Name Correction' form at the counter","Submit form + self-attested Aadhaar photocopy","Bank updates within 3–7 working days","Collect updated passbook as confirmation"],
            documents: ["Original Aadhaar card (for verification)", "Aadhaar photocopy — self-attested with signature", "Bank passbook (to confirm account number)"],
            generates: ["bank_name_correction_letter"],
          },
          {
            id: "aadhaar_seva", label: "Fix Aadhaar name (if bank is wrong)", icon: "🪪", days: "15–30 days",
            steps: ["Book appointment at Asansol Seva Kendra","Carry original documents listed below","Biometric verification done at centre","₹50 fee paid at cash counter","Update reflects in 15–30 days — download updated e-Aadhaar from myaadhaar.uidai.gov.in"],
            documents: ["Original Aadhaar", "Any ONE: PAN card / Passport / Voter ID / Driving Licence / Marriage certificate (for name change after marriage)"],
            generates: ["seva_kendra_docket","appointment_cheatsheet"],
            sevaKendra: true,
          },
        ],
        blockedSchemes: ["PMJJBY","PMSBY","APY","PM-SYM","Lakshmir Bhandar","All DBT schemes"],
      });
    }
  }

  // ── WORKER: Aadhaar address not WB ────────────────────────────────────────
  if (w.aadhaarAddressState && w.aadhaarAddressState !== "West Bengal") {
    add({
      person: w.name, personType: "Worker",
      severity: "critical", category: "aadhaar_address", code: "AADHAAR_ADDR_OUTSTATE",
      title: `Aadhaar address: ${w.aadhaarAddressState} (not WB)`,
      detail: `Worker enrolled Aadhaar in ${w.aadhaarAddressState}. All West Bengal state schemes require a WB address. This is the single biggest blocker for migrant workers.`,
      paths: [
        {
          id: "employer_letter", label: "Employer letter (immediate)", icon: "📄", recommended: true, days: "Same day",
          steps: ["Generate MB Sponge employer address letter (below)","Get it signed by Welfare Officer","Worker carries letter to Aadhaar SSUP portal","Opens myaadhaar.uidai.gov.in → Update Address → uploads employer letter","SRN generated — update in 15–30 days","Most WB scheme portals accept the letter as address proof IMMEDIATELY while waiting"],
          documents: ["Employer address letter (generated below — get Welfare Officer signature)", "Worker's Aadhaar number (for SSUP portal)","Aadhaar-linked mobile (for OTP — if not linked, use Seva Kendra path instead)"],
          generates: ["employer_address_letter","ssup_cheatsheet"],
          portalUrl: "https://myaadhaar.uidai.gov.in/ssup",
          portalLabel: "Open myAadhaar SSUP →",
        },
        {
          id: "seva_kendra_address", label: "Update at Seva Kendra (if mobile not linked)", icon: "🪪", days: "15–30 days",
          steps: ["Book appointment at Asansol Seva Kendra","Carry employer letter OR rent agreement as address proof","Biometric verification done at centre — ₹50 fee","Address updated in 15–30 days"],
          documents: ["Aadhaar card (original)","ONE address proof: Employer letter / Rent agreement / Utility bill with WB address"],
          generates: ["seva_kendra_docket","appointment_cheatsheet"],
          sevaKendra: true,
        },
      ],
      blockedSchemes: ["Swasthya Sathi","Lakshmir Bhandar","Kanyashree","WB Old Age Pension","Tapasili Bandhu","Jai Johar","Rupashree"],
    });
  }

  // ── WORKER: Aadhaar mobile not linked ────────────────────────────────────
  if (w.aadhaarMobileLinked === false) {
    add({
      person: w.name, personType: "Worker",
      severity: "critical", category: "aadhaar_mobile", code: "AADHAAR_MOBILE_UNLINKED",
      title: "Aadhaar mobile number not linked",
      detail: "No mobile linked to Aadhaar. OTP-based schemes (PM-SYM, EPFO e-KYC) will fail. DBT payment alerts won't reach worker. SSUP online updates also blocked.",
      paths: [
        {
          id: "seva_kendra_mobile", label: "Link mobile at Seva Kendra", icon: "🪪", recommended: true, days: "7–10 days",
          steps: ["Book appointment at Asansol Seva Kendra (link below)","This is BIOMETRIC — ₹100 fee (fingerprint/iris required for mobile linking)","Carry Aadhaar + any photo ID + mobile number to be linked","Mobile linked same day at centre, reflects in 7–10 days in UIDAI database"],
          documents: ["Aadhaar card (original)","Any photo ID (Voter ID / PAN / Driving Licence)","Mobile number to be linked — ensure it's active and worker will keep it permanently"],
          generates: ["seva_kendra_docket","appointment_cheatsheet"],
          sevaKendra: true,
          note: "⚠️ Cannot be done online — biometric verification mandatory for mobile linking",
        },
      ],
      blockedSchemes: ["PM-SYM (Aadhaar OTP required)","EPFO e-KYC","myAadhaar SSUP address updates","Any scheme requiring Aadhaar authentication"],
    });
  }

  // ── WORKER: Bank not Aadhaar-seeded ───────────────────────────────────────
  if (w.bankAccount && w.bankAadhaarSeeded === false) {
    add({
      person: w.name, personType: "Worker",
      severity: "high", category: "bank_dbt", code: "BANK_NOT_SEEDED",
      title: "Bank account not Aadhaar-seeded — DBT transfers will fail",
      detail: "Bank account exists but Aadhaar is not linked for Direct Benefit Transfer. All cash scheme payments will bounce back silently — worker never receives the money.",
      paths: [
        {
          id: "bank_seeding_online", label: "Do online (SBI net banking)", icon: "💻", recommended: true, days: "1–3 days",
          steps: ["Login to onlinesbi.sbi.co.in → My Accounts → Link Aadhaar","Enter Aadhaar number → OTP sent to registered mobile","Submit — Aadhaar seeded within 1–3 days","Confirmation SMS received"],
          documents: ["Net banking login credentials","Aadhaar number","Mobile number registered with bank"],
          portalUrl: "https://onlinesbi.sbi.co.in",
          portalLabel: "Open SBI Net Banking →",
          generates: ["bank_seeding_cheatsheet"],
        },
        {
          id: "bank_seeding_branch", label: "At bank branch", icon: "🏦", days: "1–3 days",
          steps: ["Visit bank branch (any branch — doesn't have to be home branch)","Ask for 'Aadhaar seeding form' or 'DBT linkage form'","Submit form + Aadhaar photocopy","Confirmation within 1–3 working days"],
          documents: ["Aadhaar photocopy — self-attested","Bank passbook / account number"],
          generates: ["bank_seeding_letter"],
        },
      ],
      blockedSchemes: ["Lakshmir Bhandar ₹1,000/month","Old Age Pension","PMMVY","Tapasili Bandhu","All direct cash transfer schemes"],
    });
  }

  // ── WORKER: Caste cert expired ─────────────────────────────────────────────
  if (w.casteCert && w.casteCertExpiry) {
    const monthsOld = (new Date() - new Date(w.casteCertExpiry)) / (1000*60*60*24*30);
    if (monthsOld > 0) {
      add({
        person: w.name, personType: "Worker",
        severity: "high", category: "document_expired", code: "CASTE_CERT_EXPIRED",
        title: `${w.caste} caste certificate expired (${Math.round(monthsOld)} months ago)`,
        detail: `Certificate issued ${w.casteCertExpiry}. Most schemes require a certificate from the current financial year. Using expired cert will result in portal rejection.`,
        paths: [
          {
            id: "edistrict_caste", label: "Apply online — e-District portal", icon: "🌐", recommended: true, days: "15–30 days",
            steps: ["Open edistrict.wb.gov.in","Register / login → Services → Social Welfare → Caste Certificate","Fill application with Aadhaar details","Upload documents (scanned copies)","Submit — Application ID generated","Certificate issued within 15–30 days, downloadable from portal"],
            documents: ["Aadhaar card (scan)","Father's caste certificate or old caste certificate (scan)","Passport photo (scan)","Self-declaration of caste"],
            portalUrl: "https://edistrict.wb.gov.in",
            portalLabel: "Open e-District Portal →",
            generates: ["caste_cert_cheatsheet"],
          },
          {
            id: "bdo_caste", label: "BDO office (offline)", icon: "🏛️", days: "15–30 days",
            steps: ["Visit BDO office, Jamuria Block","Ask for Caste Certificate application form","Submit form + documents to Revenue department counter","Collect certificate in 15–30 days or check edistrict.wb.gov.in for status"],
            documents: ["Aadhaar photocopy (self-attested)","Father's caste certificate (original + photocopy)","Passport photo (2 copies)","Self-declaration (available at BDO office)"],
            generates: ["bdo_caste_docket"],
          },
        ],
        blockedSchemes: ["Tapasili Bandhu (SC pension)","SC slab of Lakshmir Bhandar (₹1,200/month)","Oasis Scholarship","NSP SC/ST scholarships"],
      });
    }
  }

  // ── WORKER: Income cert missing ──────────────────────────────────────────
  if (w.incomeCertAvailable === false) {
    add({
      person: w.name, personType: "Worker",
      severity: "medium", category: "document_missing", code: "INCOME_CERT_MISSING",
      title: "Income certificate not available",
      detail: "No income certificate on record. Required by SVMCM, Rupashree, Kanyashree income verification, and NSP scholarships.",
      paths: [
        {
          id: "edistrict_income", label: "Apply online — e-District portal", icon: "🌐", recommended: true, days: "15–30 days",
          steps: ["Open edistrict.wb.gov.in → Services → Revenue → Income Certificate","Fill details: name, address, occupation, annual income amount","Upload Aadhaar + salary slip or self-declaration","Submit — Application ID generated","Download certificate when issued"],
          documents: ["Aadhaar card (scan)","Salary slip or employer income letter (scan)","Ration card (scan, if available)"],
          portalUrl: "https://edistrict.wb.gov.in",
          portalLabel: "Open e-District Portal →",
          generates: ["income_cert_cheatsheet"],
        },
      ],
      blockedSchemes: ["SVMCM Scholarship","Rupashree Prakalpa","Kanyashree income verification","NSP Scholarships"],
    });
  }

  // ── WORKER: EPFO + PM-SYM conflict ───────────────────────────────────────
  if (w.epfoCovered && w.unorganised) {
    add({
      person: w.name, personType: "Worker",
      severity: "info", category: "eligibility_conflict", code: "EPFO_PMSYM_CONFLICT",
      title: "EPFO-covered worker — PM-SYM not applicable",
      detail: "Worker is covered under EPFO (MB Sponge deducts provident fund). PM-SYM is only for workers NOT covered by EPF/ESIC. Applying would result in certain rejection and waste time.",
      paths: [
        {
          id: "no_action", label: "No action needed", icon: "ℹ️", recommended: true, days: "N/A",
          steps: ["PM-SYM has been automatically removed from eligible schemes","Worker should consider APY (Atal Pension Yojana) as the pension alternative","APY is available to all individuals 18–40 with a bank account regardless of EPFO coverage"],
          documents: [],
          generates: [],
        },
      ],
      blockedSchemes: ["PM-SYM (auto-removed — EPFO-covered worker)"],
    });
  }

  // ── MEMBER ISSUES ──────────────────────────────────────────────────────────
  (members || []).forEach(m => {
    // Woman: no own bank account
    if (m.gender === "female" && (!m.bankAccount || !m.bankInOwnName)) {
      add({
        person: m.name, personType: m.relation,
        severity: "critical", category: "bank_missing", code: "WOMAN_NO_OWN_ACCOUNT",
        title: `${m.name}: No bank account in own name`,
        detail: `Lakshmir Bhandar, Kanyashree K2, Rupashree, and PMMVY all require the benefit credited to the woman's own sole account. Joint accounts or husband's accounts are rejected.`,
        paths: [
          {
            id: "jan_dhan", label: "Open Jan Dhan account", icon: "🏦", recommended: true, days: "Same day",
            steps: ["Visit any nationalised bank branch (nearest: SBI Jamuria Road / Bank of Baroda Asansol)","Ask for 'Pradhan Mantri Jan Dhan Yojana account opening' — zero balance, no fees","Fill account opening form — agent can pre-fill from our system below","Submit form + Aadhaar (original for verification + photocopy) + 2 passport photos","Account opened same day — passbook issued on the spot","Return in 7–10 days to collect RuPay debit card"],
            documents: ["Aadhaar card — original (for verification) + 1 self-attested photocopy","2 recent passport-size photographs","This pre-filled form (generated below)"],
            generates: ["jan_dhan_prefill","jan_dhan_docket"],
          },
        ],
        blockedSchemes: ["Lakshmir Bhandar (₹1,000–1,200/month)","PMMVY (₹5,000 maternity)","Rupashree (₹25,000 marriage grant)","Kanyashree K2 (₹25,000)"],
      });
    }

    // Wife: maiden name on Aadhaar
    if (m.relation === "wife" && m.aadhaarName && m.name &&
        m.aadhaarName.toLowerCase().split(" ").pop() !== m.name.toLowerCase().split(" ").pop()) {
      add({
        person: m.name, personType: m.relation,
        severity: "high", category: "name_mismatch", code: "WIFE_MAIDEN_NAME",
        title: `${m.name}: Aadhaar shows maiden name "${m.aadhaarName}"`,
        detail: "Aadhaar still shows pre-marriage surname. Causes mismatch with marriage certificate for widow/married women schemes. Also blocks name match with bank account.",
        paths: [
          {
            id: "bundle_workaround", label: "Submit document bundle (immediate workaround)", icon: "📋", recommended: true, days: "Immediate",
            steps: ["Many BDOs and scheme portals accept: Aadhaar (maiden name) + Marriage Certificate together","Generate a 'Name Variance Explanation Letter' (below) — explains the name change","Submit all three documents as a bundle with applications","Works for: Lakshmir Bhandar, PMMVY, most WB schemes"],
            documents: ["Aadhaar card (showing maiden name)","Marriage certificate","Name variance explanation letter (generated below)"],
            generates: ["name_variance_letter"],
          },
          {
            id: "aadhaar_name_change", label: "Permanent fix: Update Aadhaar name", icon: "🪪", days: "15–30 days",
            steps: ["Book appointment at Asansol Seva Kendra","Carry marriage certificate as proof of name change","Biometric verification — ₹50 fee","Name updated in 15–30 days"],
            documents: ["Aadhaar card (original)","Marriage certificate (original + photocopy)","Optional: Gazette notification if name formally changed"],
            generates: ["seva_kendra_docket","appointment_cheatsheet"],
            sevaKendra: true,
          },
        ],
        blockedSchemes: ["Lakshmir Bhandar (name verification)","WB Widow Pension (if applicable)"],
      });
    }

    // Girl: needs own account for Kanyashree
    if (m.gender === "female" && m.student && m.age >= 13 && m.age <= 18 && m.maritalStatus === "unmarried" && (!m.bankAccount || !m.bankInOwnName)) {
      add({
        person: m.name, personType: m.relation,
        severity: "high", category: "bank_missing", code: "KANYASHREE_NEEDS_ACCOUNT",
        title: `${m.name}: Needs own bank account for Kanyashree K1`,
        detail: `Kanyashree scholarship (₹1,000/year) requires direct credit to girl's own account. School can also facilitate account opening — many schools have tie-ups with SBI/PNB.`,
        paths: [
          {
            id: "school_account", label: "Through school (easiest)", icon: "🏫", recommended: true, days: "Same day",
            steps: ["Contact school teacher / principal — inform them daughter needs Kanyashree bank account","Most WB government schools have an account opening camp arrangement with local bank","School provides letter to bank + facilitates minor account opening","Documents: Aadhaar + school ID + parent Aadhaar as guardian"],
            documents: ["Daughter's Aadhaar card","School ID card / bonafide certificate","Parent's Aadhaar (as guardian for minor account)","1 passport photo"],
            generates: ["kanyashree_bank_docket"],
          },
          {
            id: "jan_dhan_minor", label: "Open minor Jan Dhan account at bank", icon: "🏦", days: "Same day",
            steps: ["Visit any nationalised bank","Request minor account / Jan Dhan account with parent as guardian","Submit documents below","Account opened same day"],
            documents: ["Daughter's Aadhaar card (original + photocopy)","Parent's Aadhaar (as guardian)","2 passport photos of daughter","School ID card"],
            generates: ["jan_dhan_docket"],
          },
        ],
        blockedSchemes: ["Kanyashree K1 (₹1,000/year)","Kanyashree K2 (₹25,000 at age 18)","NSP Scholarship"],
      });
    }
  });

  return issues;
}

// ── DOCUMENT GENERATOR ────────────────────────────────────────────────────────
function generateDocument(type, worker, member, appSettings, questionnaire) {
  const today = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" });
  const workerAddr = "Factory Quarters, MB Sponge & Power Limited, Jamuria, Paschim Bardhaman, West Bengal — 713337";
  const person = member || worker || {};
  const welfareOfficer = appSettings?.welfareOfficer || "Welfare Officer";

  const docs = {
    employer_address_letter: {
      title: "Employer Address Certificate",
      content: `
        <div class="letterhead">
          <div class="logo">MB SPONGE & POWER LIMITED</div>
          <div class="sub">Jamuria, Paschim Bardhaman, West Bengal — 713337 | GSTIN: 19AAACM1234F1Z5</div>
          <div class="divider"></div>
        </div>
        <p class="ref">Ref: MBSPL/HR/ADDR/${new Date().getFullYear()}/${Math.floor(Math.random()*9000)+1000} &nbsp;&nbsp;&nbsp; Date: ${today}</p>
        <h2>TO WHOMSOEVER IT MAY CONCERN</h2>
        <h3>Subject: Certificate of Employment and Residential Address</h3>
        <p>This is to certify that <strong>${worker?.name || "[Worker Name]"}</strong>, Aadhaar No. XXXX-XXXX-${worker?.aadhaarLast4 || "XXXX"}, is employed as a worker at <strong>MB Sponge & Power Limited, Jamuria, Paschim Bardhaman</strong> since ${worker?.joiningYear || "[Year]"}.</p>
        <p>The said employee is currently residing at the following address in West Bengal:</p>
        <div class="address-box">
          ${workerAddr}
        </div>
        <p>This certificate is issued at the request of the employee for the purpose of updating address in Aadhaar records / availing of government welfare schemes administered by the Government of West Bengal.</p>
        <p>MB Sponge & Power Limited requests all concerned authorities to accept this certificate as a valid proof of West Bengal residential address.</p>
        <div class="signature">
          <p>&nbsp;</p><p>&nbsp;</p>
          <p><strong>________________________</strong></p>
          <p><strong>${welfareOfficer}</strong></p>
          <p>Welfare Officer / Jan Setu Pratinidhi</p>
          <p>MB Sponge & Power Limited, Jamuria</p>
          <p>Date: ${today}</p>
        </div>
        <div class="stamp-note">[ Affix Company Seal ]</div>
      `
    },
    bank_name_correction_letter: {
      title: "Bank KYC Name Correction Request",
      content: `
        <p class="ref">Date: ${today}</p>
        <p><strong>To,</strong><br>The Branch Manager,<br>${worker?.bankName || "Bank Branch"},<br>Asansol / Jamuria, West Bengal</p>
        <h3>Subject: Request for Correction of Name in Bank Account Records</h3>
        <p>Dear Sir/Madam,</p>
        <p>I, <strong>${worker?.name || "[Name]"}</strong>, hold a savings account (Account No: ${worker?.bankAccountNo || "XXXXXXXXXX"}) at your branch.</p>
        <p>I have noticed that my name is recorded as <strong>"${worker?.bankAccountName || "[Bank Name]"}"</strong> in your records. However, my correct name as per my Aadhaar card is <strong>"${worker?.aadhaarName || "[Aadhaar Name]"}"</strong>.</p>
        <p>I request you to kindly update my name in the bank records to match my Aadhaar card, to enable Direct Benefit Transfer (DBT) of government scheme benefits to my account.</p>
        <p>I am enclosing a self-attested copy of my Aadhaar card as supporting document.</p>
        <p>Thanking you,</p>
        <div class="signature">
          <p>&nbsp;</p>
          <p><strong>________________________</strong></p>
          <p>${worker?.name || "[Name]"}</p>
          <p>Account No: ${worker?.bankAccountNo || "XXXXXXXXXX"}</p>
          <p>Mobile: ${worker?.phone || "[Phone]"}</p>
          <p>Date: ${today}</p>
        </div>
      `
    },
    jan_dhan_prefill: {
      title: "Jan Dhan Account — Pre-filled Details Card",
      content: `
        <div class="cheatsheet">
          <div class="cs-header">🏦 Jan Dhan Account Opening — Pre-filled Details</div>
          <div class="cs-sub">Carry this card to the bank. Show it to the bank officer to help fill the form.</div>
          <table class="cs-table">
            <tr><td class="cs-label">Full Name</td><td class="cs-value"><strong>${person.name || "[Name]"}</strong></td></tr>
            <tr><td class="cs-label">Date of Birth</td><td class="cs-value">${person.dob || "[DOB — enter from Aadhaar]"}</td></tr>
            <tr><td class="cs-label">Gender</td><td class="cs-value">${person.gender === "female" ? "Female" : "Male"}</td></tr>
            <tr><td class="cs-label">Aadhaar Number</td><td class="cs-value">XXXX-XXXX-${person.aadhaarLast4 || "XXXX"} (carry original)</td></tr>
            <tr><td class="cs-label">Mobile Number</td><td class="cs-value">${person.phone || worker?.phone || "[Mobile]"}</td></tr>
            <tr><td class="cs-label">Address</td><td class="cs-value">${workerAddr}</td></tr>
            <tr><td class="cs-label">Account Type</td><td class="cs-value">Jan Dhan Savings Account (PMJDY) — Zero Balance</td></tr>
            <tr><td class="cs-label">Nominee</td><td class="cs-value">${worker?.name || "[Worker name — head of household]"} (Husband / Father)</td></tr>
            <tr><td class="cs-label">Nominee Relation</td><td class="cs-value">${person.relation === "wife" ? "Husband" : "Father"}</td></tr>
          </table>
          <div class="cs-note">📎 Documents to carry: Aadhaar (original + 1 photocopy self-attested) · 2 passport photos</div>
          <div class="cs-note">💬 What to say at counter: "Jan Dhan account kholna hai, documents ready hain" (জন ধন অ্যাকাউন্ট খুলতে এসেছি)</div>
        </div>
      `
    },
    appointment_cheatsheet: {
      title: "Aadhaar Seva Kendra — Appointment Booking Guide",
      content: `
        <div class="cheatsheet">
          <div class="cs-header">🪪 Aadhaar Appointment Booking — Step by Step</div>
          <div class="cs-kendra">
            <strong>📍 ${ASANSOL_ASK.name}</strong><br>
            ${ASANSOL_ASK.address}<br>
            🕐 ${ASANSOL_ASK.hours}<br>
            📏 ${ASANSOL_ASK.distance} from Jamuria<br>
            💰 ${ASANSOL_ASK.fees}
          </div>
          <div class="cs-steps">
            <div class="cs-step"><span class="step-num">1</span>Open: <strong>bookappointment.uidai.gov.in</strong> (use laptop at camp)</div>
            <div class="cs-step"><span class="step-num">2</span>Select city: <strong>Asansol</strong> → Click "Proceed to Book Appointment"</div>
            <div class="cs-step"><span class="step-num">3</span>Select service: <strong>"Update Existing Aadhaar Details"</strong></div>
            <div class="cs-step"><span class="step-num">4</span>Enter mobile number: <strong>${worker?.phone || "[Worker mobile]"}</strong> (does NOT need to be Aadhaar-linked)</div>
            <div class="cs-step"><span class="step-num">5</span>Enter OTP received on mobile → Verify</div>
            <div class="cs-step"><span class="step-num">6</span>Select update type: <strong>[Name / Mobile / Address / DOB — as applicable]</strong></div>
            <div class="cs-step"><span class="step-num">7</span>Choose date & time slot → Confirm</div>
            <div class="cs-step"><span class="step-num">8</span>Note Appointment ID → Print or screenshot this page</div>
            <div class="cs-step"><span class="step-num">9</span>Visit Seva Kendra on appointment day — arrive 10 min early</div>
            <div class="cs-step"><span class="step-num">10</span>Carry: Appointment printout + Original documents + ₹50–₹100 cash for fee</div>
          </div>
          <div class="cs-note">⚠️ Maximum 4 appointments per mobile number per month. Book for multiple family members using the same mobile.</div>
        </div>
      `
    },
    seva_kendra_docket: {
      title: "Aadhaar Seva Kendra — Visit Docket",
      content: `
        <div class="docket">
          <div class="docket-header">JAN SETU — AADHAAR SEVA KENDRA VISIT DOCKET</div>
          <div class="docket-ref">Ref: ${Math.random().toString(36).substr(2,8).toUpperCase()} · Generated: ${today}</div>
          <table class="docket-table">
            <tr><th colspan="2">Person Details</th></tr>
            <tr><td>Name</td><td><strong>${person.name || worker?.name}</strong></td></tr>
            <tr><td>Aadhaar Last 4</td><td>XXXX-XXXX-${person.aadhaarLast4 || worker?.aadhaarLast4 || "XXXX"}</td></tr>
            <tr><td>Mobile</td><td>${person.phone || worker?.phone || "[Mobile]"}</td></tr>
            <tr><th colspan="2">Seva Kendra</th></tr>
            <tr><td>Name</td><td>${ASANSOL_ASK.name}</td></tr>
            <tr><td>Address</td><td>${ASANSOL_ASK.address}</td></tr>
            <tr><td>Hours</td><td>${ASANSOL_ASK.hours}</td></tr>
            <tr><td>Fee</td><td>${ASANSOL_ASK.fees}</td></tr>
          </table>
          <div class="checklist-box">
            <strong>✅ Documents to carry (check before leaving):</strong>
            <label><input type="checkbox"> Aadhaar card — ORIGINAL (not photocopy — original required for biometric)</label>
            <label><input type="checkbox"> Supporting document (as per issue type — see list below)</label>
            <label><input type="checkbox"> Cash: ₹50 (demographic) or ₹100 (biometric) + extra for e-Aadhaar print ₹30</label>
            <label><input type="checkbox"> This printed docket — show to operator at counter</label>
            <label><input type="checkbox"> Appointment printout or ID (if booked online)</label>
          </div>
          <div class="cs-note">📞 UIDAI Helpline: 1947 (toll-free) · Appointment: bookappointment.uidai.gov.in</div>
        </div>
      `
    },
    name_variance_letter: {
      title: "Name Variance Explanation Letter",
      content: `
        <p class="ref">Date: ${today}</p>
        <h2>NAME VARIANCE EXPLANATION — SELF DECLARATION</h2>
        <p>I, <strong>${person.name || "[Name]"}</strong>, hereby declare that:</p>
        <ol>
          <li>My Aadhaar card (No. XXXX-XXXX-${person.aadhaarLast4 || "XXXX"}) bears the name <strong>"${person.aadhaarName || "[Aadhaar name]"}"</strong> — my name before marriage.</li>
          <li>After marriage to <strong>${worker?.name || "[Husband name]"}</strong>, I have been using the name <strong>"${person.name || "[Current name]"}"</strong>.</li>
          <li>Both names refer to the same person — myself.</li>
          <li>I am enclosing my marriage certificate as proof of the name change.</li>
        </ol>
        <p>I request the concerned authority to accept both documents together as valid proof of identity.</p>
        <div class="signature">
          <p>&nbsp;</p>
          <p><strong>________________________</strong></p>
          <p>${person.name} (Applicant Signature)</p>
          <p>Date: ${today}</p>
        </div>
        <p><em>Enclosures: 1) Aadhaar card (photocopy) &nbsp; 2) Marriage certificate (photocopy)</em></p>
      `
    },
    jan_dhan_docket: {
      title: "Jan Dhan Account — Bank Visit Docket",
      content: `
        <div class="docket">
          <div class="docket-header">JAN SETU — JAN DHAN ACCOUNT OPENING DOCKET</div>
          <div class="docket-ref">Ref: JD-${Math.floor(Math.random()*9000)+1000} · Generated: ${today}</div>
          <table class="docket-table">
            <tr><th colspan="2">Applicant Details</th></tr>
            <tr><td>Name</td><td><strong>${person.name || "[Name]"}</strong></td></tr>
            <tr><td>Aadhaar Last 4</td><td>XXXX-XXXX-${person.aadhaarLast4 || worker?.aadhaarLast4 || "XXXX"}</td></tr>
            <tr><td>Mobile</td><td>${person.phone || worker?.phone || "[Mobile]"}</td></tr>
            <tr><td>Account Type Needed</td><td><strong>Jan Dhan Savings (PMJDY) — Zero Balance</strong></td></tr>
            <tr><th colspan="2">What to say at counter</th></tr>
            <tr><td colspan="2">"Jan Dhan account kholna hai" / "আমি জন ধন অ্যাকাউন্ট খুলতে এসেছি"</td></tr>
          </table>
          <div class="checklist-box">
            <strong>✅ Documents to carry:</strong>
            <label><input type="checkbox"> Aadhaar card — ORIGINAL (mandatory)</label>
            <label><input type="checkbox"> 2 passport-size photographs</label>
            <label><input type="checkbox"> This docket — show to bank officer</label>
            <label><input type="checkbox"> Mobile phone — for OTP during KYC</label>
          </div>
          <div class="cs-note">💡 Jan Dhan accounts: zero balance, RuPay debit card, ₹2 lakh accident insurance, ₹10,000 overdraft after 6 months. Available at any SBI / UCO / Union Bank branch.</div>
        </div>
      `
    },

    ssup_cheatsheet: {
      title: "Aadhaar Self-Service Update (SSUP) — Step-by-Step Guide",
      content: `
        <div class="cheatsheet">
          <div class="cs-header">💻 Aadhaar SSUP — Online Self-Update Guide</div>
          <div class="cs-sub">For updating name, address, DOB, gender, mobile online at ssup.uidai.gov.in</div>
          <div class="cs-note" style="background:#FADBD8;color:#7A0000">⚠️ Mobile must already be linked to Aadhaar to use SSUP. If not linked, use Seva Kendra instead.</div>
          <div class="cs-steps">
            <div class="cs-step"><span class="step-num">1</span>Open: <strong>ssup.uidai.gov.in</strong> on phone/laptop</div>
            <div class="cs-step"><span class="step-num">2</span>Click <strong>"Proceed to Update Aadhaar"</strong></div>
            <div class="cs-step"><span class="step-num">3</span>Enter Aadhaar number: <strong>XXXX-XXXX-${worker?.aadhaarLast4 || "XXXX"}</strong></div>
            <div class="cs-step"><span class="step-num">4</span>Enter OTP sent to linked mobile: <strong>${worker?.phone || "[Mobile]"}</strong></div>
            <div class="cs-step"><span class="step-num">5</span>Select field to update (Name / Address / DOB / Gender)</div>
            <div class="cs-step"><span class="step-num">6</span>Upload supporting document (self-attested scan/photo)</div>
            <div class="cs-step"><span class="step-num">7</span>Pay ₹50 online (debit/credit card or UPI)</div>
            <div class="cs-step"><span class="step-num">8</span>Note the URN (Update Request Number) — keep for follow-up</div>
            <div class="cs-step"><span class="step-num">9</span>Update processed in 5–7 working days</div>
            <div class="cs-step"><span class="step-num">10</span>Download updated e-Aadhaar from myaadhaar.uidai.gov.in once done</div>
          </div>
          <div class="cs-note">📞 UIDAI Helpline: 1947 (toll-free) · Hours: 7 AM – 11 PM all days</div>
        </div>
      `
    },

    bank_seeding_cheatsheet: {
      title: "Aadhaar–Bank Seeding (DBT) — Online Guide",
      content: `
        <div class="cheatsheet">
          <div class="cs-header">🏦 Aadhaar–Bank Seeding for DBT — Online Steps</div>
          <div class="cs-sub">Link Aadhaar to bank account to receive scheme benefits directly</div>
          <table class="cs-table">
            <tr><td class="cs-label">Account Holder</td><td class="cs-value"><strong>${person.name || "[Name]"}</strong></td></tr>
            <tr><td class="cs-label">Bank</td><td class="cs-value">${worker?.bankName || "[Bank Name & Branch]"}</td></tr>
            <tr><td class="cs-label">Account No.</td><td class="cs-value">${worker?.bankAccountNo || "[Account Number]"}</td></tr>
            <tr><td class="cs-label">Aadhaar (Last 4)</td><td class="cs-value">XXXX-XXXX-${person.aadhaarLast4 || worker?.aadhaarLast4 || "XXXX"}</td></tr>
          </table>
          <div class="cs-steps">
            <div class="cs-step"><span class="step-num">1</span>Open SBI YONO / bank mobile app or net banking</div>
            <div class="cs-step"><span class="step-num">2</span>Go to: <strong>Profile → Aadhaar Seeding / Link Aadhaar</strong></div>
            <div class="cs-step"><span class="step-num">3</span>Enter 12-digit Aadhaar number → Submit</div>
            <div class="cs-step"><span class="step-num">4</span>OTP sent to Aadhaar-linked mobile → Enter OTP</div>
            <div class="cs-step"><span class="step-num">5</span>Seeding confirmed — "Aadhaar linked successfully" message shown</div>
            <div class="cs-step"><span class="step-num">6</span>Verify: Check NPCI mapper at <strong>resident.uidai.gov.in</strong> → "Check Aadhaar & Bank Account Linking Status"</div>
          </div>
          <div class="cs-note">💡 If app unavailable, call bank toll-free: SBI: 1800-11-2211 · UCO: 1800-274-0123</div>
        </div>
      `
    },

    bank_seeding_letter: {
      title: "Aadhaar–Bank Seeding Request Letter",
      content: `
        <p class="ref">Date: ${today}</p>
        <p><strong>To,</strong><br>The Branch Manager,<br>${worker?.bankName || "Bank Branch, Asansol / Jamuria"}<br>West Bengal</p>
        <h3>Subject: Request for Aadhaar Seeding / Linking for DBT</h3>
        <p>Dear Sir/Madam,</p>
        <p>I, <strong>${person.name || "[Name]"}</strong>, hold a savings account (Account No: <strong>${worker?.bankAccountNo || "XXXXXXXXXX"}</strong>) at your branch. My Aadhaar number ends in <strong>${person.aadhaarLast4 || worker?.aadhaarLast4 || "XXXX"}</strong>.</p>
        <p>I request you to kindly link (seed) my Aadhaar number to my bank account to enable receipt of government scheme benefits through Direct Benefit Transfer (DBT).</p>
        <p>I am enclosing a self-attested copy of my Aadhaar card for this purpose.</p>
        <p>Thanking you,</p>
        <div class="signature">
          <p>&nbsp;</p>
          <p><strong>________________________</strong></p>
          <p>${person.name || "[Name]"}</p>
          <p>Account No: ${worker?.bankAccountNo || "XXXXXXXXXX"}</p>
          <p>Mobile: ${person.phone || worker?.phone || "[Mobile]"}</p>
          <p>Date: ${today}</p>
        </div>
        <p><em>Enclosure: Self-attested photocopy of Aadhaar card</em></p>
      `
    },

    caste_cert_cheatsheet: {
      title: "Caste Certificate — e-District Application Guide",
      content: `
        <div class="cheatsheet">
          <div class="cs-header">📜 Caste Certificate — e-District Online Application</div>
          <div class="cs-sub">Apply online at edistrict.wb.gov.in for SC / ST / OBC-A / OBC-B certificate</div>
          <table class="cs-table">
            <tr><td class="cs-label">Applicant</td><td class="cs-value"><strong>${person.name || "[Name]"}</strong></td></tr>
            <tr><td class="cs-label">Caste Applied For</td><td class="cs-value"><strong>${person.caste || worker?.caste || "[Caste Category]"}</strong></td></tr>
            <tr><td class="cs-label">Issuing Authority</td><td class="cs-value">SDO / BDO, Paschim Bardhaman</td></tr>
            <tr><td class="cs-label">Fees</td><td class="cs-value">Free (SC/ST) · ₹50 (OBC)</td></tr>
            <tr><td class="cs-label">Processing Time</td><td class="cs-value">7–15 working days (online)</td></tr>
          </table>
          <div class="cs-steps">
            <div class="cs-step"><span class="step-num">1</span>Open: <strong>edistrict.wb.gov.in</strong> → Register/Login</div>
            <div class="cs-step"><span class="step-num">2</span>Click <strong>"Apply for Certificate"</strong> → Select <strong>"Caste Certificate"</strong></div>
            <div class="cs-step"><span class="step-num">3</span>Fill form: Applicant name, father name, address, caste category</div>
            <div class="cs-step"><span class="step-num">4</span>Upload: Aadhaar (scan) + Ration Card (scan) + Self-declaration</div>
            <div class="cs-step"><span class="step-num">5</span>Pay fee online (OBC: ₹50; SC/ST: Free)</div>
            <div class="cs-step"><span class="step-num">6</span>Note Application Reference Number</div>
            <div class="cs-step"><span class="step-num">7</span>Track status at edistrict.wb.gov.in</div>
            <div class="cs-step"><span class="step-num">8</span>Download digitally signed certificate once approved</div>
          </div>
          <div class="cs-note">📎 Documents needed: Aadhaar · Ration Card · Father's Caste Certificate (if available) · Passport photo</div>
        </div>
      `
    },

    bdo_caste_docket: {
      title: "BDO Office — Caste Certificate Visit Docket",
      content: `
        <div class="docket">
          <div class="docket-header">JAN SETU — BDO VISIT DOCKET (CASTE CERTIFICATE)</div>
          <div class="docket-ref">Ref: BDO-${Math.floor(Math.random()*9000)+1000} · Generated: ${today}</div>
          <table class="docket-table">
            <tr><th colspan="2">Applicant Details</th></tr>
            <tr><td>Name</td><td><strong>${person.name || "[Name]"}</strong></td></tr>
            <tr><td>Aadhaar Last 4</td><td>XXXX-XXXX-${person.aadhaarLast4 || worker?.aadhaarLast4 || "XXXX"}</td></tr>
            <tr><td>Caste Needed</td><td><strong>${person.caste || worker?.caste || "[SC/ST/OBC-A/OBC-B]"}</strong></td></tr>
            <tr><th colspan="2">BDO Office</th></tr>
            <tr><td>Name</td><td>BDO Office, Jamuria Block</td></tr>
            <tr><td>Address</td><td>Jamuria Block Development Office, Paschim Bardhaman</td></tr>
            <tr><td>Hours</td><td>10:00 AM – 5:00 PM (Mon–Fri)</td></tr>
          </table>
          <div class="checklist-box">
            <strong>✅ Documents to carry:</strong>
            <label><input type="checkbox"> Aadhaar card — ORIGINAL + 2 photocopies (self-attested)</label>
            <label><input type="checkbox"> Ration Card — ORIGINAL + 1 photocopy</label>
            <label><input type="checkbox"> Father's caste certificate (if available)</label>
            <label><input type="checkbox"> 2 passport-size photographs</label>
            <label><input type="checkbox"> Application form (filled at BDO office — free)</label>
            <label><input type="checkbox"> This docket</label>
          </div>
          <div class="cs-note">💬 At counter say: "Jati praman patra ke liye aaya hoon" / "জাতি শংসাপত্রের জন্য এসেছি"</div>
        </div>
      `
    },

    income_cert_cheatsheet: {
      title: "Income Certificate — Application Guide",
      content: `
        <div class="cheatsheet">
          <div class="cs-header">💰 Income Certificate — How to Get It</div>
          <div class="cs-sub">Required for SVMCM scholarship, Rupashree, widow pension, and many WB schemes</div>
          <table class="cs-table">
            <tr><td class="cs-label">Applicant</td><td class="cs-value"><strong>${person.name || "[Name]"}</strong></td></tr>
            <tr><td class="cs-label">Issuing Authority</td><td class="cs-value">BDO / SDO / Tehsildar</td></tr>
            <tr><td class="cs-label">Validity</td><td class="cs-value">Current financial year only (April–March)</td></tr>
            <tr><td class="cs-label">Fee</td><td class="cs-value">Free</td></tr>
            <tr><td class="cs-label">Time</td><td class="cs-value">7–15 days (online) · Same day (BDO, if officer present)</td></tr>
          </table>
          <div style="font-weight:700;margin:12px 0 6px;font-size:13px">Option A — Online (edistrict.wb.gov.in)</div>
          <div class="cs-steps">
            <div class="cs-step"><span class="step-num">1</span>Open <strong>edistrict.wb.gov.in</strong> → Register/Login</div>
            <div class="cs-step"><span class="step-num">2</span>Apply → <strong>"Income Certificate"</strong></div>
            <div class="cs-step"><span class="step-num">3</span>Fill income details, upload Aadhaar + salary slip or employer letter</div>
            <div class="cs-step"><span class="step-num">4</span>Submit → note reference number → download once approved</div>
          </div>
          <div style="font-weight:700;margin:12px 0 6px;font-size:13px">Option B — BDO Office (Jamuria Block)</div>
          <div class="cs-steps">
            <div class="cs-step"><span class="step-num">1</span>Bring: Aadhaar + salary slip / employer letter + ration card</div>
            <div class="cs-step"><span class="step-num">2</span>Fill form at BDO office → submit to clerk</div>
            <div class="cs-step"><span class="step-num">3</span>Certificate issued same day or within 3 days</div>
          </div>
          <div class="cs-note">💡 MB Sponge can issue a salary certificate — ask welfare officer to get it stamped. This counts as income proof for most scheme portals.</div>
        </div>
      `
    },

    kanyashree_bank_docket: {
      title: "Kanyashree — Girl's Bank Account Opening Docket",
      content: `
        <div class="docket">
          <div class="docket-header">JAN SETU — KANYASHREE BANK ACCOUNT DOCKET</div>
          <div class="docket-ref">Ref: KY-${Math.floor(Math.random()*9000)+1000} · Generated: ${today}</div>
          <table class="docket-table">
            <tr><th colspan="2">Girl Student Details</th></tr>
            <tr><td>Name</td><td><strong>${person.name || "[Daughter's Name]"}</strong></td></tr>
            <tr><td>Father Name</td><td>${worker?.name || "[Father's Name]"}</td></tr>
            <tr><td>School</td><td>[School Name — fill manually]</td></tr>
            <tr><td>Class</td><td>[Class — fill manually]</td></tr>
            <tr><td>Account Type</td><td><strong>Minor Savings Account (in own name) — Zero Balance</strong></td></tr>
            <tr><th colspan="2">Important</th></tr>
            <tr><td colspan="2">Account MUST be in the girl's OWN name (not parent's name). Required for Kanyashree K1/K2 benefit transfer.</td></tr>
          </table>
          <div class="checklist-box">
            <strong>✅ Documents to carry to bank:</strong>
            <label><input type="checkbox"> Girl's Aadhaar card — ORIGINAL (if available)</label>
            <label><input type="checkbox"> If no Aadhaar: School ID card + birth certificate</label>
            <label><input type="checkbox"> Father's Aadhaar — ORIGINAL (as guardian)</label>
            <label><input type="checkbox"> School bonafide certificate / TC</label>
            <label><input type="checkbox"> 2 passport-size photographs of the girl</label>
            <label><input type="checkbox"> This docket</label>
          </div>
          <div class="cs-note">💬 At bank counter: "Minor account Kanyashree ke liye kholna hai, beti ke naam pe" / "মেয়ের নামে কন্যাশ্রীর জন্য মাইনর অ্যাকাউন্ট খুলতে এসেছি"</div>
          <div class="cs-note">🏫 Tip: Many government schools arrange bank account opening camps — ask class teacher first before going to bank directly.</div>
        </div>
      `
    },
    bdo_caste_guide: {
      title: "Caste Certificate Application — BDO Guide",
      content: `
        <div class="cheatsheet">
          <div class="cs-header">📜 Caste Certificate — How to Apply at BDO Office</div>
          <div class="cs-sub">Prepared for: <strong>${person.name || worker?.name || "[Name]"}</strong> · Category: <strong>${person.caste || worker?.caste || "[SC / ST / OBC-A / OBC-B]"}</strong></div>
          <div class="cs-kendra">
            <strong>📍 Block Development Office (BDO)</strong><br>
            Jamuria Block, Salanpur, Paschim Bardhaman — 713369<br>
            🕐 10:00 AM – 5:00 PM (Mon–Fri) · Closed govt holidays<br>
            💰 No fee for SC/ST · ₹50 for OBC-A/OBC-B
          </div>
          <h3 style="color:#0D2240">Steps to Apply</h3>
          <div class="cs-step"><span class="step-num">1</span>Go to BDO Office, Jamuria Block — ask for "Jati Praman Patra" counter</div>
          <div class="cs-step"><span class="step-num">2</span>Collect application form at counter (free) — fill in Bengali or Hindi</div>
          <div class="cs-step"><span class="step-num">3</span>Submit form with documents (checklist below)</div>
          <div class="cs-step"><span class="step-num">4</span>BDO verifies with local Pradhan / Panchayat — may take 2–4 weeks</div>
          <div class="cs-step"><span class="step-num">5</span>Certificate issued — collect in person or ask for postal delivery</div>
          <div class="cs-step"><span class="step-num">6</span>Get 3–4 certified copies made at once — many schemes need certified copy</div>
          <h3 style="color:#0D2240">Documents to carry</h3>
          <label style="display:block;padding:5px 0;border-bottom:1px solid #eee"><input type="checkbox"> Aadhaar card — original + 1 photocopy (self-attested)</label>
          <label style="display:block;padding:5px 0;border-bottom:1px solid #eee"><input type="checkbox"> Voter ID or other photo ID — original + photocopy</label>
          <label style="display:block;padding:5px 0;border-bottom:1px solid #eee"><input type="checkbox"> Ration card — photocopy (for address proof)</label>
          <label style="display:block;padding:5px 0;border-bottom:1px solid #eee"><input type="checkbox"> Father's caste certificate (if already has one — strong supporting doc)</label>
          <label style="display:block;padding:5px 0;border-bottom:1px solid #eee"><input type="checkbox"> 2 passport-size photos</label>
          <label style="display:block;padding:5px 0;border-bottom:1px solid #eee"><input type="checkbox"> MB Sponge employer address letter (for residential address proof)</label>
          <label style="display:block;padding:5px 0;border-bottom:1px solid #eee"><input type="checkbox"> This printed guide — show to BDO staff if needed</label>
          <div class="cs-note">⚠️ Insist on SC/ST/OBC-A/OBC-B as printed in Aadhaar records. If there is a discrepancy, ask BDO for correction procedure.</div>
        </div>
      `
    },
    bdo_income_guide: {
      title: "Income Certificate Application — BDO / Block Office Guide",
      content: `
        <div class="cheatsheet">
          <div class="cs-header">💰 Income Certificate — How to Apply</div>
          <div class="cs-sub">Prepared for: <strong>${person.name || worker?.name || "[Name]"}</strong> · Annual Income: <strong>₹${person.annualIncome || worker?.annualIncome || "[amount]"}</strong></div>
          <div class="cs-kendra">
            <strong>📍 Block Development Office (BDO) — Jamuria Block</strong><br>
            OR apply online at <strong>edistrict.wb.gov.in</strong> (faster — 3–5 working days)<br>
            🕐 Office: 10:00 AM – 5:00 PM (Mon–Fri) · Online: 24×7<br>
            💰 ₹30 application fee (online or offline)
          </div>
          <h3 style="color:#0D2240">Option A: Online (Faster — Recommended)</h3>
          <div class="cs-step"><span class="step-num">1</span>Go to <strong>edistrict.wb.gov.in</strong> → Register with mobile → Login</div>
          <div class="cs-step"><span class="step-num">2</span>Select "Income Certificate" under Revenue Department services</div>
          <div class="cs-step"><span class="step-num">3</span>Fill form: Name (as Aadhaar), Annual income: ₹${person.annualIncome || worker?.annualIncome || "[household income]"}, Purpose: Welfare Scheme</div>
          <div class="cs-step"><span class="step-num">4</span>Upload: Aadhaar, Ration card, Employer salary letter or self-declaration</div>
          <div class="cs-step"><span class="step-num">5</span>Pay ₹30 online → Note application number</div>
          <div class="cs-step"><span class="step-num">6</span>Download digitally signed certificate in 3–5 working days</div>
          <h3 style="color:#0D2240">Option B: BDO Office (Walk-in)</h3>
          <div class="cs-step"><span class="step-num">1</span>Visit BDO Office, Jamuria Block — ask for "Aay Praman Patra" counter</div>
          <div class="cs-step"><span class="step-num">2</span>Fill form (₹30 fee at cash counter)</div>
          <div class="cs-step"><span class="step-num">3</span>SDO/BDO verifies income via local sources — takes 1–3 weeks</div>
          <h3 style="color:#0D2240">Documents to carry</h3>
          <label style="display:block;padding:5px 0;border-bottom:1px solid #eee"><input type="checkbox"> Aadhaar card — original + photocopy</label>
          <label style="display:block;padding:5px 0;border-bottom:1px solid #eee"><input type="checkbox"> Ration card — photocopy</label>
          <label style="display:block;padding:5px 0;border-bottom:1px solid #eee"><input type="checkbox"> MB Sponge employer letter stating monthly wage (ask HR for salary certificate)</label>
          <label style="display:block;padding:5px 0;border-bottom:1px solid #eee"><input type="checkbox"> 2 passport photos</label>
          <label style="display:block;padding:5px 0;border-bottom:1px solid #eee"><input type="checkbox"> Previous income certificate (if renewing)</label>
          <div class="cs-note">💡 Use household total income (all earning members combined) — not just your own salary.</div>
        </div>
      `
    },
    ration_card_guide: {
      title: "Ration Card Application Guide",
      content: `
        <div class="cheatsheet">
          <div class="cs-header">🗂️ Ration Card — How to Apply / Update in West Bengal</div>
          <div class="cs-sub">Prepared for: <strong>${person.name || worker?.name || "[Name]"}</strong></div>
          <div class="cs-kendra">
            <strong>📍 Food & Supplies Department</strong><br>
            Apply online at <strong>wbpds.wb.gov.in</strong> OR visit Block Food Office, Jamuria<br>
            🆓 No fee for new ration card
          </div>
          <div class="cs-step"><span class="step-num">1</span>Visit <strong>wbpds.wb.gov.in</strong> → "Apply for Ration Card"</div>
          <div class="cs-step"><span class="step-num">2</span>OR visit Block Food Supply Office (FSO), Jamuria Salanpur</div>
          <div class="cs-step"><span class="step-num">3</span>Fill PHED form with all family members' names and Aadhaar numbers</div>
          <div class="cs-step"><span class="step-num">4</span>FSO verifies household details via local enquiry</div>
          <div class="cs-step"><span class="step-num">5</span>Card issued in 30–60 days — Aadhaar seeding mandatory</div>
          <h3 style="color:#0D2240">Documents required</h3>
          <label style="display:block;padding:5px 0;border-bottom:1px solid #eee"><input type="checkbox"> Aadhaar of all family members — originals + photocopies</label>
          <label style="display:block;padding:5px 0;border-bottom:1px solid #eee"><input type="checkbox"> MB Sponge employer address letter (for WB residence proof)</label>
          <label style="display:block;padding:5px 0;border-bottom:1px solid #eee"><input type="checkbox"> Bank passbook photocopy</label>
          <label style="display:block;padding:5px 0;border-bottom:1px solid #eee"><input type="checkbox"> 2 passport photos (head of household)</label>
          <label style="display:block;padding:5px 0;border-bottom:1px solid #eee"><input type="checkbox"> Declaration: do not hold ration card in any other state</label>
        </div>
      `
    },
  };

  return docs[type] || { title: "Document", content: "<p>Document template not found.</p>" };
}

// ─── PRINT / PDF UTILITIES ────────────────────────────────────────────────────
function openPrintWindow(title, content) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 24px; color: #1A2A3A; font-size: 14px; line-height: 1.6; }
    h2,h3 { color: #0D2240; }
    .letterhead { text-align: center; border-bottom: 3px double #0D2240; margin-bottom: 24px; padding-bottom: 16px; }
    .logo { font-size: 22px; font-weight: 900; color: #0D2240; letter-spacing: 1px; }
    .sub { font-size: 12px; color: #5A6A7A; margin-top: 4px; }
    .divider { border-top: 1px solid #ccc; margin-top: 12px; }
    .ref { font-size: 12px; color: #5A6A7A; }
    .address-box { background: #F0F4F8; border-left: 4px solid #0D2240; padding: 12px 16px; margin: 16px 0; font-weight: 600; }
    .signature { margin-top: 40px; }
    .stamp-note { color: #7A8A9A; font-style: italic; font-size: 12px; margin-top: 8px; }
    .cheatsheet { background: #F8FAFC; border: 2px solid #0D2240; border-radius: 12px; padding: 20px; }
    .cs-header { font-size: 16px; font-weight: 800; color: #0D2240; margin-bottom: 6px; }
    .cs-sub { font-size: 12px; color: #7A8A9A; margin-bottom: 16px; }
    .cs-kendra { background: #EAF0FA; border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; font-size: 13px; line-height: 1.8; }
    .cs-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    .cs-table td { padding: 8px 10px; border-bottom: 1px solid #E0E8F0; font-size: 13px; }
    .cs-label { color: #5A6A7A; font-weight: 600; width: 38%; }
    .cs-value { color: #0D2240; }
    .cs-steps { margin: 12px 0; }
    .cs-step { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; font-size: 13px; }
    .step-num { background: #E8690B; color: #fff; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 11px; flex-shrink: 0; margin-top: 1px; }
    .cs-note { background: #FEF3E2; border-radius: 6px; padding: 8px 12px; font-size: 12px; color: #7A5000; margin-top: 10px; }
    .docket { border: 2px solid #0D2240; border-radius: 8px; }
    .docket-header { background: #0D2240; color: #fff; padding: 12px 16px; font-weight: 800; font-size: 15px; letter-spacing: 0.5px; }
    .docket-ref { background: #F0F4F8; padding: 6px 16px; font-size: 11px; color: #7A8A9A; font-family: monospace; }
    .docket-table { width: 100%; border-collapse: collapse; padding: 16px; }
    .docket-table td, .docket-table th { padding: 8px 16px; border-bottom: 1px solid #E0E8F0; font-size: 13px; }
    .docket-table th { background: #F4F6F8; font-size: 11px; font-weight: 700; color: #5A6A7A; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 16px; }
    .checklist-box { padding: 14px 16px; }
    .checklist-box label { display: block; margin: 6px 0; font-size: 13px; }
    @media print { body { margin: 0; } button { display: none; } }
  </style>
  </head><body>
  <div style="text-align:right;margin-bottom:16px"><button onclick="window.print()" style="background:#E8690B;color:#fff;border:none;padding:8px 20px;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer">🖨️ Print / Save as PDF</button></div>
  ${content}
  </body></html>`;
  _openDoc(html);
}

function _openDoc(html) {
  // Use a hidden iframe injected into the current page — works in all sandbox environments
  // Remove any existing print frame
  const existing = document.getElementById("_jan-setu_print_frame");
  if (existing) existing.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "_jan-setu_print_frame";
  iframe.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:99999;background:#fff";
  document.body.appendChild(iframe);

  // Write content into iframe
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  // Add a close button to the iframe content
  const closeBtn = iframe.contentDocument.createElement("div");
  closeBtn.innerHTML = '<button onclick="parent.document.getElementById(\'_jan-setu_print_frame\').remove()" style="position:fixed;top:12px;left:12px;background:#E8690B;color:#fff;border:none;padding:8px 16px;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;z-index:100000">✕ Close</button>';
  iframe.contentDocument.body.appendChild(closeBtn);
}

// ─── DOC HEALTH SCREEN ────────────────────────────────────────────────────────
function DocHealthScreen({ household, questionnaire, appSettings, onProceed, onBack }) {
  const [issues, setIssues] = useState(() =>
    generateDocIssues(household?.worker, household?.members, questionnaire)
  );
  const [expanded, setExpanded] = useState(null);
  const [activePath, setActivePath] = useState({});
  const [filter, setFilter] = useState("open");

  const worker = household?.worker || {};
  const members = household?.members || [];

  const markStatus = (id, status) => {
    setIssues(p => p.map(i => i.id === id ? {...i, status} : i));
    if (status !== "open") setExpanded(null);
  };

  const setPath = (issueId, pathId) => setActivePath(p => ({...p, [issueId]: pathId}));

  const openIssues = issues.filter(i => i.status === "open");
  const criticalOpen = openIssues.filter(i => i.severity === "critical");
  const canProceed = criticalOpen.length === 0;

  const score = Math.max(0, 100 - issues.reduce((acc, i) => {
    if (i.status !== "open") return acc;
    return acc + (i.severity === "critical" ? 25 : i.severity === "high" ? 12 : i.severity === "medium" ? 6 : 0);
  }, 0));

  const scoreColor = score >= 80 ? COLORS.green : score >= 50 ? COLORS.amber : COLORS.red;
  const scoreLabel = score >= 80 ? "Ready to Apply" : score >= 50 ? "Partial" : "Fix First";

  const SEV_CFG = {
    critical: { color: COLORS.red, bg: "#FADBD8", label: "Critical", icon: "🔴" },
    high:     { color: COLORS.amber, bg: "#FEF3E2", label: "High", icon: "🟠" },
    medium:   { color: COLORS.green, bg: COLORS.greenPale, label: "Medium", icon: "🟡" },
    info:     { color: COLORS.navyMid, bg: "#EAF0FA", label: "Info", icon: "🔵" },
  };

  const CAT_ICON = {
    name_mismatch: "📛", aadhaar_address: "📍", aadhaar_mobile: "📱",
    bank_dbt: "🏦", bank_missing: "💳", document_expired: "📅",
    document_missing: "📄", eligibility_conflict: "⚡",
  };

  const filtered = issues
    .filter(i => filter === "all" ? true : filter === "open" ? (i.status === "open") : (i.status !== "open"))
    .sort((a, b) => {
      const o = {critical:0, high:1, medium:2, info:3};
      return (o[a.severity]||9) - (o[b.severity]||9);
    });

  return (
    <div>
      <BackButton onClick={onBack} label="Back to Questions" />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, color: COLORS.navy, margin: "0 0 4px" }}>🏥 Document Health Check</h2>
          <p style={{ color: "#7A8A9A", fontSize: 13, margin: 0 }}>
            {worker.name} + {members.length} family member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ textAlign: "center", background: scoreColor + "15", border: `2px solid ${scoreColor}40`, borderRadius: 14, padding: "10px 18px" }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: scoreColor, fontFamily: "monospace", lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 10, color: scoreColor, fontWeight: 700 }}>{scoreLabel}</div>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
        {[
          { l: "Critical", n: issues.filter(i=>i.severity==="critical"&&i.status==="open").length, c: COLORS.red, bg: "#FADBD8" },
          { l: "High", n: issues.filter(i=>i.severity==="high"&&i.status==="open").length, c: COLORS.amber, bg: "#FEF3E2" },
          { l: "Open", n: openIssues.length, c: COLORS.navy, bg: "#EAF0FA" },
          { l: "Resolved", n: issues.filter(i=>i.status!=="open").length, c: COLORS.green, bg: COLORS.greenPale },
        ].map(s => (
          <div key={s.l} style={{ background: s.bg, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.c }}>{s.n}</div>
            <div style={{ fontSize: 10, color: s.c, fontWeight: 700 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[["open","Open"],["all","All"],["resolved","Resolved"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 11, fontFamily: "inherit",
            background: filter === v ? COLORS.navy : COLORS.mist,
            color: filter === v ? "#fff" : COLORS.slate,
          }}>{l}</button>
        ))}
      </div>

      {/* Issue cards */}
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 32, color: "#7A8A9A", fontSize: 14 }}>
          {filter === "resolved" ? "No resolved issues yet." : "🎉 No open issues!"}
        </div>
      )}

      {filtered.map(issue => {
        const sev = SEV_CFG[issue.severity] || SEV_CFG.info;
        const isExpanded = expanded === issue.id;
        const isDone = issue.status !== "open";
        const currentPath = activePath[issue.id] || issue.paths?.[0]?.id;
        const path = issue.paths?.find(p => p.id === currentPath) || issue.paths?.[0];

        return (
          <div key={issue.id} style={{
            background: "#fff", borderRadius: 14, marginBottom: 10, overflow: "hidden",
            border: `1.5px solid ${isDone ? "#E8EDF3" : sev.bg}`,
            borderLeft: `4px solid ${isDone ? "#C0CDD8" : sev.color}`,
            opacity: isDone ? 0.72 : 1,
          }}>
            {/* Card row */}
            <div onClick={() => setExpanded(isExpanded ? null : issue.id)}
              style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flexShrink: 0, textAlign: "center", width: 36 }}>
                <div style={{ fontSize: 20 }}>{CAT_ICON[issue.category] || "📋"}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: sev.color, marginTop: 1 }}>{sev.label.toUpperCase()}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: isDone ? "#A0AABB" : COLORS.navy }}>{issue.title}</span>
                  {issue.status === "in_progress" && <span style={{ background: "#EAF0FA", color: COLORS.navyMid, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 8 }}>IN PROGRESS</span>}
                  {issue.status === "resolved" && <span style={{ background: COLORS.greenPale, color: COLORS.green, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 8 }}>✅ RESOLVED</span>}
                  {issue.status === "accepted" && <span style={{ background: "#FEF3E2", color: COLORS.amber, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 8 }}>⚡ ACCEPTED</span>}
                </div>
                <div style={{ fontSize: 11, color: "#7A8A9A" }}>
                  <span style={{ background: "#F0F4F8", borderRadius: 4, padding: "1px 6px", marginRight: 6 }}>{issue.personType}: {issue.person}</span>
                  {path && <span>⏱ {path.days}</span>}
                </div>
              </div>
              <span style={{ color: "#C0CDD8", fontSize: 18, transition: "transform 0.2s", transform: isExpanded ? "rotate(90deg)" : "none" }}>›</span>
            </div>

            {/* Expanded panel */}
            {isExpanded && (
              <div style={{ borderTop: `1px solid ${sev.bg}`, background: "#FAFBFD" }}>
                {/* Problem */}
                <div style={{ padding: "14px 16px 0" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: sev.color, letterSpacing: 0.5, marginBottom: 5 }}>PROBLEM</div>
                  <div style={{ fontSize: 13, color: COLORS.slate, lineHeight: 1.6, marginBottom: 14 }}>{issue.detail}</div>
                </div>

                {/* Path selector */}
                {issue.paths && issue.paths.length > 1 && (
                  <div style={{ padding: "0 16px", marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.navy, letterSpacing: 0.5, marginBottom: 8 }}>CHOOSE RESOLUTION PATH</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {issue.paths.map(p => (
                        <button key={p.id} onClick={() => setPath(issue.id, p.id)} style={{
                          padding: "7px 14px", borderRadius: 8, border: `2px solid ${currentPath === p.id ? COLORS.saffron : "#D0D8E4"}`,
                          background: currentPath === p.id ? COLORS.amberLight : "#fff",
                          cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit",
                          color: currentPath === p.id ? COLORS.saffron : COLORS.slate,
                          display: "flex", alignItems: "center", gap: 5,
                        }}>
                          {p.icon} {p.label}
                          {p.recommended && <span style={{ background: COLORS.green, color: "#fff", fontSize: 9, padding: "1px 5px", borderRadius: 4 }}>RECOMMENDED</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active path details */}
                {path && (
                  <div style={{ padding: "0 16px 14px" }}>
                    {/* Portal launch */}
                    {path.portalUrl && (
                      <div style={{ background: "#EAF0FA", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, color: COLORS.navyMid, fontWeight: 600 }}>🌐 Government Portal</span>
                        <button onClick={() => window.open(path.portalUrl, "_blank")} style={{
                          background: COLORS.navy, color: "#fff", border: "none", borderRadius: 7,
                          padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        }}>{path.portalLabel || "Open Portal ↗"}</button>
                      </div>
                    )}

                    {/* Seva Kendra info */}
                    {path.sevaKendra && (
                      <div style={{ background: "#F0F4FF", border: "1px solid #B0C4F0", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: COLORS.navyMid, marginBottom: 6 }}>📍 {ASANSOL_ASK.name}</div>
                        <div style={{ fontSize: 12, color: COLORS.slate, lineHeight: 1.7 }}>
                          {ASANSOL_ASK.address}<br/>
                          🕐 {ASANSOL_ASK.hours}<br/>
                          📏 {ASANSOL_ASK.distance} · 💰 {ASANSOL_ASK.fees}
                        </div>
                        <button onClick={() => window.open(ASANSOL_ASK.bookingUrl, "_blank")} style={{
                          marginTop: 8, background: "#3B5BDB", color: "#fff", border: "none", borderRadius: 7,
                          padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        }}>📅 Book Appointment Online →</button>
                      </div>
                    )}

                    {/* Steps */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.navy, letterSpacing: 0.5, marginBottom: 8 }}>STEPS</div>
                      {path.steps.map((step, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: COLORS.saffron, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i+1}</div>
                          <span style={{ fontSize: 13, color: COLORS.slate, lineHeight: 1.5 }}>{step}</span>
                        </div>
                      ))}
                    </div>

                    {/* Documents */}
                    {path.documents && path.documents.length > 0 && (
                      <div style={{ background: COLORS.mist, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.navy, letterSpacing: 0.5, marginBottom: 6 }}>📎 DOCUMENTS TO CARRY</div>
                        {path.documents.map((d, i) => (
                          <div key={i} style={{ fontSize: 13, color: COLORS.slate, marginBottom: 4 }}>✓ {d}</div>
                        ))}
                      </div>
                    )}

                    {/* Generate artifacts */}
                    {path.generates && path.generates.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.navy, letterSpacing: 0.5, marginBottom: 8 }}>GENERATE & PRINT</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {path.generates.map(docType => {
                            const labels = {
                              employer_address_letter: "📄 Employer Address Letter",
                              bank_name_correction_letter: "📄 Bank Name Correction Letter",
                              jan_dhan_prefill: "📋 Jan Dhan Pre-fill Card",
                              jan_dhan_docket: "📦 Jan Dhan Visit Docket",
                              appointment_cheatsheet: "🗓️ Appointment Booking Guide",
                              seva_kendra_docket: "🪪 Seva Kendra Visit Docket",
                              ssup_cheatsheet: "💻 SSUP Step-by-Step Guide",
                              name_variance_letter: "📄 Name Variance Letter",
                              bank_seeding_cheatsheet: "📋 Bank Seeding Guide",
                              bank_seeding_letter: "📄 Aadhaar Seeding Request",
                              caste_cert_cheatsheet: "📋 e-District Application Guide",
                              bdo_caste_docket: "📦 BDO Visit Docket",
                              income_cert_cheatsheet: "📋 Income Cert Guide",
                              kanyashree_bank_docket: "📦 School Bank Account Guide",
                            };
                            const isMainPerson = !path.id.includes("member");
                            return (
                              <button key={docType}
                                onClick={() => {
                                  const doc = generateDocument(docType, worker, members.find(m=>m.name===issue.person)||null, appSettings || {}, questionnaire || {});
                                  if (doc) openPrintWindow(doc.title, doc.content);
                                }}
                                style={{
                                  padding: "7px 14px", borderRadius: 8,
                                  border: `1.5px solid ${COLORS.saffron}`,
                                  background: COLORS.amberLight, color: COLORS.saffron,
                                  cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit",
                                }}
                              >
                                {labels[docType] || docType} ↗
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Blocked schemes */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.red, letterSpacing: 0.5, marginBottom: 6 }}>SCHEMES BLOCKED UNTIL RESOLVED</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {issue.blockedSchemes.map(s => (
                          <span key={s} style={{ background: "#FADBD8", color: COLORS.red, fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 10 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ padding: "12px 16px", borderTop: "1px solid #F0F4F8", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {!isDone ? (
                    <>
                      <button onClick={() => markStatus(issue.id, "in_progress")} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: "#EAF0FA", color: COLORS.navyMid, fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>▶ Mark In Progress</button>
                      <button onClick={() => markStatus(issue.id, "resolved")} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: COLORS.greenPale, color: COLORS.green, fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>✅ Mark Resolved</button>
                      {issue.severity !== "info" && (
                        <button onClick={() => markStatus(issue.id, "accepted")} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: "#FEF3E2", color: COLORS.amber, fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>⚡ Accept Risk & Proceed</button>
                      )}
                    </>
                  ) : (
                    <button onClick={() => markStatus(issue.id, "open")} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #D0D8E4", cursor: "pointer", background: "#fff", color: "#7A8A9A", fontWeight: 600, fontSize: 12, fontFamily: "inherit" }}>↩ Reopen</button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Proceed CTA */}
      <div style={{ marginTop: 24, background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #E8EDF3", textAlign: "center" }}>
        {!canProceed ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.red, marginBottom: 8 }}>
              🔴 {criticalOpen.length} critical issue{criticalOpen.length > 1 ? "s" : ""} must be resolved or accepted before proceeding
            </div>
            <div style={{ fontSize: 12, color: "#7A8A9A", marginBottom: 16 }}>
              Resolve each issue or click "Accept Risk & Proceed" to continue with a known gap.
            </div>
            <button disabled style={{ padding: "12px 32px", background: "#E0E8F0", color: "#A0AABB", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 14, cursor: "not-allowed", fontFamily: "inherit" }}>
              Proceed to Eligible Schemes →
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.green, marginBottom: 8 }}>
              ✅ All critical issues resolved — ready to proceed
            </div>
            {openIssues.filter(i=>i.severity==="high").length > 0 && (
              <div style={{ fontSize: 12, color: COLORS.amber, marginBottom: 12 }}>
                ⚠️ {openIssues.filter(i=>i.severity==="high").length} high-priority issues remain open — some schemes may still be blocked
              </div>
            )}
            <button onClick={onProceed} style={{ padding: "12px 32px", background: COLORS.saffron, color: "#fff", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 4px 16px ${COLORS.saffron}50` }}>
              Proceed to Eligible Schemes →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Badge({ label, color = COLORS.saffron }) {
  return (
    <span style={{
      background: color + "18", color, border: `1px solid ${color}40`,
      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5
    }}>{label}</span>
  );
}

function Button({ onClick, children, variant = "primary", size = "md", disabled }) {
  const base = {
    border: "none", cursor: disabled ? "not-allowed" : "pointer", borderRadius: 10,
    fontFamily: "inherit", fontWeight: 700, transition: "all 0.18s", outline: "none",
    display: "inline-flex", alignItems: "center", gap: 6, opacity: disabled ? 0.5 : 1,
  };
  const sizes = { sm: { padding: "6px 14px", fontSize: 12 }, md: { padding: "10px 22px", fontSize: 14 }, lg: { padding: "14px 32px", fontSize: 16 } };
  const variants = {
    primary: { background: COLORS.saffron, color: "#fff", boxShadow: `0 2px 12px ${COLORS.saffron}50` },
    secondary: { background: COLORS.green, color: "#fff", boxShadow: `0 2px 12px ${COLORS.green}40` },
    ghost: { background: "transparent", color: COLORS.saffron, border: `2px solid ${COLORS.saffron}` },
    danger: { background: COLORS.red, color: "#fff" },
    subtle: { background: COLORS.mist, color: COLORS.slate, border: `1px solid #e0e4ea` },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...sizes[size], ...variants[variant] }}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type = "text", options, placeholder, required }) {
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: COLORS.slate, marginBottom: 5, letterSpacing: 0.4 };
  const inputStyle = {
    width: "100%", padding: "9px 13px", border: `1.5px solid #D0D8E4`, borderRadius: 8,
    fontSize: 14, fontFamily: "inherit", background: "#fff", color: COLORS.navy,
    boxSizing: "border-box", outline: "none", transition: "border 0.15s",
  };
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={labelStyle}>{label}{required && <span style={{ color: COLORS.red }}> *</span>}</label>}
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
          <option value="">Select...</option>
          {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
      )}
    </div>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "#fff", borderRadius: 16, border: "1px solid #E8EDF3",
      boxShadow: "0 2px 16px rgba(13,34,64,0.06)", padding: 20,
      cursor: onClick ? "pointer" : "default", transition: "box-shadow 0.15s",
      ...style
    }}>
      {children}
    </div>
  );
}

function ProgressBar({ step, steps, onStepClick }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
      {steps.map((s, i) => {
        const isPast = i < step;
        const isCurrent = i === step;
        const clickable = isPast && !!onStepClick;
        return (
          <div key={i} style={{ flex: 1, textAlign: "center" }}
            onClick={clickable ? () => onStepClick(i) : undefined}
          >
            <div style={{
              height: 4, borderRadius: 4, marginBottom: 5,
              background: i <= step ? COLORS.saffron : "#E0E8F0",
              transition: "background 0.3s",
              cursor: clickable ? "pointer" : "default",
            }} />
            <div style={{
              fontSize: 10,
              color: isCurrent ? COLORS.saffron : isPast ? COLORS.green : "#A0AABB",
              fontWeight: isCurrent ? 700 : 500,
              cursor: clickable ? "pointer" : "default",
              textDecoration: clickable ? "underline dotted" : "none",
            }}>{s}</div>
          </div>
        );
      })}
    </div>
  );
}

function BackButton({ onClick, label = "Back" }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "none", border: "1.5px solid #D0D8E4", cursor: "pointer",
      color: COLORS.slate, fontWeight: 700, fontSize: 13, borderRadius: 8,
      padding: "7px 14px", marginBottom: 20, fontFamily: "inherit",
      transition: "all 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.saffron; e.currentTarget.style.color = COLORS.saffron; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#D0D8E4"; e.currentTarget.style.color = COLORS.slate; }}
    >
      ← {label}
    </button>
  );
}

// ─── SCREEN 1: VERIFY ─────────────────────────────────────────────────────────
// ─── AI DOCUMENT SCANNER UTILITIES ───────────────────────────────────────────
async function callClaudeVision(imageBase64, mediaType, prompt) {
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
        { type: "text", text: prompt }
      ]}]
    })
  });
  const data = await response.json();
  const text = data.content?.map(c => c.text || "").join("") || "";
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean.slice(clean.indexOf("{")));
  } catch { return null; }
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("Read failed"));
    r.readAsDataURL(file);
  });
}

const DOC_PROMPTS = {
  aadhaar: `Extract from this Indian Aadhaar card. Return ONLY JSON:
{"name":"full name as printed","dob":"DD/MM/YYYY","gender":"Male/Female/Other","aadhaarNumber":"12 digits no spaces","aadhaarLast4":"last 4 digits","address":"full address","addressState":"state from address","pincode":"6 digits","fatherOrHusbandName":"if shown else empty"}`,

  bank: `Extract from this Indian bank passbook or cheque leaf. Return ONLY JSON:
{"accountHolderName":"name as printed","accountNumber":"full account number","ifsc":"IFSC code","bankName":"bank name","branchName":"branch name","accountType":"Savings/Current/Jan Dhan"}`,

  caste: `Extract from this Indian caste certificate. Return ONLY JSON:
{"name":"applicant name","caste":"caste category e.g. SC/ST/OBC-A/OBC-B","fatherName":"father name","issueDate":"DD/MM/YYYY","certificateNumber":"cert number","issuingAuthority":"issuing officer/BDO/SDO"}`,

  income: `Extract from this Indian income certificate. Return ONLY JSON:
{"name":"applicant name","annualIncome":"annual income amount as number","issueDate":"DD/MM/YYYY","certificateNumber":"cert number","issuingAuthority":"issuing officer"}`,

  birth: `Extract from this birth certificate or school ID card. Return ONLY JSON:
{"name":"child name","dob":"DD/MM/YYYY","gender":"Male/Female","fatherName":"father name","motherName":"mother name","certificateNumber":"if present"}`,

  voter: `Extract from this Indian Voter ID (EPIC) card. Return ONLY JSON:
{"name":"name as printed","voterId":"EPIC number","dob":"DD/MM/YYYY if shown","gender":"Male/Female","address":"full address","addressState":"state from address","assemblyConstituency":"if shown"}`,

  pan: `Extract from this Indian PAN card. Return ONLY JSON:
{"name":"name as printed","panNumber":"10-character PAN","dob":"DD/MM/YYYY","fatherName":"father name if shown"}`,
};

// Scan prompts for uploadDocs panel keys (extract key fields to confirm correct doc was scanned)
const SCAN_CONFIRM_PROMPTS = {
  aadhaar_front:   `This is an Aadhaar card front. Return ONLY JSON: {"name":"full name","aadhaarLast4":"last 4 digits","dob":"DOB if visible","docType":"aadhaar"}`,
  aadhaar_back:    `This is an Aadhaar card back. Return ONLY JSON: {"aadhaarLast4":"last 4 digits if visible","address":"address if visible","docType":"aadhaar_back"}`,
  aadhaar_head:    `This is an Aadhaar card. Return ONLY JSON: {"name":"full name","aadhaarLast4":"last 4 digits","docType":"aadhaar"}`,
  aadhaar_member2: `This is an Aadhaar card. Return ONLY JSON: {"name":"full name","aadhaarLast4":"last 4 digits","docType":"aadhaar"}`,
  aadhaar_member3: `This is an Aadhaar card. Return ONLY JSON: {"name":"full name","aadhaarLast4":"last 4 digits","docType":"aadhaar"}`,
  voter_id:        `This is an Indian Voter ID (EPIC). Return ONLY JSON: {"name":"name as printed","voterId":"EPIC number","dob":"DOB if shown","docType":"voter_id"}`,
  ration_card:     `This is an Indian ration card. Return ONLY JSON: {"headName":"head of household name","rationCardNo":"card number if visible","members":"number of members if shown","docType":"ration_card"}`,
  salary_cert:     `This is an employer/salary certificate letter. Return ONLY JSON: {"employeeName":"employee name mentioned","employerName":"company/employer name","designation":"job title if shown","docType":"salary_cert"}`,
  address_proof:   `This is an address proof document. Return ONLY JSON: {"name":"name mentioned","address":"address mentioned","issuedBy":"issuing authority or employer","docType":"address_proof"}`,
  address_cert:    `This is an employer address certificate. Return ONLY JSON: {"employeeName":"employee name","employerName":"company name","address":"address mentioned","docType":"address_cert"}`,
  bank_passbook:   `This is a bank passbook or cheque. Return ONLY JSON: {"accountHolderName":"name","accountNumber":"account number","bankName":"bank name","ifsc":"IFSC if visible","docType":"bank"}`,
  dob_proof:       `This is a date of birth proof document. Return ONLY JSON: {"name":"name as printed","dob":"date of birth DD/MM/YYYY","documentType":"birth certificate/school cert/other","docType":"dob_proof"}`,
  age_proof:       `This is an age/DOB proof document. Return ONLY JSON: {"name":"name","dob":"date of birth","documentType":"type of document","docType":"age_proof"}`,
  medical_cert:    `This is a medical certificate. Return ONLY JSON: {"patientName":"patient name","doctorName":"doctor name","condition":"diagnosis or condition mentioned","date":"issue date","docType":"medical_cert"}`,
  father_caste:    `This is a caste certificate. Return ONLY JSON: {"name":"certificate holder name","caste":"caste category","issuedBy":"issuing authority","issueDate":"date","docType":"caste_cert"}`,
  default:         `This is a document. Identify what it is and extract key visible text. Return ONLY JSON: {"docType":"type of document","mainName":"primary name visible","keyDetail":"most important detail","isReadable":true}`,
};

// ─── SINGLE DOCUMENT UPLOAD TILE ─────────────────────────────────────────────
function DocUploadTile({ docType, label, icon, description, onScanned, scannedData, required }) {
  const [status, setStatus] = useState(scannedData ? "done" : "idle"); // idle|scanning|done|error|cam
  const [err, setErr] = useState("");
  const fileRef = useRef();

  const processFile = async (file) => {
    setStatus("scanning");
    try {
      const b64 = await fileToBase64(file);
      const mt = file.type.startsWith("image") ? file.type : "image/jpeg";
      const result = await callClaudeVision(b64, mt, DOC_PROMPTS[docType]);
      if (!result) { setErr("Could not read document. Try a clearer photo."); setStatus("error"); return; }
      onScanned(docType, result, file.name);
      setStatus("done");
    } catch { setErr("Scan failed — check connection."); setStatus("error"); }
  };

  const handleFile = async (e) => { const f = e.target.files?.[0]; if (f) processFile(f); };

  const colors = { idle: "#E8EDF3", scanning: COLORS.saffron, done: COLORS.green, error: COLORS.red, cam: COLORS.navy };
  const border = colors[status] || "#E8EDF3";

  // Camera mode — show DocScanCamera inline
  if (status === "cam") return (
    <div style={{ border: `2px solid ${COLORS.navy}`, borderRadius: 12, overflow: "hidden" }}>
      <DocScanCamera
        slotKey={docType}
        slotLabel={label}
        onCancel={() => setStatus("idle")}
        onCapture={async (result) => {
          setStatus("scanning");
          // Convert preview data URL to file and run through existing AI prompt
          try {
            const res = await fetch(result.preview);
            const blob = await res.blob();
            const file = new File([blob], `${docType}_scan.jpg`, { type: "image/jpeg" });
            await processFile(file);
          } catch { setErr("Could not process scanned image."); setStatus("error"); }
        }}
      />
    </div>
  );

  return (
    <div style={{ border: `2px solid ${border}`, borderRadius: 12, padding: 14, background: status === "done" ? COLORS.greenPale : status === "scanning" ? "#FFF8F0" : "#FAFBFD", position: "relative" }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ fontSize: 28, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.navy }}>{label}</span>
            {required && <span style={{ fontSize: 9, fontWeight: 700, color: COLORS.red, background: "#FADBD8", padding: "1px 5px", borderRadius: 4 }}>REQUIRED</span>}
            {status === "done" && <span style={{ fontSize: 10, color: COLORS.green, fontWeight: 700 }}>✅ Scanned</span>}
          </div>
          <div style={{ fontSize: 11, color: "#7A8A9A", marginBottom: 8 }}>{description}</div>

          {status === "scanning" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.saffron, fontSize: 12, fontWeight: 700 }}>
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> AI reading document...
            </div>
          )}
          {status === "idle" && (
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              <button onClick={() => setStatus("cam")} style={{ background: "#1A3A5C", color: "#fff", border: "none", borderRadius: 7, padding: "6px 13px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                📷 Scan with Camera
              </button>
              <label style={{ background: COLORS.navy, color: "#fff", borderRadius: 7, padding: "6px 13px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-block" }}>
                📁 Upload File
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
              </label>
            </div>
          )}
          {status === "done" && scannedData && (
            <div style={{ fontSize: 11, color: COLORS.green }}>
              {Object.entries(scannedData).slice(0, 3).map(([k, v]) => v && (
                <span key={k} style={{ marginRight: 10 }}>✓ {v}</span>
              ))}
              <button onClick={() => { setStatus("idle"); onScanned(docType, null, null); }} style={{ background: "none", border: "none", color: "#7A8A9A", fontSize: 10, cursor: "pointer", textDecoration: "underline" }}>re-scan</button>
            </div>
          )}
          {status === "error" && (
            <div style={{ fontSize: 11, color: COLORS.red }}>
              ⚠️ {err}
              <button onClick={() => setStatus("cam")} style={{ background: "none", border: "none", color: "#1A3A5C", fontSize: 11, cursor: "pointer", textDecoration: "underline", marginLeft: 8 }}>scan again</button>
              <button onClick={() => { setStatus("idle"); setErr(""); }} style={{ background: "none", border: "none", color: COLORS.saffron, fontSize: 11, cursor: "pointer", textDecoration: "underline", marginLeft: 6 }}>upload file</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AI CROSS-COMPARE ENGINE ──────────────────────────────────────────────────
function crossCompareDocuments(scannedDocs) {
  const mismatches = [];
  const aadhaar = scannedDocs.aadhaar;
  const bank = scannedDocs.bank;
  const caste = scannedDocs.caste;
  const income = scannedDocs.income;

  const normName = s => (s || "").toLowerCase().replace(/[^a-z]/g, "").trim();

  if (aadhaar?.name && bank?.accountHolderName) {
    if (normName(aadhaar.name) !== normName(bank.accountHolderName)) {
      mismatches.push({
        type: "name_mismatch", severity: "critical",
        title: "Name mismatch: Aadhaar ≠ Bank",
        detail: `Aadhaar: "${aadhaar.name}" vs Bank: "${bank.accountHolderName}"`,
        docA: "Aadhaar", valA: aadhaar.name,
        docB: "Bank Passbook", valB: bank.accountHolderName,
        fix: "NAME_AADHAAR_BANK",
      });
    }
  }
  if (aadhaar?.name && caste?.name) {
    if (normName(aadhaar.name) !== normName(caste.name)) {
      mismatches.push({
        type: "name_mismatch", severity: "high",
        title: "Name mismatch: Aadhaar ≠ Caste Certificate",
        detail: `Aadhaar: "${aadhaar.name}" vs Caste Cert: "${caste.name}"`,
        docA: "Aadhaar", valA: aadhaar.name,
        docB: "Caste Certificate", valB: caste.name,
        fix: "NAME_AADHAAR_CASTE",
      });
    }
  }
  if (aadhaar?.name && income?.name) {
    if (normName(aadhaar.name) !== normName(income.name)) {
      mismatches.push({
        type: "name_mismatch", severity: "high",
        title: "Name mismatch: Aadhaar ≠ Income Certificate",
        detail: `Aadhaar: "${aadhaar.name}" vs Income Cert: "${income.name}"`,
        docA: "Aadhaar", valA: aadhaar.name,
        docB: "Income Certificate", valB: income.name,
        fix: "NAME_AADHAAR_INCOME",
      });
    }
  }
  if (aadhaar?.addressState && aadhaar.addressState !== "West Bengal") {
    mismatches.push({
      type: "address_state", severity: "critical",
      title: `Aadhaar address: ${aadhaar.addressState} — not West Bengal`,
      detail: `Aadhaar shows ${aadhaar.addressState} address. All WB schemes require WB address.`,
      docA: "Aadhaar", valA: aadhaar.address,
      fix: "AADHAAR_ADDR_OUTSTATE",
    });
  }
  if (caste?.issueDate) {
    const parts = (caste.issueDate || "").split("/");
    if (parts.length === 3) {
      const issued = new Date(parts[2], parts[1] - 1, parts[0]);
      const monthsOld = (new Date() - issued) / (1000 * 60 * 60 * 24 * 30);
      if (monthsOld > 12) {
        mismatches.push({
          type: "doc_expired", severity: "high",
          title: `Caste certificate may be outdated (issued ${caste.issueDate})`,
          detail: "Many schemes require current year certificate. Check if scheme portal accepts this date.",
          docA: "Caste Certificate", valA: `Issued: ${caste.issueDate}`,
          fix: "CASTE_CERT_EXPIRED",
        });
      }
    }
  }
  if (income?.issueDate) {
    const parts = (income.issueDate || "").split("/");
    if (parts.length === 3) {
      const issued = new Date(parts[2], parts[1] - 1, parts[0]);
      const monthsOld = (new Date() - issued) / (1000 * 60 * 60 * 24 * 30);
      if (monthsOld > 12) {
        mismatches.push({
          type: "doc_expired", severity: "medium",
          title: `Income certificate outdated (issued ${income.issueDate})`,
          detail: "SVMCM and scholarship portals require income cert from current financial year.",
          docA: "Income Certificate", valA: `Issued: ${income.issueDate}`,
          fix: "INCOME_CERT_EXPIRED",
        });
      }
    }
  }
  return mismatches;
}

// ─── MISMATCH REVIEW PANEL ────────────────────────────────────────────────────
function MismatchPanel({ mismatches, scannedDocs, onAccepted }) {
  const [accepted, setAccepted] = useState({});

  const sevColor = { critical: COLORS.red, high: COLORS.amber, medium: "#7B2CBF", info: COLORS.navyMid };
  const sevBg = { critical: "#FADBD8", high: "#FEF3E2", medium: "#F3E8FF", info: "#EAF0FA" };

  const allAccepted = mismatches.every((m, i) => accepted[i]);

  return (
    <div style={{ background: "#FFFBF5", border: `2px solid ${COLORS.saffron}40`, borderRadius: 14, padding: 18, marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 24 }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 800, color: COLORS.navy, fontSize: 14 }}>AI found {mismatches.length} document mismatch{mismatches.length > 1 ? "es" : ""}</div>
          <div style={{ fontSize: 12, color: "#7A8A9A" }}>Review each issue — fix before proceeding or accept and continue</div>
        </div>
      </div>

      {mismatches.map((m, i) => {
        const sc = sevColor[m.severity] || COLORS.slate;
        const sb = sevBg[m.severity] || "#F4F6F8";
        const isAccepted = accepted[i];

        return (
          <div key={i} style={{ border: `1.5px solid ${isAccepted ? "#C0CDD8" : sc + "60"}`, borderLeft: `4px solid ${isAccepted ? "#C0CDD8" : sc}`, borderRadius: 10, marginBottom: 10, background: isAccepted ? "#F8FAFC" : sb, opacity: isAccepted ? 0.7 : 1 }}>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: isAccepted ? "#A0AABB" : COLORS.navy }}>{m.title}</div>
                <span style={{ fontSize: 9, fontWeight: 700, color: isAccepted ? "#A0AABB" : sc, background: isAccepted ? "#E0E8F0" : sb, padding: "2px 8px", borderRadius: 6, flexShrink: 0 }}>
                  {isAccepted ? "ACCEPTED" : m.severity.toUpperCase()}
                </span>
              </div>

              {/* Side by side comparison */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div style={{ background: "#fff", borderRadius: 7, padding: "8px 10px", border: "1px solid #E0E8F0" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#7A8A9A", marginBottom: 3 }}>{m.docA?.toUpperCase()}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy }}>{m.valA || "—"}</div>
                </div>
                {m.docB && (
                  <div style={{ background: "#fff", borderRadius: 7, padding: "8px 10px", border: `1.5px solid ${sc}60` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: sc, marginBottom: 3 }}>{m.docB?.toUpperCase()} ⚠️</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: sc }}>{m.valB || "—"}</div>
                  </div>
                )}
              </div>

              <div style={{ fontSize: 12, color: COLORS.slate, marginBottom: 10 }}>{m.detail}</div>

              {!isAccepted && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setAccepted(p => ({ ...p, [i]: true }))}
                    style={{ padding: "5px 12px", borderRadius: 7, border: "none", background: "#FEF3E2", color: COLORS.amber, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    ⚡ Accept & Continue
                  </button>
                  <span style={{ fontSize: 11, color: "#7A8A9A", alignSelf: "center" }}>— will be flagged in Doc Health for resolution</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: 14, padding: "12px 14px", background: allAccepted ? COLORS.greenPale : "#F0F4F8", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
        {allAccepted
          ? <><span style={{ fontSize: 18 }}>✅</span><span style={{ fontWeight: 700, color: COLORS.green, fontSize: 13 }}>All mismatches acknowledged — issues pre-loaded in Doc Health</span></>
          : <><span style={{ fontSize: 16 }}>☝️</span><span style={{ fontSize: 12, color: COLORS.slate }}>Accept each mismatch to continue. They will be pre-loaded in Doc Health with fix guides.</span></>
        }
      </div>
    </div>
  );
}

// ─── INTENT SELECTOR ─────────────────────────────────────────────────────────
function IntentScreen({ worker, onSchemes, onDocuments }) {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>👋</div>
        <h2 style={{ fontSize: 20, color: COLORS.navy, margin: "0 0 6px" }}>What do you need today?</h2>
        <p style={{ color: "#7A8A9A", fontSize: 13, margin: 0 }}>
          {worker?.phone && <span>Worker: <strong>{worker.phone}</strong> · </span>}
          Choose one to continue
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <button onClick={onSchemes} style={{ background: "linear-gradient(135deg, #0D2240 0%, #1A3A5C 100%)", color: "#fff", border: "none", borderRadius: 16, padding: "24px 16px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", boxShadow: "0 4px 20px rgba(13,34,64,0.3)", transition: "transform 0.1s" }}
          onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🏛️</div>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>Apply for Schemes</div>
          <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.5 }}>
            Check eligibility, fill applications, submit to portals
          </div>
          <div style={{ marginTop: 14, fontSize: 11, background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "4px 10px", display: "inline-block" }}>
            PMJJBY · PMSBY · APY · Swasthya Sathi · Lakshmir Bhandar + 20 more →
          </div>
        </button>

        <button onClick={onDocuments} style={{ background: "linear-gradient(135deg, #E8690B 0%, #C45500 100%)", color: "#fff", border: "none", borderRadius: 16, padding: "24px 16px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", boxShadow: "0 4px 20px rgba(232,105,11,0.3)", transition: "transform 0.1s" }}
          onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>Get Documents Made</div>
          <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.5 }}>
            Make missing certificates, letters & dockets needed for any scheme
          </div>
          <div style={{ marginTop: 14, fontSize: 11, background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "4px 10px", display: "inline-block" }}>
            Address cert · Bank letter · Caste cert guide · Aadhaar docket →
          </div>
        </button>
      </div>

      <div style={{ marginTop: 20, background: COLORS.mist, borderRadius: 10, padding: "12px 16px", fontSize: 12, color: COLORS.slate }}>
        💡 <strong>Tip:</strong> You can do both in the same session. Apply for schemes first, then come back to make any missing documents — or vice versa.
      </div>
    </div>
  );
}

// ─── QUICK AADHAAR SCAN (for DocDetailScreen) ────────────────────────────────
function QuickAadhaarScan({ onFilled }) {
  const [state, setState] = useState("idle"); // idle | scanning | done | error
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  const PROMPT = `You are reading an Indian Aadhaar card image. Extract all visible information and return ONLY a JSON object:
{"name":"Full name as printed","dob":"DD/MM/YYYY","gender":"Male/Female/Other","aadhaarNumber":"12-digit no spaces","aadhaarLast4":"last 4 digits","address":"full address","addressState":"state from address","pincode":"6-digit","fatherName":"father or husband name or empty","caste":"SC or ST or OBC-A or OBC-B or General or empty if not on card"}
Return ONLY the JSON.`;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setState("scanning");
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    try {
      const b64 = await fileToBase64(file);
      const result = await callClaudeVision(b64, file.type || "image/jpeg", PROMPT);
      if (result?.name) {
        onFilled(result);
        setState("done");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  };

  if (state === "cam") return (
    <div style={{ marginBottom: 16 }}>
      <DocScanCamera
        slotKey="aadhaar_front"
        slotLabel="Aadhaar Card"
        onCancel={() => setState("idle")}
        onCapture={async (result) => {
          setState("scanning");
          try {
            const res = await fetch(result.preview);
            const blob = await res.blob();
            const file = new File([blob], "aadhaar_scan.jpg", { type: "image/jpeg" });
            const b64 = await fileToBase64(file);
            const scanResult = await callClaudeVision(b64, "image/jpeg", PROMPT);
            if (!scanResult?.name) { setState("error"); return; }
            onFilled(scanResult);
            setState("done");
          } catch { setState("error"); }
        }}
      />
    </div>
  );

  if (state === "idle") return (
    <div style={{ background: "#EAF0FA", border: "2px dashed #0D224050", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 28 }}>🪪</span>
        <div>
          <div style={{ fontWeight: 800, color: COLORS.navy, fontSize: 13 }}>Scan Aadhaar to Auto-Fill</div>
          <div style={{ fontSize: 11, color: "#5A6A7A", marginTop: 2 }}>AI reads the card and fills name, DOB, address instantly</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setState("cam")} style={{ flex: 1, background: "#1A3A5C", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          📷 Scan with Camera
        </button>
        <label style={{ flex: 1, background: COLORS.navy, color: "#fff", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textAlign: "center", display: "block" }}>
          📁 Upload File
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        </label>
      </div>
    </div>
  );

  if (state === "scanning") return (
    <div style={{ background: "#EAF0FA", borderRadius: 12, padding: "16px", marginBottom: 16, textAlign: "center" }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>⏳</div>
      <div style={{ fontWeight: 700, color: COLORS.navy, fontSize: 13 }}>Reading Aadhaar card...</div>
      <div style={{ fontSize: 12, color: "#7A8A9A", marginTop: 4 }}>AI is extracting name, address and details</div>
    </div>
  );

  if (state === "done") return (
    <div style={{ background: "#E8F5EE", border: "1.5px solid #34A85A40", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 24 }}>✅</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: COLORS.green, fontSize: 13 }}>Aadhaar scanned — fields auto-filled below</div>
        <div style={{ fontSize: 12, color: "#5A6A7A", marginTop: 2 }}>Check green fields and correct if needed before printing</div>
      </div>
      <button onClick={() => { setState("idle"); setPreview(null); }}
        style={{ background: "transparent", border: "1px solid #34A85A60", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: COLORS.green, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
        Rescan
      </button>
    </div>
  );

  if (state === "error") return (
    <div style={{ background: "#FADBD8", border: "1.5px solid #E7363640", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 24 }}>❌</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: COLORS.red, fontSize: 13 }}>Could not read Aadhaar card</div>
        <div style={{ fontSize: 12, color: "#5A6A7A", marginTop: 2 }}>Try a clearer photo — good light, all corners visible, no glare</div>
      </div>
      <button onClick={() => { setState("idle"); fileRef.current?.click(); }}
        style={{ background: COLORS.red, border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
        Try Again
      </button>
    </div>
  );

  return null;
}


// ─── PHOTO PROCESSOR ─────────────────────────────────────────────────────────
// AI-powered passport photo checker + canvas-based background remover/fixer

const PHOTO_SPECS = {
  passport:  { w: 350, h: 450, label: "Passport (3.5×4.5 cm)", minFace: 0.70, maxFace: 0.80 },
  standard:  { w: 250, h: 250, label: "Standard (2.5×2.5 cm)", minFace: 0.60, maxFace: 0.80 },
  ration:    { w: 300, h: 400, label: "Ration Card (3×4 cm)",  minFace: 0.65, maxFace: 0.80 },
};

async function analyzePhotoWithAI(imageBase64, mediaType) {
  const prompt = `Analyze this passport/ID photograph and return ONLY a JSON object:
{
  "hasFace": true/false,
  "faceCount": number,
  "faceCoverage": 0.0-1.0 (fraction of image height occupied by face),
  "backgroundIsWhite": true/false,
  "backgroundColor": "white/off-white/gray/colored/complex",
  "isBlurry": true/false,
  "isWellLit": true/false,
  "hasGlare": true/false,
  "faceIsForward": true/false,
  "eyesOpen": true/false,
  "faceTopPct": 0.0-1.0 (top of face as fraction of image height),
  "faceBotPct": 0.0-1.0 (bottom of face/chin as fraction of image height),
  "faceLeftPct": 0.0-1.0,
  "faceRightPct": 0.0-1.0,
  "issues": ["list","of","problems"],
  "overallScore": 0-100,
  "verdict": "good/fixable/unusable"
}
Be precise with face coverage numbers. Return ONLY the JSON.`;
  return callClaudeVision(imageBase64, mediaType, prompt);
}

function makeWhiteBackground(canvas, ctx, imageData, threshold = 30) {
  const data = imageData.data;
  const w = canvas.width, h = canvas.height;
  
  // Sample corners + edges to determine background color
  const samplePixels = [];
  const cornerSize = Math.min(20, Math.floor(w * 0.06));
  for (let y = 0; y < cornerSize; y++) {
    for (let x = 0; x < cornerSize; x++) {
      samplePixels.push([x, y], [w-1-x, y], [x, h-1-y], [w-1-x, h-1-y]);
    }
  }
  
  let rSum = 0, gSum = 0, bSum = 0, n = samplePixels.length;
  samplePixels.forEach(([x, y]) => {
    const i = (y * w + x) * 4;
    rSum += data[i]; gSum += data[i+1]; bSum += data[i+2];
  });
  const bgR = rSum/n, bgG = gSum/n, bgB = bSum/n;
  
  // BFS flood-fill from all 4 edges to find background pixels
  const visited = new Uint8Array(w * h);
  const queue = [];
  
  const isBackground = (x, y) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return false;
    const i = (y * w + x) * 4;
    const dr = Math.abs(data[i] - bgR);
    const dg = Math.abs(data[i+1] - bgG);
    const db = Math.abs(data[i+2] - bgB);
    return (dr + dg + db) / 3 < threshold;
  };
  
  // Seed from all border pixels
  for (let x = 0; x < w; x++) { queue.push([x, 0]); queue.push([x, h-1]); }
  for (let y = 1; y < h-1; y++) { queue.push([0, y]); queue.push([w-1, y]); }
  
  while (queue.length > 0) {
    const [x, y] = queue.pop();
    if (x < 0 || x >= w || y < 0 || y >= h) continue;
    const idx = y * w + x;
    if (visited[idx]) continue;
    if (!isBackground(x, y)) continue;
    visited[idx] = 1;
    queue.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  
  // Replace all visited background pixels with white, slightly feather edges
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const pi = idx * 4;
      if (visited[idx]) {
        data[pi] = 255; data[pi+1] = 255; data[pi+2] = 255; data[pi+3] = 255;
      } else {
        // Check if any neighbour is background — feather edge
        const hasNearBg = (visited[(y-1)*w+x] || visited[(y+1)*w+x] || visited[y*w+(x-1)] || visited[y*w+(x+1)]);
        if (hasNearBg) {
          // Blend towards white slightly for smooth edge
          data[pi]   = Math.min(255, data[pi]   + 40);
          data[pi+1] = Math.min(255, data[pi+1] + 40);
          data[pi+2] = Math.min(255, data[pi+2] + 40);
        }
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function processPhotoOnCanvas(srcImg, analysis, spec, fixBackground) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  
  const srcW = srcImg.naturalWidth || srcImg.width;
  const srcH = srcImg.naturalHeight || srcImg.height;
  
  // Determine crop rectangle to center face with correct coverage
  let cropX = 0, cropY = 0, cropW = srcW, cropH = srcH;
  
  if (analysis && analysis.hasFace && analysis.faceTopPct != null) {
    const faceTop    = analysis.faceTopPct * srcH;
    const faceBot    = analysis.faceBotPct * srcH;
    const faceLeft   = analysis.faceLeftPct * srcW;
    const faceRight  = analysis.faceRightPct * srcW;
    const faceH      = faceBot - faceTop;
    const faceW      = faceRight - faceLeft;
    const faceCenterX = (faceLeft + faceRight) / 2;
    const faceCenterY = (faceTop + faceBot) / 2;
    
    // Target: face occupies ~75% of output height
    // So: cropH = faceH / 0.75
    const targetCoverage = 0.75;
    const targetCropH = faceH / targetCoverage;
    const targetCropW = targetCropH * (spec.w / spec.h);
    
    // Center crop on face center, but shift face slightly up (head room)
    cropX = Math.max(0, faceCenterX - targetCropW / 2);
    cropY = Math.max(0, faceCenterY - faceH * 0.6 - faceH * 0.15); // a bit of head room
    cropW = Math.min(targetCropW, srcW - cropX);
    cropH = Math.min(targetCropH, srcH - cropY);
    
    // Ensure aspect ratio
    if (cropW / cropH > spec.w / spec.h) cropW = cropH * (spec.w / spec.h);
    else cropH = cropW / (spec.w / spec.h);
  }
  
  canvas.width  = spec.w;
  canvas.height = spec.h;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, spec.w, spec.h);
  ctx.drawImage(srcImg, cropX, cropY, cropW, cropH, 0, 0, spec.w, spec.h);
  
  // Fix background if needed
  if (fixBackground) {
    const imageData = ctx.getImageData(0, 0, spec.w, spec.h);
    makeWhiteBackground(canvas, ctx, imageData, 35);
  }
  
  // Enhance brightness/contrast slightly
  const imageData = ctx.getImageData(0, 0, spec.w, spec.h);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    // Contrast: stretch histogram slightly
    d[i]   = Math.min(255, Math.max(0, (d[i]   - 128) * 1.08 + 128 + 5));
    d[i+1] = Math.min(255, Math.max(0, (d[i+1] - 128) * 1.08 + 128 + 5));
    d[i+2] = Math.min(255, Math.max(0, (d[i+2] - 128) * 1.08 + 128 + 5));
  }
  ctx.putImageData(imageData, 0, 0);
  
  return canvas.toDataURL("image/jpeg", 0.95);
}

function PhotoProcessor({ onAccept, onCancel, specType = "standard", initialFile = null }) {
  const [phase, setPhase]         = useState(initialFile ? "analyzing" : "upload");
  const [originalSrc, setOriginalSrc]   = useState(null);
  const [originalFile, setOriginalFile] = useState(initialFile);
  const [analysis, setAnalysis]   = useState(null);
  const [processedSrc, setProcessedSrc] = useState(null);
  const [fixBg, setFixBg]         = useState(true);
  const [specKey, setSpecKey]     = useState(specType);
  const [error, setError]         = useState(null);
  const fileRef = useRef();
  const imgRef  = useRef();

  const spec = PHOTO_SPECS[specKey] || PHOTO_SPECS.standard;

  // Auto-process if initialFile passed
  useEffect(() => {
    if (initialFile) startProcessing(initialFile);
  }, []);

  const startProcessing = async (file) => {
    setPhase("analyzing"); setError(null);
    const b64 = await fileToBase64(file);
    const mt  = file.type || "image/jpeg";
    
    // Set original preview
    const reader = new FileReader();
    reader.onload = e => setOriginalSrc(e.target.result);
    reader.readAsDataURL(file);
    
    const result = await analyzePhotoWithAI(b64, mt);
    if (!result) { setError("AI could not analyze the photo. Try a clearer image."); setPhase("upload"); return; }
    setAnalysis(result);
    
    if (result.verdict === "unusable" && !result.hasFace) {
      setError("No face detected in this photo. Please upload a clear face photo.");
      setPhase("upload"); return;
    }
    
    setPhase("preview");
  };

  const applyFixes = () => {
    const img = imgRef.current;
    if (!img) return;
    const needsBgFix = fixBg && !analysis?.backgroundIsWhite;
    // Ensure image is fully loaded before canvas processing
    const doProcess = () => {
      try {
        const out = processPhotoOnCanvas(img, analysis, spec, needsBgFix);
        setProcessedSrc(out);
        setPhase("done");
      } catch(e) {
        setError("Could not process image. Try a different photo.");
      }
    };
    if (img.complete && img.naturalWidth > 0) doProcess();
    else { img.onload = doProcess; }
  };

  const scoreColor = s => s >= 80 ? COLORS.green : s >= 55 ? COLORS.amber : COLORS.red;
  const scoreLabel = s => s >= 80 ? "✅ Good" : s >= 55 ? "⚠️ Fixable" : "❌ Poor";

  const issues = analysis?.issues || [];
  const canFix = analysis && (
    !analysis.backgroundIsWhite ||
    analysis.faceCoverage < 0.65 || analysis.faceCoverage > 0.85 ||
    !analysis.isWellLit
  );

  // ── Camera helpers ──────────────────────────────────────────────────────────
  const videoRef   = useRef(null);
  const streamRef  = useRef(null);
  const countRef   = useRef(null);
  const [camPhase, setCamPhase]       = useState("idle"); // idle|starting|live|countdown|flash
  const [camError, setCamError]       = useState(null);
  const [countdown, setCountdown]     = useState(0);
  const [camFacing, setCamFacing]     = useState("user"); // user|environment

  const stopCam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (countRef.current) { clearInterval(countRef.current); countRef.current = null; }
    setCamPhase("idle");
  };

  const startCam = async (facing) => {
    setCamPhase("starting"); setCamError(null);
    try {
      const constraints = { video: { facingMode: facing || camFacing, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setCamPhase("live");
      // Attach stream to video element on next tick
      requestAnimationFrame(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
      });
    } catch (e) {
      setCamError(e.name === "NotAllowedError" ? "Camera permission denied — please allow camera access in your browser." :
                  e.name === "NotFoundError"   ? "No camera found on this device." :
                  "Could not start camera: " + e.message);
      setCamPhase("idle");
    }
  };

  const capturePhoto = () => {
    // 3-second countdown then snap
    setCountdown(3); setCamPhase("countdown");
    let c = 3;
    countRef.current = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(countRef.current); countRef.current = null;
        snapPhoto();
      }
    }, 1000);
  };

  const snapPhoto = () => {
    setCamPhase("flash");
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    // Mirror-correct for front camera
    if (camFacing === "user") {
      ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      stopCam();
      const file = new File([blob], "camera_photo.jpg", { type: "image/jpeg" });
      setOriginalFile(file);
      const reader = new FileReader();
      reader.onload = e => setOriginalSrc(e.target.result);
      reader.readAsDataURL(file);
      startProcessing(file);
    }, "image/jpeg", 0.95);
  };

  // Cleanup cam on unmount
  useEffect(() => () => stopCam(), []);

  if (phase === "upload") {
    if (camPhase === "starting") return (
      <div style={{ background: "#EAF0FA", borderRadius: 12, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
        <div style={{ fontWeight: 700, color: COLORS.navy, fontSize: 14 }}>Starting camera...</div>
        <div style={{ fontSize: 12, color: "#7A8A9A", marginTop: 6 }}>Please allow camera access when prompted</div>
      </div>
    );

    if (camPhase === "live" || camPhase === "countdown" || camPhase === "flash") return (
      <div style={{ borderRadius: 12, overflow: "hidden", border: "2px solid #0D2240", background: "#000" }}>
        {/* Viewfinder */}
        <div style={{ position: "relative", background: "#000" }}>
          <video ref={videoRef} autoPlay playsInline muted
            style={{ width: "100%", maxHeight: 340, display: "block", objectFit: "cover",
                     transform: camFacing === "user" ? "scaleX(-1)" : "none",
                     opacity: camPhase === "flash" ? 0 : 1, transition: "opacity 0.1s" }} />

          {/* Face guide overlay */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ width: "42%", height: "70%", border: "2px dashed rgba(255,255,255,0.6)", borderRadius: "50% 50% 45% 45%", boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)" }} />
          </div>

          {/* Countdown overlay */}
          {camPhase === "countdown" && countdown > 0 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: 80, fontWeight: 900, color: "#fff", textShadow: "0 2px 20px rgba(0,0,0,0.8)", lineHeight: 1 }}>{countdown}</div>
            </div>
          )}

          {/* Flash effect */}
          {camPhase === "flash" && (
            <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: 0.9 }} />
          )}

          {/* Guide text */}
          <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 600, pointerEvents: "none" }}>
            {camPhase === "countdown" ? `Hold still...` : "Align face inside the oval · Look straight at camera"}
          </div>

          {/* Flip camera button (top right) */}
          <button onClick={() => { stopCam(); const next = camFacing === "user" ? "environment" : "user"; setCamFacing(next); startCam(next); }}
            style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
            🔄 Flip
          </button>
        </div>

        {/* Controls */}
        <div style={{ background: "#111", padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => stopCam()}
            style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            ✕ Cancel
          </button>
          <button onClick={capturePhoto} disabled={camPhase === "countdown"}
            style={{ flex: 1, background: camPhase === "countdown" ? "#666" : COLORS.saffron, color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 900, cursor: camPhase === "countdown" ? "default" : "pointer", fontFamily: "inherit" }}>
            {camPhase === "countdown" ? `📸 ${countdown}...` : "📸 Take Photo"}
          </button>
        </div>
      </div>
    );

    // Default upload screen with camera option
    return (
      <div style={{ background: "#F8FAFD", borderRadius: 12, padding: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>📸</div>
          <div style={{ fontWeight: 800, color: COLORS.navy, fontSize: 14, marginBottom: 4 }}>AI Photo Check & Fix</div>
          <div style={{ fontSize: 12, color: "#7A8A9A" }}>AI checks face, background, brightness — and auto-fixes to passport spec</div>
        </div>

        {(error || camError) && (
          <div style={{ background: "#FADBD8", color: COLORS.red, borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 12 }}>{error || camError}</div>
        )}

        {/* Size selector */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
          {Object.entries(PHOTO_SPECS).map(([k, s]) => (
            <button key={k} onClick={() => setSpecKey(k)} style={{ background: specKey === k ? COLORS.navy : "#fff", color: specKey === k ? "#fff" : COLORS.slate, border: `2px solid ${specKey === k ? COLORS.navy : "#D0D8E4"}`, borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Two big action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button onClick={() => startCam("user")}
            style={{ background: "linear-gradient(135deg,#0D2240,#1A3A5C)", color: "#fff", border: "none", borderRadius: 12, padding: "18px 12px", cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>📷</div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>Take Photo Now</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 3 }}>Use camera — with face guide</div>
          </button>

          <label style={{ background: "linear-gradient(135deg,#E8690B,#C45500)", color: "#fff", borderRadius: 12, padding: "18px 12px", cursor: "pointer", fontFamily: "inherit", textAlign: "center", display: "block" }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>📁</div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>Upload Existing</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 3 }}>JPG, PNG — any background</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) { setOriginalFile(f); startProcessing(f); } }} />
          </label>
        </div>

        <div style={{ marginTop: 12, textAlign: "center", fontSize: 11, color: "#7A8A9A" }}>
          AI will auto-fix background, crop to face, resize to spec
        </div>
      </div>
    );
  }

  if (phase === "analyzing") return (
    <div style={{ background: "#EAF0FA", borderRadius: 12, padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
      <div style={{ fontWeight: 700, color: COLORS.navy, fontSize: 14 }}>AI analyzing photo...</div>
      <div style={{ fontSize: 12, color: "#7A8A9A", marginTop: 6 }}>Checking face, background, brightness, size</div>
    </div>
  );

  if (phase === "preview" && analysis) {
    const sc = analysis.overallScore || 0;
    return (
      <div style={{ borderRadius: 12, overflow: "hidden", border: "1.5px solid #E0E8F0" }}>
        {/* Header */}
        <div style={{ background: scoreColor(sc) === COLORS.green ? "#E8F5EE" : scoreColor(sc) === COLORS.amber ? "#FEF3E2" : "#FADBD8", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: COLORS.navy, fontSize: 14 }}>Photo Analysis</div>
            <div style={{ fontSize: 12, color: "#5A6A7A", marginTop: 2 }}>{analysis.backgroundIsWhite ? "White background ✅" : "Background needs fixing ⚠️"} · Face {Math.round((analysis.faceCoverage || 0) * 100)}% coverage · {analysis.isWellLit ? "Well lit ✅" : "Poor lighting ⚠️"}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 900, fontSize: 20, color: scoreColor(sc) }}>{sc}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: scoreColor(sc) }}>{scoreLabel(sc)}</div>
          </div>
        </div>

        {/* Original preview */}
        <div style={{ padding: 16, background: "#fff" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#7A8A9A", marginBottom: 6 }}>ORIGINAL</div>
              {originalSrc && <img ref={imgRef} src={originalSrc} crossOrigin="anonymous" alt="original" style={{ width: 100, height: 130, objectFit: "cover", borderRadius: 6, border: "1px solid #E0E8F0", display: "block" }} />}
            </div>
            <div style={{ flex: 1 }}>
              {issues.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.navy, marginBottom: 6 }}>ISSUES FOUND</div>
                  {issues.map((iss, i) => (
                    <div key={i} style={{ fontSize: 12, color: COLORS.slate, padding: "3px 0", display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ color: COLORS.amber }}>⚠</span> {iss}
                    </div>
                  ))}
                </div>
              )}
              {issues.length === 0 && <div style={{ fontSize: 13, color: COLORS.green, fontWeight: 700, marginBottom: 12 }}>✅ Photo looks good!</div>}

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.navy, marginBottom: 6 }}>OUTPUT SIZE</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {Object.entries(PHOTO_SPECS).map(([k, s]) => (
                    <button key={k} onClick={() => setSpecKey(k)} style={{ background: specKey === k ? COLORS.navy : "#fff", color: specKey === k ? "#fff" : COLORS.slate, border: `1.5px solid ${specKey === k ? COLORS.navy : "#D0D8E4"}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {!analysis.backgroundIsWhite && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 8 }}>
                  <input type="checkbox" checked={fixBg} onChange={e => setFixBg(e.target.checked)} style={{ width: 14, height: 14 }} />
                  <span style={{ fontSize: 12, color: COLORS.slate, fontWeight: 600 }}>Replace background with white</span>
                </label>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {canFix ? (
              <button onClick={applyFixes} style={{ flex: 1, background: COLORS.saffron, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                ✨ Fix & Use This Photo
              </button>
            ) : (
              <button onClick={() => {
                // Photo is already good — just resize and use
                const img = imgRef.current;
                if (img) { const out = processPhotoOnCanvas(img, analysis, spec, false); onAccept({ src: out, spec: specKey, originalFile }); }
              }} style={{ flex: 1, background: COLORS.green, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                ✅ Use This Photo
              </button>
            )}
            <button onClick={() => { setPhase("upload"); setError(null); }} style={{ background: "#F0F4F8", color: COLORS.slate, border: "none", borderRadius: 10, padding: "11px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "done" && processedSrc) {
    const img = new Image();
    img.src = processedSrc;
    return (
      <div style={{ borderRadius: 12, overflow: "hidden", border: "1.5px solid #34A85A" }}>
        <div style={{ background: "#E8F5EE", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>✅</span>
          <div>
            <div style={{ fontWeight: 800, color: COLORS.green, fontSize: 14 }}>Photo processed — ready to use</div>
            <div style={{ fontSize: 12, color: "#5A6A7A" }}>Background white · {spec.label} · Cropped to face</div>
          </div>
        </div>
        <div style={{ padding: 16, background: "#fff" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#7A8A9A", marginBottom: 6 }}>BEFORE</div>
              {originalSrc && <img src={originalSrc} alt="before" style={{ width: 90, height: 116, objectFit: "cover", borderRadius: 6, border: "1px solid #E0E8F0", display: "block" }} />}
            </div>
            <div style={{ fontSize: 20, alignSelf: "center", color: COLORS.saffron, fontWeight: 900 }}>→</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.green, marginBottom: 6 }}>PROCESSED</div>
              <img src={processedSrc} alt="processed" style={{ width: 90, height: 116, objectFit: "contain", borderRadius: 6, border: "2px solid #34A85A", background: "#fff", display: "block" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={() => {
              // Convert dataURL to a File-like object for the vault
              fetch(processedSrc).then(r => r.blob()).then(blob => {
                const file = new File([blob], "photo_processed.jpg", { type: "image/jpeg" });
                onAccept({ src: processedSrc, spec: specKey, originalFile, processedFile: file, size: blob.size, name: "photo_processed.jpg", type: "image/jpeg", preview: processedSrc });
              });
            }} style={{ flex: 1, background: COLORS.green, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
              ✅ Use Processed Photo
            </button>
            <button onClick={() => setPhase("preview")} style={{ background: "#F0F4F8", color: COLORS.slate, border: "none", borderRadius: 10, padding: "11px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}


// ─── DOCUMENT SCAN CAMERA ────────────────────────────────────────────────────
// Camera with document rectangle guide → capture → AI extract → confirm & store

function DocScanCamera({ slotKey, slotLabel, onCapture, onCancel }) {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const [camPhase, setCamPhase] = useState("starting"); // starting|live|flash|extracting|confirm|error
  const [camError, setCamError] = useState(null);
  const [camFacing, setCamFacing] = useState("environment"); // back cam better for docs
  const [capturedSrc, setCapturedSrc] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [extractErr, setExtractErr] = useState(null);

  const stopCam = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  const startCam = async (facing) => {
    setCamPhase("starting"); setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false
      });
      streamRef.current = stream;
      setCamPhase("live");
      requestAnimationFrame(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
      });
    } catch (e) {
      setCamError(
        e.name === "NotAllowedError" ? "Camera access denied — please allow camera in browser settings." :
        e.name === "NotFoundError"   ? "No camera found on this device." :
        "Could not start camera: " + e.message
      );
      setCamPhase("error");
    }
  };

  useEffect(() => { startCam(camFacing); return () => stopCam(); }, []);

  const snapDoc = () => {
    setCamPhase("flash");
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d").drawImage(video, 0, 0);
    stopCam();
    canvas.toBlob(async blob => {
      const src = URL.createObjectURL(blob);
      setCapturedSrc(src);
      setCamPhase("extracting");
      // Convert to base64 for AI
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const b64 = ev.target.result.split(",")[1];
        const prompt = SCAN_CONFIRM_PROMPTS[slotKey] || SCAN_CONFIRM_PROMPTS.default;
        const result = await callClaudeVision(b64, "image/jpeg", prompt);
        if (!result) {
          setExtractErr("AI could not read document clearly. Try again with better light.");
          setCamPhase("confirm"); // still let them use the image
        } else {
          setExtracted(result);
          setCamPhase("confirm");
        }
      };
      reader.readAsDataURL(blob);
    }, "image/jpeg", 0.92);
  };

  const flipCam = () => {
    stopCam();
    const next = camFacing === "environment" ? "user" : "environment";
    setCamFacing(next);
    startCam(next);
  };

  const acceptScan = () => {
    // Convert blob URL to data URL for storage
    fetch(capturedSrc).then(r => r.blob()).then(blob => {
      const reader = new FileReader();
      reader.onload = ev => {
        onCapture({
          preview:   ev.target.result,
          name:      `${slotKey}_scan.jpg`,
          size:      blob.size,
          type:      "image/jpeg",
          extracted: extracted,
        });
      };
      reader.readAsDataURL(blob);
    });
  };

  // ── STARTING ──────────────────────────────────────────────────────────────
  if (camPhase === "starting") return (
    <div style={{ background: "#111", borderRadius: 12, padding: 32, textAlign: "center", color: "#fff" }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>📷</div>
      <div style={{ fontWeight: 700, fontSize: 14 }}>Starting camera...</div>
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>Allow camera access when prompted</div>
    </div>
  );

  // ── ERROR ─────────────────────────────────────────────────────────────────
  if (camPhase === "error") return (
    <div style={{ background: "#FADBD8", borderRadius: 12, padding: 20, textAlign: "center" }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
      <div style={{ fontWeight: 700, color: COLORS.red, fontSize: 13, marginBottom: 8 }}>{camError}</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={() => startCam(camFacing)} style={{ background: COLORS.navy, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Retry</button>
        <button onClick={onCancel} style={{ background: "#F0F4F8", color: COLORS.slate, border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
      </div>
    </div>
  );

  // ── LIVE VIEWFINDER ───────────────────────────────────────────────────────
  if (camPhase === "live" || camPhase === "flash") return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "2px solid #0D2240", background: "#000" }}>
      <div style={{ position: "relative", background: "#000" }}>
        <video ref={videoRef} autoPlay playsInline muted
          style={{ width: "100%", maxHeight: 320, display: "block", objectFit: "cover",
                   opacity: camPhase === "flash" ? 0 : 1, transition: "opacity 0.08s" }} />

        {/* Document rectangle guide */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          {/* Dark overlay with transparent rectangle cutout via box-shadow */}
          <div style={{
            width: "82%", height: "72%",
            border: "2px solid rgba(255,255,255,0.9)",
            borderRadius: 8,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.42)",
            position: "relative",
          }}>
            {/* Corner brackets */}
            {[["0","0","borderTop","borderLeft"],["0","auto","borderTop","borderRight"],["auto","0","borderBottom","borderLeft"],["auto","auto","borderBottom","borderRight"]].map(([t,r,bv,bh], i) => (
              <div key={i} style={{ position:"absolute", top:t==="auto"?undefined:-2, bottom:t==="auto"?-2:undefined, left:r==="auto"?undefined:-2, right:r==="auto"?-2:undefined, width:18, height:18, [bv]:"3px solid #E8690B", [bh]:"3px solid #E8690B" }} />
            ))}
          </div>
        </div>

        {/* Flash overlay */}
        {camPhase === "flash" && <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: 0.85 }} />}

        {/* Guide text */}
        <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: 600, pointerEvents: "none" }}>
          Place document flat · Fill the rectangle · Keep steady
        </div>

        {/* Flip button */}
        <button onClick={flipCam} style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: 7, padding: "5px 9px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>🔄</button>
      </div>

      {/* Controls */}
      <div style={{ background: "#111", padding: "12px 14px", display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
        <button onClick={snapDoc} style={{ flex: 1, background: COLORS.saffron, color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>
          📷 Scan Document
        </button>
      </div>
    </div>
  );

  // ── EXTRACTING ────────────────────────────────────────────────────────────
  if (camPhase === "extracting") return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1.5px solid #E0E8F0" }}>
      {capturedSrc && <img src={capturedSrc} alt="scanned" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block", opacity: 0.6 }} />}
      <div style={{ background: "#EAF0FA", padding: "16px", textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>🔍</div>
        <div style={{ fontWeight: 700, color: COLORS.navy, fontSize: 13 }}>AI reading document...</div>
        <div style={{ fontSize: 11, color: "#7A8A9A", marginTop: 4 }}>Extracting details from {slotLabel}</div>
      </div>
    </div>
  );

  // ── CONFIRM ───────────────────────────────────────────────────────────────
  if (camPhase === "confirm") return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: `1.5px solid ${extracted ? COLORS.green : COLORS.amber}` }}>
      {/* Scanned image preview */}
      {capturedSrc && (
        <div style={{ position: "relative" }}>
          <img src={capturedSrc} alt="scanned document" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,rgba(0,0,0,0.6))", padding: "12px 14px" }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>{slotLabel}</div>
          </div>
        </div>
      )}

      <div style={{ padding: "14px 16px", background: "#fff" }}>
        {/* Extracted fields */}
        {extracted && !extractErr && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, color: COLORS.green, fontSize: 12, marginBottom: 8 }}>✅ AI extracted from document</div>
            <div style={{ background: "#F0FFF4", borderRadius: 8, padding: "10px 12px" }}>
              {Object.entries(extracted).filter(([k,v]) => k !== "docType" && v).map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 8, padding: "3px 0", borderBottom: "1px solid #E0F0E8", fontSize: 12 }}>
                  <span style={{ color: "#5A6A7A", fontWeight: 600, minWidth: 110 }}>{k.replace(/([A-Z])/g," $1").replace(/^./,s=>s.toUpperCase())}:</span>
                  <span style={{ color: COLORS.navy, fontWeight: 700 }}>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {extractErr && (
          <div style={{ background: "#FEF3E2", borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 12, color: COLORS.amber }}>
            ⚠️ {extractErr} — image still saved, fields may need manual entry.
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={acceptScan} style={{ flex: 1, background: COLORS.green, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
            ✅ Use This Scan
          </button>
          <button onClick={() => { setCapturedSrc(null); setExtracted(null); setExtractErr(null); startCam(camFacing); }}
            style={{ background: "#F0F4F8", color: COLORS.slate, border: "none", borderRadius: 10, padding: "11px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            🔄 Rescan
          </button>
          <button onClick={onCancel} style={{ background: "#F0F4F8", color: COLORS.slate, border: "none", borderRadius: 10, padding: "11px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}

// ─── DOCUMENT CATALOGUE (DOC MAKE SCREEN) ────────────────────────────────────
const DOC_CATALOGUE = [
  {
    id: "aadhaar_address",
    icon: "🪪", color: "#0D2240", bg: "#EAF0FA",
    title: "Aadhaar — Address Update",
    subtitle: "Update address to West Bengal in Aadhaar",
    mode: "offline",
    officeLabel: "Aadhaar Seva Kendra, Asansol",
    officeAddress: "Ground Floor, Surya Sen Park, 170 G.T. Road (West), Asansol — 713304",
    officeHours: "9:30 AM – 5:30 PM (Mon–Sat)",
    officeFee: "₹50 (demographic) · ₹100 (biometric)",
    bookingUrl: "https://bookappointment.uidai.gov.in/",
    formFields: [
      { key: "name",        label: "Full Name (as in Aadhaar)",    ph: "", required: true },
      { key: "aadhaar",     label: "Aadhaar Number",               ph: "12-digit", required: true },
      { key: "phone",       label: "Mobile Number",                ph: "10-digit", required: true },
      { key: "dob",         label: "Date of Birth",                ph: "DD/MM/YYYY", required: false },
      { key: "newAddress",  label: "New Address (full)",           ph: "Flat/House, Area, City, PIN", required: true },
      { key: "updateType",  label: "Update Type",                  ph: "Address / Mobile / Name / DOB", required: true },
    ],
    docsNeeded: ["Aadhaar card — ORIGINAL (mandatory for biometric)", "Employer address certificate (MB Sponge letterhead)", "Any government ID with new address", "₹50–₹100 cash for fee", "Appointment printout if booked online"],
    printDocType: "seva_kendra_docket",
    uploadDocs: [
      { category: "Current Aadhaar (to be updated)", categoryHint: "Existing Aadhaar card — will be updated at the Seva Kendra", items: [
        { key: "aadhaar_front",  label: "Aadhaar Card (current)", required: true,  hint: "Original mandatory — biometric scan at counter",      accept: "image/*,.pdf", sharedKey: "aadhaar_front" },
      ]},
      { category: "Residential Proof (New Address)", categoryHint: "Document that proves the new address — this gets recorded in Aadhaar", items: [
        { key: "address_proof",  label: "Employer Address Certificate", required: true,  hint: "MB Sponge letterhead — key proof for address",   accept: "image/*,.pdf", generateType: "employer_address_letter", generateLabel: "Generate Now 🖨️" },
      ]},
    ],
    steps: ["Book appointment at bookappointment.uidai.gov.in (optional but saves time)", "Visit Asansol Seva Kendra with documents", "Tell operator: 'Address update karna hai — employer certificate hai'", "Biometric scan done at counter", "Receive URN (Update Request Number) — keep it safe", "Download updated e-Aadhaar from uidai.gov.in in 5–7 days"],
  },
  {
    id: "aadhaar_mobile",
    icon: "📱", color: "#0D2240", bg: "#EAF0FA",
    title: "Aadhaar — Mobile Linking",
    subtitle: "Link mobile number to Aadhaar (required for OTP-based schemes)",
    mode: "offline",
    officeLabel: "Aadhaar Seva Kendra, Asansol",
    officeAddress: "Ground Floor, Surya Sen Park, 170 G.T. Road (West), Asansol — 713304",
    officeHours: "9:30 AM – 5:30 PM (Mon–Sat)",
    officeFee: "₹100 (biometric update)",
    bookingUrl: "https://bookappointment.uidai.gov.in/",
    formFields: [
      { key: "name",    label: "Full Name (as in Aadhaar)", ph: "", required: true },
      { key: "aadhaar", label: "Aadhaar Number",            ph: "12-digit", required: true },
      { key: "phone",   label: "Mobile to be Linked",       ph: "10-digit active number", required: true },
    ],
    docsNeeded: ["Aadhaar card — ORIGINAL", "Active mobile phone (the one to be linked — must be present)", "₹100 cash for biometric update fee"],
    printDocType: "appointment_cheatsheet",
    uploadDocs: [
      { category: "Identity Proof", categoryHint: "Aadhaar card for biometric verification at Seva Kendra", items: [
        { key: "aadhaar_front",  label: "Aadhaar Card",          required: true,  hint: "Physical original required — bring the card itself",  accept: "image/*,.pdf", sharedKey: "aadhaar_front" },
      ]},
    ],
    steps: ["Book appointment online OR walk in directly to Asansol ASK", "Carry Aadhaar original + the mobile phone to be linked", "Tell operator: 'Mobile number link karna hai'", "Biometric authentication done", "Mobile linked immediately — OTP will work on same day"],
  },
  {
    id: "caste_cert",
    icon: "📜", color: "#5A1A7A", bg: "#F3E8FF",
    title: "Caste Certificate (SC/ST/OBC)",
    subtitle: "Required for Lakshmir Bhandar, Tapasili Bandhu, Jai Johar, SVMCM scholarship",
    mode: "offline",
    officeLabel: "Block Development Office (BDO), Jamuria",
    officeAddress: "Jamuria Block, Salanpur, Paschim Bardhaman — 713369",
    officeHours: "10:00 AM – 5:00 PM (Mon–Fri)",
    officeFee: "Free for SC/ST · ₹50 for OBC-A/OBC-B",
    bookingUrl: null,
    formFields: [
      { key: "name",        label: "Full Name",                  ph: "As in Aadhaar", required: true },
      { key: "aadhaar",     label: "Aadhaar Number",             ph: "12-digit", required: true },
      { key: "phone",       label: "Mobile Number",              ph: "10-digit", required: true },
      { key: "dob",         label: "Date of Birth",              ph: "DD/MM/YYYY", required: true },
      { key: "fatherName",  label: "Father's Name",              ph: "", required: true },
      { key: "caste",       label: "Caste Category",             ph: "SC / ST / OBC-A / OBC-B", required: true },
      { key: "address",     label: "Residential Address",        ph: "Full address in WB", required: true },
      { key: "purpose",     label: "Purpose",                    ph: "Government scheme / Employment / Education", required: false },
    ],
    docsNeeded: ["Aadhaar card — original + 1 photocopy (self-attested)", "Voter ID or any photo ID", "Ration card — photocopy", "Father's caste certificate (if available — speeds up process)", "MB Sponge employer address letter", "2 passport-size photos", "This printed form"],
    printDocType: "bdo_caste_guide",
    uploadDocs: [
      { category: "Identity Proof", categoryHint: "Proves who you are — Aadhaar is primary", items: [
        { key: "aadhaar_front",  label: "Aadhaar Card",         required: true,  hint: "Self-attested photocopy",                              accept: "image/*,.pdf", sharedKey: "aadhaar_front" },
        { key: "voter_id",       label: "Voter ID",             required: false, hint: "Alternative ID if Aadhaar has issues",                 accept: "image/*,.pdf", sharedKey: "voter_id" },
      ]},
      { category: "Residential Proof", categoryHint: "Proves you reside in the state/block", items: [
        { key: "ration_card",    label: "Ration Card",          required: false, hint: "Front page with family — accepted as address proof",   accept: "image/*,.pdf", sharedKey: "ration_card" },
        { key: "address_cert",   label: "Employer Address Certificate", required: false, hint: "MB Sponge letterhead — if no ration card",    accept: "image/*,.pdf", generateType: "employer_address_letter", generateLabel: "Generate Now 🖨️" },
      ]},
      { category: "Caste Supporting Docs", categoryHint: "Proof of caste status — primary verification docs", items: [
        { key: "father_caste",   label: "Father's Caste Certificate",  required: false, hint: "If available — greatly speeds up the process",   accept: "image/*,.pdf" },
      ]},
      { category: "Photo Proof", categoryHint: "Recent passport-size photograph", items: [
        { key: "photo",          label: "Passport Photo (×2)",  required: true,  hint: "Recent, white background",                             accept: "image/*",      sharedKey: "photo" },
      ]},
    ],
    steps: ["Visit BDO Office, Jamuria Block — ask for 'Jati Praman Patra' counter", "Collect & fill application form (this printout serves as a draft)", "Submit with all documents", "BDO verifies with local Pradhan / Gram Panchayat", "Certificate issued in 2–4 weeks", "Get 3–4 certified copies made at once"],
  },
  {
    id: "income_cert",
    icon: "💰", color: "#1A7A4A", bg: "#E8F5EE",
    title: "Income Certificate",
    subtitle: "Required for SVMCM, Rupashree, Widow Pension, Kanyashree K2",
    mode: "both",
    onlineLabel: "Apply Online (Faster — 3–5 days)",
    onlineUrl: "https://edistrict.wb.gov.in",
    officeLabel: "Block Development Office (BDO), Jamuria",
    officeAddress: "Jamuria Block, Salanpur, Paschim Bardhaman — 713369",
    officeHours: "10:00 AM – 5:00 PM (Mon–Fri)",
    officeFee: "₹30 (online or offline)",
    bookingUrl: null,
    formFields: [
      { key: "name",          label: "Full Name",                ph: "As in Aadhaar", required: true },
      { key: "aadhaar",       label: "Aadhaar Number",           ph: "12-digit", required: true },
      { key: "phone",         label: "Mobile Number",            ph: "10-digit", required: true },
      { key: "dob",           label: "Date of Birth",            ph: "DD/MM/YYYY", required: true },
      { key: "fatherName",    label: "Father's / Husband's Name",ph: "", required: true },
      { key: "annualIncome",  label: "Annual Household Income",  ph: "Total of all earning members (₹)", required: true },
      { key: "occupation",    label: "Occupation",               ph: "e.g. Factory worker, Daily labour", required: false },
      { key: "address",       label: "Residential Address",      ph: "Full address in WB", required: true },
      { key: "purpose",       label: "Purpose",                  ph: "e.g. Scholarship / Scheme application", required: false },
    ],
    docsNeeded: ["Aadhaar card — original + photocopy", "Ration card — photocopy", "MB Sponge employer letter or salary certificate (ask HR)", "2 passport photos", "₹30 fee (exact change for counter, or pay online)"],
    printDocType: "bdo_income_guide",
    uploadDocs: [
      { category: "Residential Proof", categoryHint: "Any one of these proves where you live", items: [
        { key: "aadhaar_front",  label: "Aadhaar Card",         required: true,  hint: "Name & address visible — most widely accepted",      accept: "image/*,.pdf", sharedKey: "aadhaar_front" },
        { key: "ration_card",    label: "Ration Card",          required: false, hint: "Front page with family details (if available)",       accept: "image/*,.pdf", sharedKey: "ration_card" },
      ]},
      { category: "Income Proof", categoryHint: "Proves the applicant's income level for the certificate", items: [
        { key: "salary_cert",    label: "Salary / Employer Certificate", required: true,  hint: "MB Sponge letterhead — from HR dept",         accept: "image/*,.pdf", generateType: "employer_address_letter", generateLabel: "Generate Now 🖨️" },
      ]},
      { category: "Photo Proof", categoryHint: "Recent passport-size photograph of the applicant", items: [
        { key: "photo",          label: "Passport Photo (×2)",  required: true,  hint: "Recent, white background, front-facing",              accept: "image/*",      sharedKey: "photo" },
      ]},
    ],
    steps: ["ONLINE: Register at edistrict.wb.gov.in → login → Revenue Dept → Income Certificate", "Fill form using details below → upload Aadhaar + ration card", "Pay ₹30 online → note application number", "Download digitally-signed certificate in 3–5 working days", "OFFLINE: Visit BDO, Jamuria → 'Aay Praman Patra' counter → submit form + docs + ₹30"],
  },
  {
    id: "bank_account",
    icon: "🏦", color: "#1A3A5C", bg: "#E8F0FA",
    title: "Bank Account — Jan Dhan Opening",
    subtitle: "Zero-balance account required for DBT credit of all scheme benefits",
    mode: "offline",
    officeLabel: "Any nationalised bank branch (SBI / UCO / Allahabad Bank preferred)",
    officeAddress: "SBI Asansol Main Branch: G.T. Road, Asansol · UCO Bank Jamuria Branch: Jamuria Road",
    officeHours: "10:00 AM – 4:00 PM (Mon–Sat, 2nd/4th Sat closed)",
    officeFee: "Zero balance — no fee",
    bookingUrl: null,
    formFields: [
      { key: "name",       label: "Full Name (as in Aadhaar)", ph: "", required: true },
      { key: "aadhaar",    label: "Aadhaar Number",            ph: "12-digit", required: true },
      { key: "phone",      label: "Mobile Number",             ph: "10-digit", required: true },
      { key: "dob",        label: "Date of Birth",             ph: "DD/MM/YYYY", required: true },
      { key: "fatherName", label: "Father's / Husband's Name", ph: "", required: true },
      { key: "address",    label: "Residential Address",       ph: "Full address", required: true },
      { key: "nominee",    label: "Nominee Name",              ph: "Wife / Husband / Son / Daughter", required: true },
      { key: "nomineeRel", label: "Nominee Relation",          ph: "e.g. Wife", required: true },
    ],
    docsNeeded: ["Aadhaar card — ORIGINAL + 1 photocopy (self-attested)", "2 passport-size photos", "Filled account opening form (this printout)", "Active mobile phone (for SMS banking activation)"],
    printDocType: "jan_dhan_prefill",
    uploadDocs: [
      { category: "Identity & Address Proof", categoryHint: "Aadhaar serves as both identity and address proof for bank account opening", items: [
        { key: "aadhaar_front",  label: "Aadhaar Card (front)",  required: true,  hint: "Identity + address — self-attested copy for bank",    accept: "image/*,.pdf", sharedKey: "aadhaar_front" },
        { key: "aadhaar_back",   label: "Aadhaar Card (back)",   required: false, hint: "Back side with barcode",                              accept: "image/*,.pdf", sharedKey: "aadhaar_back" },
      ]},
      { category: "Photo Proof", categoryHint: "Required by bank for account records", items: [
        { key: "photo",          label: "Passport Photo (×2)",   required: true,  hint: "Recent, white background, front-facing",              accept: "image/*",      sharedKey: "photo" },
      ]},
    ],
    steps: ["Walk into any SBI / UCO / Allahabad / Axis Bank branch", "Tell counter: 'Jan Dhan account kholna hai, Aadhaar hai' (জন ধন অ্যাকাউন্ট খুলতে এসেছি)", "Collect PMJDY account opening form — this printout helps fill it", "Submit form + Aadhaar + photos", "Account opens same day — passbook issued in 1–2 weeks", "Seed Aadhaar with account immediately at same counter for DBT"],
  },
  {
    id: "ration_card",
    icon: "🗂️", color: "#5A3A00", bg: "#FEF3E2",
    title: "Ration Card",
    subtitle: "Required for Lakshmir Bhandar and as address proof for multiple schemes",
    mode: "both",
    onlineLabel: "Apply Online at WBPDS",
    onlineUrl: "https://wbpds.wb.gov.in",
    officeLabel: "Block Food Supply Office (FSO), Jamuria",
    officeAddress: "Salanpur, Paschim Bardhaman — 713369",
    officeHours: "10:00 AM – 5:00 PM (Mon–Fri)",
    officeFee: "Free",
    bookingUrl: null,
    formFields: [
      { key: "headName",   label: "Head of Household Name",  ph: "As in Aadhaar", required: true },
      { key: "aadhaar",    label: "Head's Aadhaar Number",   ph: "12-digit", required: true },
      { key: "phone",      label: "Mobile Number",           ph: "10-digit", required: true },
      { key: "address",    label: "Residential Address",     ph: "Full address in WB", required: true },
      { key: "member2",    label: "Member 2 Name",           ph: "Leave blank if none", required: false },
      { key: "member3",    label: "Member 3 Name",           ph: "Leave blank if none", required: false },
      { key: "member4",    label: "Member 4 Name",           ph: "Leave blank if none", required: false },
      { key: "member5",    label: "Member 5 Name",           ph: "Leave blank if none", required: false },
    ],
    docsNeeded: ["Aadhaar of ALL family members — originals + photocopies", "MB Sponge employer address letter", "Proof of no existing ration card (self-declaration)", "2 passport photos (head of household)", "Bank passbook photocopy"],
    printDocType: "ration_card_guide",
    uploadDocs: [
      { category: "Identity Proof (All Members)", categoryHint: "Aadhaar of every family member to be added to the ration card", items: [
        { key: "aadhaar_head",    label: "Aadhaar — Head of Household", required: true,  hint: "Front side, clear scan",                        accept: "image/*,.pdf", sharedKey: "aadhaar_front" },
        { key: "aadhaar_member2", label: "Aadhaar — Member 2",          required: false, hint: "Add if this member is being included",          accept: "image/*,.pdf" },
        { key: "aadhaar_member3", label: "Aadhaar — Member 3",          required: false, hint: "Add if this member is being included",          accept: "image/*,.pdf" },
      ]},
      { category: "Residential Proof", categoryHint: "Proves the family lives at this address in West Bengal", items: [
        { key: "address_proof",   label: "Employer Address Certificate", required: true,  hint: "MB Sponge letter — proves WB address",         accept: "image/*,.pdf", generateType: "employer_address_letter", generateLabel: "Generate Now 🖨️" },
      ]},
      { category: "Financial Proof", categoryHint: "Bank details for DBT credit of food subsidy", items: [
        { key: "bank_passbook",   label: "Bank Passbook (first page)", required: true,  hint: "Shows account number and name",                   accept: "image/*,.pdf", sharedKey: "bank_passbook" },
      ]},
      { category: "Photo Proof", categoryHint: "Recent passport-size photograph of the head of household", items: [
        { key: "photo",           label: "Passport Photo",            required: true,  hint: "Recent, white background",                         accept: "image/*",      sharedKey: "photo" },
      ]},
    ],
    steps: ["ONLINE: Go to wbpds.wb.gov.in → 'Apply for New Ration Card' → login with Aadhaar", "Add all family members with Aadhaar numbers", "Upload documents → submit", "FSO visits home for verification — be present", "Card issued in 30–60 days", "OFFLINE: Visit Block FSO office, Salanpur — submit physical form + docs"],
  },
  {
    id: "disability_cert",
    icon: "♿", color: "#C45500", bg: "#FFF0E0",
    title: "Disability Certificate (UDID)",
    subtitle: "Required for Manabik pension (40%+ disability) and UDID scheme",
    mode: "both",
    onlineLabel: "Apply Online at SWAVLAMBAN",
    onlineUrl: "https://www.swavlambancard.gov.in",
    officeLabel: "District Hospital / CMO Office, Asansol",
    officeAddress: "Asansol District Hospital, G.T. Road, Asansol — 713301",
    officeHours: "9:00 AM – 3:00 PM (Mon–Sat, OPD hours)",
    officeFee: "Free",
    bookingUrl: null,
    formFields: [
      { key: "name",           label: "Full Name",               ph: "As in Aadhaar", required: true },
      { key: "aadhaar",        label: "Aadhaar Number",          ph: "12-digit", required: true },
      { key: "phone",          label: "Mobile Number",           ph: "10-digit", required: true },
      { key: "dob",            label: "Date of Birth",           ph: "DD/MM/YYYY", required: true },
      { key: "disabilityType", label: "Type of Disability",      ph: "e.g. Locomotor / Visual / Hearing / Intellectual", required: true },
      { key: "disabilityPct",  label: "Approximate Disability %",ph: "e.g. 40 / 60 / 80", required: false },
      { key: "address",        label: "Residential Address",     ph: "Full address", required: true },
    ],
    docsNeeded: ["Aadhaar card — original + photocopy", "2 passport photos", "Any previous medical certificate / discharge summary if available", "This printed form for doctor's reference"],
    printDocType: null,
    steps: ["ONLINE: Register at swavlambancard.gov.in → apply for UDID card", "Medical Assessment Board at District Hospital evaluates disability", "OFFLINE: Visit Asansol District Hospital CMO office — 'Viklangta Praman Patra' counter", "Medical team assesses and certifies disability percentage", "Certificate + UDID card issued in 30–45 days"],
    uploadDocs: [
      { category: "Identity & Address Proof", categoryHint: "Aadhaar used for identity and address on the UDID certificate", items: [
        { key: "aadhaar_front",  label: "Aadhaar Card",          required: true,  hint: "Clear photo — name, DOB, address all visible",         accept: "image/*,.pdf", sharedKey: "aadhaar_front" },
      ]},
      { category: "Medical / Disability Proof", categoryHint: "Any existing medical records help the assessment board certify disability faster", items: [
        { key: "medical_cert",   label: "Previous Medical Certificate", required: false, hint: "Earlier disability / hospital / discharge cert",  accept: "image/*,.pdf" },
      ]},
      { category: "Photo Proof", categoryHint: "Photograph printed on the UDID disability card", items: [
        { key: "photo",          label: "Passport Photo (×2)",   required: true,  hint: "Recent, white background, front-facing",               accept: "image/*",      sharedKey: "photo" },
      ]},
    ],
  },
  {
    id: "pan_card",
    icon: "💳", color: "#1A3A5C", bg: "#E8F0FA",
    title: "PAN Card Application",
    subtitle: "For EPFO KYC, income tax, APY, financial transactions above ₹50,000",
    mode: "both",
    onlineLabel: "Apply Online at NSDL / UTIITSL",
    onlineUrl: "https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html",
    officeLabel: "NSDL / UTIITSL PAN Centre or Common Service Centre (CSC)",
    officeAddress: "Asansol CSC: Various locations — ask at Block office for nearest CSC",
    officeHours: "10:00 AM – 5:00 PM (Mon–Fri)",
    officeFee: "₹93 (online, Indian address) · ₹107 (offline at CSC)",
    bookingUrl: null,
    formFields: [
      { key: "name",        label: "Full Name (as in Aadhaar)",   ph: "", required: true },
      { key: "aadhaar",     label: "Aadhaar Number",              ph: "12-digit", required: true },
      { key: "phone",       label: "Mobile Number",               ph: "10-digit", required: true },
      { key: "dob",         label: "Date of Birth",               ph: "DD/MM/YYYY", required: true },
      { key: "fatherName",  label: "Father's Name",               ph: "", required: true },
      { key: "address",     label: "Residential Address",         ph: "Full address", required: true },
      { key: "email",       label: "Email Address",               ph: "Optional but useful", required: false },
    ],
    docsNeeded: ["Aadhaar card — for identity + address proof (both in one)", "Passport photo — 2 copies", "₹93–₹107 fee (online/offline)", "Email ID (optional — for e-PAN delivery)"],
    printDocType: null,
    steps: ["ONLINE (fastest — e-PAN in 48hrs): Go to onlineservices.nsdl.com → 'Instant e-PAN via Aadhaar'", "Enter Aadhaar number → OTP sent to Aadhaar-linked mobile", "Verify OTP → PAN allotted immediately → Download e-PAN PDF", "OFFLINE: Visit nearest CSC or UTIITSL/NSDL centre → fill Form 49A → submit with Aadhaar + photo + fee", "Physical PAN card delivered to address in 15–20 days"],
    uploadDocs: [
      { category: "Identity & Address Proof", categoryHint: "Aadhaar acts as both identity and address proof for PAN application", items: [
        { key: "aadhaar_front",  label: "Aadhaar Card",          required: true,  hint: "Identity + address in one document",                   accept: "image/*,.pdf", sharedKey: "aadhaar_front" },
      ]},
      { category: "Photo Proof", categoryHint: "Photograph printed on the PAN card", items: [
        { key: "photo",          label: "Passport Photo",         required: true,  hint: "Recent, white background",                            accept: "image/*",      sharedKey: "photo" },
      ]},
    ],
  },
  {
    id: "passport",
    icon: "🛂", color: "#0A5C3A", bg: "#E0F5EC",
    title: "Passport Application",
    subtitle: "For international travel, strongest identity proof, required for some bank accounts",
    mode: "online",
    onlineLabel: "Apply at Passport Seva Portal",
    onlineUrl: "https://www.passportindia.gov.in",
    officeLabel: "Passport Seva Kendra (PSK), Asansol",
    officeAddress: "Passport Seva Kendra, Asansol — appointment mandatory via portal",
    officeHours: "Appointment slots: 7:00 AM – 7:00 PM (Mon–Sat)",
    officeFee: "₹1,500 (normal, 36 pages) · ₹2,000 (Tatkal, 36 pages)",
    bookingUrl: "https://www.passportindia.gov.in",
    formFields: [
      { key: "name",        label: "Full Name (as in Aadhaar)",    ph: "", required: true },
      { key: "aadhaar",     label: "Aadhaar Number",               ph: "12-digit", required: true },
      { key: "phone",       label: "Mobile Number",                ph: "10-digit", required: true },
      { key: "dob",         label: "Date of Birth",                ph: "DD/MM/YYYY", required: true },
      { key: "fatherName",  label: "Father's Name",                ph: "", required: true },
      { key: "address",     label: "Residential Address",          ph: "Full address with PIN", required: true },
      { key: "birthPlace",  label: "Place of Birth",               ph: "City/Town, State", required: true },
      { key: "email",       label: "Email Address",                ph: "For appointment confirmation", required: true },
    ],
    docsNeeded: ["Aadhaar card — original + photocopy (address + identity)", "Birth certificate OR school leaving certificate (DOB proof)", "Ration card or utility bill — optional additional address proof", "2 passport photos (5×5 cm, white background, 80% face coverage)", "Online appointment confirmation printout", "₹1,500–₹2,000 fee (pay online during application)"],
    printDocType: null,
    steps: ["Register at passportindia.gov.in → fill application form online", "Pay fee online (₹1,500 normal / ₹2,000 Tatkal)", "Book appointment at Asansol PSK", "Visit PSK on appointment date with all original documents", "Biometric + photo taken at PSK", "Passport delivered to address in 7–30 days"],
    uploadDocs: [
      { category: "Identity Proof", categoryHint: "Aadhaar is the primary identity document accepted at PSK", items: [
        { key: "aadhaar_front",  label: "Aadhaar Card",          required: true,  hint: "Clear scan — name, DOB, address all visible",          accept: "image/*,.pdf", sharedKey: "aadhaar_front" },
      ]},
      { category: "Date of Birth Proof", categoryHint: "Government requires documentary proof of birth date", items: [
        { key: "dob_proof",      label: "Birth Certificate or School Leaving Cert", required: true, hint: "Any official record showing date of birth",  accept: "image/*,.pdf" },
      ]},
      { category: "Residential Proof", categoryHint: "Additional address proof if Aadhaar address needs supporting doc", items: [
        { key: "address_proof",  label: "Ration Card or Utility Bill",  required: false, hint: "Ration card or electricity / water bill",       accept: "image/*,.pdf", sharedKey: "ration_card" },
      ]},
      { category: "Photo Proof", categoryHint: "Passport photo — special 5×5 cm format, 80% face coverage", items: [
        { key: "photo",          label: "Passport Photo (5×5 cm)",  required: true,  hint: "White background, 80% face coverage, recent",        accept: "image/*",      sharedKey: "photo" },
      ]},
    ],
  },
  {
    id: "driving_license",
    icon: "🚗", color: "#7A3A00", bg: "#FFF0E0",
    title: "Driving Licence",
    subtitle: "For vehicle operation, widely accepted identity proof for all purposes",
    mode: "online",
    onlineLabel: "Apply at Parivahan Sewa Portal",
    onlineUrl: "https://parivahan.gov.in/parivahan/",
    officeLabel: "Regional Transport Office (RTO), Asansol",
    officeAddress: "RTO Asansol, Near Police Station, GT Road, Asansol — 713301",
    officeHours: "10:00 AM – 5:00 PM (Mon–Fri, 2nd Sat closed)",
    officeFee: "LL: ₹200 · DL: ₹200 · Smart card: ₹200",
    bookingUrl: "https://parivahan.gov.in/parivahan/",
    formFields: [
      { key: "name",        label: "Full Name (as in Aadhaar)",    ph: "", required: true },
      { key: "aadhaar",     label: "Aadhaar Number",               ph: "12-digit", required: true },
      { key: "phone",       label: "Mobile Number",                ph: "10-digit", required: true },
      { key: "dob",         label: "Date of Birth",                ph: "DD/MM/YYYY", required: true },
      { key: "fatherName",  label: "Father's Name",                ph: "", required: true },
      { key: "address",     label: "Residential Address",          ph: "Full address with PIN", required: true },
      { key: "licenceType", label: "Licence Type",                 ph: "LMV (car) / MCWG (motorcycle) / Both", required: true },
    ],
    docsNeeded: ["Aadhaar card — original + photocopy", "Age proof: Birth certificate or school leaving cert or Aadhaar", "Address proof: Aadhaar / ration card / utility bill", "Medical certificate (Form 1-A) — from registered doctor", "2 passport photos", "₹200 Learner Licence fee + ₹200 DL fee (pay online)"],
    printDocType: null,
    steps: ["Step 1 — Learner Licence: Apply online at parivahan.gov.in → 'Apply for LL'", "Book slot at Asansol RTO → attend LL test (basic road rules, 30 min)", "Step 2 — Driving Test (after 1 month of LL): Apply for DL online → book driving test slot", "Visit RTO with vehicle → driving test on RTO grounds", "Pass test → DL issued as smart card (delivered in 7–14 days)"],
    uploadDocs: [
      { category: "Identity & Address Proof", categoryHint: "Aadhaar serves as identity and address proof at the RTO", items: [
        { key: "aadhaar_front",  label: "Aadhaar Card",          required: true,  hint: "Identity + address — original + photocopy for RTO",  accept: "image/*,.pdf", sharedKey: "aadhaar_front" },
      ]},
      { category: "Age / Date of Birth Proof", categoryHint: "RTO requires proof that applicant is 18+ for LMV licence", items: [
        { key: "age_proof",      label: "Age / DOB Proof",       required: true,  hint: "Birth cert, school leaving cert, or Aadhaar (DOB visible)", accept: "image/*,.pdf", sharedKey: "aadhaar_front" },
      ]},
      { category: "Medical Fitness Proof", categoryHint: "Form 1-A — mandatory fitness certificate from any registered doctor", items: [
        { key: "medical_cert",   label: "Medical Certificate (Form 1-A)", required: true,  hint: "From any MBBS doctor — states applicant is fit to drive", accept: "image/*,.pdf" },
      ]},
      { category: "Photo Proof", categoryHint: "Printed on the driving licence card", items: [
        { key: "photo",          label: "Passport Photo",         required: true,  hint: "Recent, white background",                            accept: "image/*",      sharedKey: "photo" },
      ]},
    ],
  },
];

function DocMakeScreen({ worker, onSelectDoc, onBack }) {
  const [search, setSearch] = useState("");
  const filtered = DOC_CATALOGUE.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <BackButton onClick={onBack} label="Back" />
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>📋</div>
        <h2 style={{ fontSize: 20, color: COLORS.navy, margin: "0 0 6px" }}>Which document do you need?</h2>
        <p style={{ color: "#7A8A9A", fontSize: 13, margin: 0 }}>
          {worker?.phone && <><strong>{worker.phone}</strong> · </>}
          Select a document — we'll fill the form and guide you through submission
        </p>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Search documents..."
        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #D0D8E4", borderRadius: 10, fontSize: 13, fontFamily: "inherit", marginBottom: 20, boxSizing: "border-box" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(doc => (
          <button key={doc.id} onClick={() => onSelectDoc(doc)}
            style={{ background: doc.bg, border: `1.5px solid ${doc.color}20`, borderLeft: `4px solid ${doc.color}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", display: "flex", alignItems: "center", gap: 14, transition: "box-shadow 0.15s" }}
            onMouseOver={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"}
            onMouseOut={e => e.currentTarget.style.boxShadow = "none"}>
            <span style={{ fontSize: 32, flexShrink: 0 }}>{doc.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: doc.color, fontSize: 14, marginBottom: 3 }}>{doc.title}</div>
              <div style={{ fontSize: 12, color: "#5A6A7A", lineHeight: 1.5 }}>{doc.subtitle}</div>
              <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                {doc.mode === "online" && <span style={{ background: "#E8F5EE", color: "#1A7A4A", borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>🌐 ONLINE</span>}
                {doc.mode === "offline" && <span style={{ background: "#EAF0FA", color: "#0D2240", borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>🏛️ OFFICE VISIT</span>}
                {doc.mode === "both" && <><span style={{ background: "#E8F5EE", color: "#1A7A4A", borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>🌐 ONLINE</span><span style={{ background: "#EAF0FA", color: "#0D2240", borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>🏛️ OR OFFICE</span></>}
              </div>
            </div>
            <span style={{ fontSize: 20, color: COLORS.saffron }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── DOC DETAIL + FORM FILL SCREEN ───────────────────────────────────────────
function DocDetailScreen({ docCfg, worker, onBack, docVault = {}, addToVault = () => {} }) {
  const today = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" });
  // Pre-fill from worker data
  const [formData, setFormData] = useState(() => {
    const pre = {};
    docCfg.formFields.forEach(f => {
      if (f.key === "name")       pre[f.key] = worker?.name || "";
      if (f.key === "phone")      pre[f.key] = worker?.phone || "";
      if (f.key === "aadhaar")    pre[f.key] = worker?.aadhaarNumber || "";
      if (f.key === "headName")   pre[f.key] = worker?.name || "";
      if (f.key === "annualIncome") pre[f.key] = worker?.annualIncome || "";
      if (f.key === "caste")      pre[f.key] = worker?.caste || "";
      if (f.key === "address")    pre[f.key] = "Factory Quarters, MB Sponge & Power Limited, Jamuria, Paschim Bardhaman, WB — 713337";
    });
    return pre;
  });
  const [tab, setTab] = useState("form"); // form | submit
  const [submitMode, setSubmitMode] = useState(docCfg.mode === "online" ? "online" : docCfg.mode === "both" ? "online" : "offline");
  const [printLang, setPrintLang] = useState("bn");
  const [aadhaarScanned, setAadhaarScanned] = useState(false);
  const [photoProcessorSlot, setPhotoProcessorSlot] = useState(null); // key of slot being photo-processed
  const [scanCameraSlot, setScanCameraSlot] = useState(null);           // key of slot being doc-scanned
  // uploadedFiles is local to this document application session
  // Pre-seeded from docVault (global) for any shared keys
  const getAllItems = (cfg) => cfg.uploadDocs?.flatMap(g => g.items || []) || [];
  const [uploadedFiles, setUploadedFiles] = useState(() => {
    const pre = {};
    const items = docCfg.uploadDocs?.flatMap(g => g.items || []) || [];
    items.forEach(item => {
      if (item.sharedKey && docVault[item.sharedKey]) {
        pre[item.key] = docVault[item.sharedKey];
      }
    });
    return pre;
  });
  const setAndVault = (key, fileData, sharedKey) => {
    setUploadedFiles(p => ({ ...p, [key]: fileData }));
    if (sharedKey) addToVault(sharedKey, fileData);
  };
  const removeFile = (key) => setUploadedFiles(p => { const n = {...p}; delete n[key]; return n; });
  const isPhotoSlot = (ud) => ud.key === "photo" || ud.key?.startsWith("photo") || (ud.label && ud.label.toLowerCase().includes("photo"));

  // Multilingual strings for the printed packet
  const PKT = {
    bn: {
      title: "জনমিত্র — নথি আবেদন প্যাকেট",
      org: "MB Sponge & Power Limited, জামুরিয়া",
      prefilledDetails: "📋 পূর্ব-পূরণ আবেদন বিবরণ",
      whereToSubmit: "🏛️ কোথায় জমা দিতে হবে",
      docsToBring: "✅ যে নথিগুলো সাথে নিয়ে যাবেন (যাওয়ার আগে চেক করুন)",
      stepsAtOffice: "📖 অফিসে গিয়ে যা করবেন",
      agentSign: "এজেন্ট / জনমিত্র প্রতিনিধি",
      workerSign: "কর্মী স্বাক্ষর",
      printBtn: "🖨️ প্রিন্ট / PDF সংরক্ষণ করুন",
      close: "✕ বন্ধ করুন",
      date: "তারিখ",
      refGuide: "📌 অতিরিক্ত রেফারেন্স গাইড",
    },
    hi: {
      title: "जनमित्र — दस्तावेज़ आवेदन पैकेट",
      org: "MB Sponge & Power Limited, जमुरिया",
      prefilledDetails: "📋 पूर्व-भरे आवेदन विवरण",
      whereToSubmit: "🏛️ कहाँ जमा करना है",
      docsToBring: "✅ साथ ले जाने वाले दस्तावेज़ (जाने से पहले जाँचें)",
      stepsAtOffice: "📖 कार्यालय में क्या करें",
      agentSign: "एजेंट / जनमित्र प्रतिनिधि",
      workerSign: "कर्मचारी हस्ताक्षर",
      printBtn: "🖨️ प्रिंट / PDF सहेजें",
      close: "✕ बंद करें",
      date: "दिनांक",
      refGuide: "📌 अतिरिक्त संदर्भ गाइड",
    },
    en: {
      title: "Jan Setu — Document Application Packet",
      org: "MB Sponge & Power Limited, Jamuria",
      prefilledDetails: "📋 Pre-Filled Application Details",
      whereToSubmit: "🏛️ Where to Submit",
      docsToBring: "✅ Documents to Carry (Check Before Leaving)",
      stepsAtOffice: "📖 Steps at the Office",
      agentSign: "Agent / Jan Setu Pratinidhi",
      workerSign: "Worker / Applicant Signature",
      printBtn: "🖨️ Print / Save PDF",
      close: "✕ Close",
      date: "Date",
      refGuide: "📌 Additional Reference Guide",
    },
  };

  // Multilingual field labels
  const FIELD_LABELS = {
    name:         { bn: "পুরো নাম (আধারের মতো)", hi: "पूरा नाम (आधार अनुसार)", en: "Full Name (as in Aadhaar)" },
    aadhaar:      { bn: "আধার নম্বর", hi: "आधार नंबर", en: "Aadhaar Number" },
    phone:        { bn: "মোবাইল নম্বর", hi: "मोबाइल नंबर", en: "Mobile Number" },
    dob:          { bn: "জন্ম তারিখ", hi: "जन्म तिथि", en: "Date of Birth" },
    fatherName:   { bn: "পিতার / স্বামীর নাম", hi: "पिता / पति का नाम", en: "Father's / Husband's Name" },
    caste:        { bn: "জাতি বিভাগ", hi: "जाति वर्ग", en: "Caste Category" },
    address:      { bn: "বাসস্থানের ঠিকানা", hi: "आवासीय पता", en: "Residential Address" },
    annualIncome: { bn: "বার্ষিক পারিবারিক আয়", hi: "वार्षिक पारिवारिक आय", en: "Annual Household Income" },
    occupation:   { bn: "পেশা", hi: "व्यवसाय", en: "Occupation" },
    purpose:      { bn: "উদ্দেশ্য", hi: "उद्देश्य", en: "Purpose" },
    nominee:      { bn: "নমিনির নাম", hi: "नामांकित का नाम", en: "Nominee Name" },
    nomineeRel:   { bn: "নমিনির সম্পর্ক", hi: "नामांकित का संबंध", en: "Nominee Relation" },
    newAddress:   { bn: "নতুন ঠিকানা", hi: "नया पता", en: "New Address" },
    updateType:   { bn: "আপডেটের ধরন", hi: "अपडेट का प्रकार", en: "Update Type" },
    headName:     { bn: "পরিবারের প্রধানের নাম", hi: "परिवार के मुखिया का नाम", en: "Head of Household Name" },
    member2:      { bn: "সদস্য ২-এর নাম", hi: "सदस्य 2 का नाम", en: "Member 2 Name" },
    member3:      { bn: "সদস্য ৩-এর নাম", hi: "सदस्य 3 का नाम", en: "Member 3 Name" },
    member4:      { bn: "সদস্য ৪-এর নাম", hi: "सदस्य 4 का नाम", en: "Member 4 Name" },
    member5:      { bn: "সদস্য ৫-এর নাম", hi: "सदस्य 5 का नाम", en: "Member 5 Name" },
    disabilityType: { bn: "অক্ষমতার ধরন", hi: "विकलांगता का प्रकार", en: "Type of Disability" },
    disabilityPct:  { bn: "আনুমানিক অক্ষমতা %", hi: "अनुमानित विकलांगता %", en: "Approximate Disability %" },
  };

  const requiredFilled = docCfg.formFields.filter(f => f.required).every(f => (formData[f.key] || "").trim());

  const inputStyle = { width: "100%", padding: "10px 13px", border: "1.5px solid #D0D8E4", borderRadius: 8, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" };
  const filledStyle = { ...inputStyle, background: "#F0FFF4", borderColor: "#34A85A" };

  const printPacket = () => {
    const L = PKT[printLang];
    const docGuide = docCfg.printDocType ? generateDocument(docCfg.printDocType, { ...worker, ...formData, name: formData.name || worker?.name }, null, {}, {}) : null;
    const notFilled = printLang === "bn" ? "পূরণ করা হয়নি" : printLang === "hi" ? "भरा नहीं गया" : "Not filled";

    // Translate document-specific content
    const DOC_I18N = {
      aadhaar_address: {
        bn: {
          title: "আধার — ঠিকানা আপডেট",
          officeLabel: "আধার সেবা কেন্দ্র, আসানসোল",
          docsNeeded: ["আধার কার্ড — মূল কপি (বায়োমেট্রিকের জন্য অবশ্যই আনতে হবে)", "নিয়োগকর্তার ঠিকানা শংসাপত্র (MB Sponge লেটারহেডে)", "নতুন ঠিকানা সহ যেকোনো সরকারি পরিচয়পত্র", "ফি বাবদ ৫০–১০০ টাকা নগদ", "অনলাইনে বুক করলে অ্যাপয়েন্টমেন্ট প্রিন্টআউট"],
          steps: ["bookappointment.uidai.gov.in এ অ্যাপয়েন্টমেন্ট বুক করুন (ঐচ্ছিক কিন্তু সময় বাঁচায়)", "নথি নিয়ে আসানসোল সেবা কেন্দ্রে যান", "অপারেটরকে বলুন: 'ঠিকানা আপডেট করতে এসেছি — নিয়োগকর্তার সার্টিফিকেট আছে'", "কাউন্টারে বায়োমেট্রিক স্ক্যান হবে", "URN (আপডেট রিকোয়েস্ট নম্বর) পাবেন — সংরক্ষণ করুন", "৫–৭ দিনে uidai.gov.in থেকে e-Aadhaar ডাউনলোড করুন"],
        },
        hi: {
          title: "आधार — पता अपडेट",
          officeLabel: "आधार सेवा केंद्र, आसनसोल",
          docsNeeded: ["आधार कार्ड — मूल प्रति (बायोमेट्रिक के लिए अनिवार्य)", "नियोक्ता का पता प्रमाण पत्र (MB Sponge लेटरहेड पर)", "नए पते के साथ कोई सरकारी पहचान पत्र", "शुल्क के लिए ₹50–₹100 नकद", "ऑनलाइन बुकिंग का प्रिंटआउट (यदि बुक किया हो)"],
          steps: ["bookappointment.uidai.gov.in पर अपॉइंटमेंट बुक करें (वैकल्पिक पर समय बचाता है)", "दस्तावेज़ लेकर आसनसोल सेवा केंद्र जाएं", "ऑपरेटर को बोलें: 'पता अपडेट करना है — नियोक्ता का प्रमाण पत्र है'", "काउंटर पर बायोमेट्रिक स्कैन होगा", "URN (अपडेट रिक्वेस्ट नंबर) मिलेगा — संभालकर रखें", "5–7 दिनों में uidai.gov.in से e-Aadhaar डाउनलोड करें"],
        },
      },
      aadhaar_mobile: {
        bn: {
          title: "আধার — মোবাইল লিঙ্কিং",
          officeLabel: "আধার সেবা কেন্দ্র, আসানসোল",
          docsNeeded: ["আধার কার্ড — মূল কপি", "যে মোবাইল নম্বর লিঙ্ক করতে হবে (সেই ফোন সাথে নিয়ে যান)", "বায়োমেট্রিক আপডেট ফি ১০০ টাকা নগদ"],
          steps: ["অনলাইনে অ্যাপয়েন্টমেন্ট বুক করুন অথবা সরাসরি আসানসোল ASK এ যান", "আধার মূল কপি এবং লিঙ্ক করার মোবাইল ফোন সাথে নিন", "অপারেটরকে বলুন: 'মোবাইল নম্বর লিঙ্ক করতে এসেছি'", "বায়োমেট্রিক যাচাই হবে", "একই দিনে মোবাইল লিঙ্ক হয়ে যাবে — OTP কাজ করবে"],
        },
        hi: {
          title: "आधार — मोबाइल लिंकिंग",
          officeLabel: "आधार सेवा केंद्र, आसनसोल",
          docsNeeded: ["आधार कार्ड — मूल प्रति", "जो मोबाइल नंबर लिंक करना है वह फोन साथ लाएं", "बायोमेट्रिक अपडेट शुल्क ₹100 नकद"],
          steps: ["ऑनलाइन अपॉइंटमेंट बुक करें या सीधे आसनसोल ASK जाएं", "आधार मूल और लिंक करने वाला मोबाइल फोन साथ लें", "ऑपरेटर को बोलें: 'मोबाइल नंबर लिंक करना है'", "बायोमेट्रिक सत्यापन होगा", "उसी दिन मोबाइल लिंक हो जाएगा — OTP काम करने लगेगा"],
        },
      },
      caste_cert: {
        bn: {
          title: "জাতি শংসাপত্র (SC/ST/OBC)",
          officeLabel: "ব্লক ডেভেলপমেন্ট অফিস (BDO), জামুরিয়া",
          docsNeeded: ["আধার কার্ড — মূল + ১টি ফটোকপি (নিজে সত্যায়িত)", "ভোটার আইডি বা যেকোনো ফটো আইডি", "রেশন কার্ড — ফটোকপি", "পিতার জাতি শংসাপত্র (থাকলে — প্রক্রিয়া দ্রুত হয়)", "MB Sponge নিয়োগকর্তার ঠিকানা পত্র", "২টি পাসপোর্ট সাইজ ছবি", "এই প্রিন্টআউট"],
          steps: ["BDO অফিস, জামুরিয়া ব্লক — 'জাতি প্রমাণপত্র' কাউন্টারে যান", "আবেদন ফর্ম নিয়ে পূরণ করুন (এই প্রিন্টআউট ড্রাফট হিসেবে ব্যবহার করুন)", "সমস্ত নথি সহ জমা দিন", "BDO স্থানীয় প্রধান / গ্রাম পঞ্চায়েতের মাধ্যমে যাচাই করবেন", "২–৪ সপ্তাহে শংসাপত্র জারি হবে", "একসাথে ৩–৪টি সত্যায়িত কপি বানিয়ে নিন"],
        },
        hi: {
          title: "जाति प्रमाण पत्र (SC/ST/OBC)",
          officeLabel: "खंड विकास कार्यालय (BDO), जमुरिया",
          docsNeeded: ["आधार कार्ड — मूल + 1 फोटोकॉपी (स्वप्रमाणित)", "वोटर आईडी या कोई भी फोटो आईडी", "राशन कार्ड — फोटोकॉपी", "पिता का जाति प्रमाण पत्र (यदि है — प्रक्रिया तेज होगी)", "MB Sponge नियोक्ता पत्र", "2 पासपोर्ट साइज फोटो", "यह प्रिंटआउट"],
          steps: ["BDO कार्यालय, जमुरिया ब्लॉक — 'जाति प्रमाण पत्र' काउंटर पर जाएं", "आवेदन फॉर्म लेकर भरें (यह प्रिंटआउट ड्राफ्ट के रूप में उपयोग करें)", "सभी दस्तावेज़ों के साथ जमा करें", "BDO स्थानीय प्रधान / ग्राम पंचायत से सत्यापन करेंगे", "2–4 सप्ताह में प्रमाण पत्र जारी होगा", "एक साथ 3–4 सत्यापित प्रतियां बनवा लें"],
        },
      },
      income_cert: {
        bn: {
          title: "আয়ের শংসাপত্র",
          officeLabel: "BDO অফিস, জামুরিয়া অথবা edistrict.wb.gov.in",
          docsNeeded: ["আধার কার্ড — মূল + ফটোকপি", "রেশন কার্ড — ফটোকপি", "MB Sponge বেতন শংসাপত্র (HR থেকে নিন)", "২টি পাসপোর্ট ছবি", "৩০ টাকা ফি"],
          steps: ["অনলাইন: edistrict.wb.gov.in এ নিবন্ধন করুন → লগইন → রাজস্ব বিভাগ → আয় শংসাপত্র", "নিচের বিবরণ দিয়ে ফর্ম পূরণ করুন → আধার + রেশন কার্ড আপলোড করুন", "৩০ টাকা অনলাইনে পেমেন্ট করুন → আবেদন নম্বর নোট করুন", "৩–৫ কর্মদিবসে ডিজিটাল সাইন করা শংসাপত্র ডাউনলোড করুন", "অফলাইন: BDO অফিস, জামুরিয়া → 'আয় প্রমাণপত্র' কাউন্টার → ফর্ম + নথি + ৩০ টাকা জমা দিন"],
        },
        hi: {
          title: "आय प्रमाण पत्र",
          officeLabel: "BDO कार्यालय, जमुरिया या edistrict.wb.gov.in",
          docsNeeded: ["आधार कार्ड — मूल + फोटोकॉपी", "राशन कार्ड — फोटोकॉपी", "MB Sponge वेतन प्रमाण पत्र (HR से लें)", "2 पासपोर्ट फोटो", "₹30 शुल्क"],
          steps: ["ऑनलाइन: edistrict.wb.gov.in पर रजिस्टर करें → लॉगिन → राजस्व विभाग → आय प्रमाण पत्र", "नीचे दिए विवरण से फॉर्म भरें → आधार + राशन कार्ड अपलोड करें", "₹30 ऑनलाइन भुगतान करें → आवेदन नंबर नोट करें", "3–5 कार्य दिवसों में डिजिटल हस्ताक्षरित प्रमाण पत्र डाउनलोड करें", "ऑफलाइन: BDO कार्यालय, जमुरिया → 'आय प्रमाण पत्र' काउंटर → फॉर्म + दस्तावेज़ + ₹30 जमा करें"],
        },
      },
      bank_account: {
        bn: {
          title: "ব্যাংক অ্যাকাউন্ট — জন ধন",
          officeLabel: "যেকোনো জাতীয়কৃত ব্যাংক শাখা (SBI / UCO / Allahabad Bank)",
          docsNeeded: ["আধার কার্ড — মূল + ১টি ফটোকপি (নিজে সত্যায়িত)", "২টি পাসপোর্ট সাইজ ছবি", "পূরণ করা অ্যাকাউন্ট খোলার ফর্ম (এই প্রিন্টআউট)", "মোবাইল ফোন (SMS ব্যাংকিং সক্রিয়করণের জন্য)"],
          steps: ["যেকোনো SBI / UCO / Allahabad / Axis Bank শাখায় যান", "কাউন্টারে বলুন: 'জন ধন অ্যাকাউন্ট খুলতে এসেছি, আধার আছে'", "PMJDY অ্যাকাউন্ট খোলার ফর্ম নিন — এই প্রিন্টআউট পূরণে সাহায্য করবে", "ফর্ম + আধার + ছবি জমা দিন", "একই দিনে অ্যাকাউন্ট খুলে যাবে — পাসবুক ১–২ সপ্তাহে", "DBT-র জন্য একই কাউন্টারে আধার সিডিং করুন"],
        },
        hi: {
          title: "बैंक खाता — जन धन",
          officeLabel: "कोई भी राष्ट्रीयकृत बैंक शाखा (SBI / UCO / Allahabad Bank)",
          docsNeeded: ["आधार कार्ड — मूल + 1 फोटोकॉपी (स्वप्रमाणित)", "2 पासपोर्ट साइज फोटो", "भरा हुआ खाता खोलने का फॉर्म (यह प्रिंटआउट)", "मोबाइल फोन (SMS बैंकिंग सक्रियण के लिए)"],
          steps: ["किसी भी SBI / UCO / Allahabad / Axis Bank शाखा में जाएं", "काउंटर पर बोलें: 'जन धन खाता खोलना है, आधार है'", "PMJDY खाता खोलने का फॉर्म लें — यह प्रिंटआउट भरने में मदद करेगा", "फॉर्म + आधार + फोटो जमा करें", "उसी दिन खाता खुल जाएगा — पासबुक 1–2 सप्ताह में", "DBT के लिए उसी काउंटर पर आधार सीडिंग करें"],
        },
      },
      ration_card: {
        bn: {
          title: "রেশন কার্ড",
          officeLabel: "ব্লক ফুড সাপ্লাই অফিস (FSO), জামুরিয়া অথবা wbpds.wb.gov.in",
          docsNeeded: ["পরিবারের সকল সদস্যের আধার — মূল + ফটোকপি", "MB Sponge নিয়োগকর্তার ঠিকানা পত্র", "অন্য রাজ্যে রেশন কার্ড নেই — স্ব-ঘোষণা", "পরিবারের প্রধানের ২টি পাসপোর্ট ছবি", "ব্যাংক পাসবুক ফটোকপি"],
          steps: ["অনলাইন: wbpds.wb.gov.in → 'নতুন রেশন কার্ডের আবেদন' → আধার দিয়ে লগইন", "পরিবারের সকল সদস্যের আধার নম্বর দিয়ে যোগ করুন", "নথি আপলোড করুন → জমা দিন", "FSO যাচাইয়ের জন্য বাড়ি আসবেন — উপস্থিত থাকুন", "৩০–৬০ দিনে কার্ড জারি হবে", "অফলাইন: ব্লক FSO অফিস, সালানপুর — ফিজিক্যাল ফর্ম + নথি জমা দিন"],
        },
        hi: {
          title: "राशन कार्ड",
          officeLabel: "खंड खाद्य आपूर्ति कार्यालय (FSO), जमुरिया या wbpds.wb.gov.in",
          docsNeeded: ["परिवार के सभी सदस्यों का आधार — मूल + फोटोकॉपी", "MB Sponge नियोक्ता पत्र", "किसी अन्य राज्य में राशन कार्ड नहीं है — स्व-घोषणा", "परिवार के मुखिया के 2 पासपोर्ट फोटो", "बैंक पासबुक फोटोकॉपी"],
          steps: ["ऑनलाइन: wbpds.wb.gov.in → 'नए राशन कार्ड के लिए आवेदन' → आधार से लॉगिन", "परिवार के सभी सदस्यों को आधार नंबर के साथ जोड़ें", "दस्तावेज़ अपलोड करें → जमा करें", "FSO सत्यापन के लिए घर आएंगे — मौजूद रहें", "30–60 दिनों में कार्ड जारी होगा", "ऑफलाइन: खंड FSO कार्यालय, सालनपुर — फिजिकल फॉर्म + दस्तावेज़ जमा करें"],
        },
      },
      disability_cert: {
        bn: {
          title: "অক্ষমতা শংসাপত্র (UDID)",
          officeLabel: "জেলা হাসপাতাল / CMO অফিস, আসানসোল",
          docsNeeded: ["আধার কার্ড — মূল + ফটোকপি", "২টি পাসপোর্ট ছবি", "আগের কোনো মেডিকেল সার্টিফিকেট থাকলে", "এই প্রিন্টআউট (ডাক্তারের রেফারেন্সের জন্য)"],
          steps: ["অনলাইন: swavlambancard.gov.in এ নিবন্ধন করুন → UDID কার্ডের আবেদন করুন", "জেলা হাসপাতালের মেডিকেল অ্যাসেসমেন্ট বোর্ড অক্ষমতা মূল্যায়ন করবে", "অফলাইন: আসানসোল জেলা হাসপাতাল CMO অফিস — 'বিকলাঙ্গতা প্রমাণপত্র' কাউন্টার", "মেডিকেল টিম অক্ষমতার শতাংশ নির্ধারণ করবে", "৩০–৪৫ দিনে শংসাপত্র + UDID কার্ড জারি হবে"],
        },
        hi: {
          title: "विकलांगता प्रमाण पत्र (UDID)",
          officeLabel: "जिला अस्पताल / CMO कार्यालय, आसनसोल",
          docsNeeded: ["आधार कार्ड — मूल + फोटोकॉपी", "2 पासपोर्ट फोटो", "पिछला कोई मेडिकल सर्टिफिकेट हो तो लाएं", "यह प्रिंटआउट (डॉक्टर के संदर्भ के लिए)"],
          steps: ["ऑनलाइन: swavlambancard.gov.in पर रजिस्टर करें → UDID कार्ड के लिए आवेदन करें", "जिला अस्पताल का मेडिकल असेसमेंट बोर्ड विकलांगता का मूल्यांकन करेगा", "ऑफलाइन: आसनसोल जिला अस्पताल CMO कार्यालय — 'विकलांगता प्रमाण पत्र' काउंटर", "मेडिकल टीम विकलांगता का प्रतिशत तय करेगी", "30–45 दिनों में प्रमाण पत्र + UDID कार्ड जारी होगा"],
        },
      },
    };

    const i18n = (printLang !== "en" && DOC_I18N[docCfg.id]?.[printLang]) || null;

    const docTitle    = i18n?.title       || docCfg.title;
    const officeLabel = i18n?.officeLabel || docCfg.officeLabel;
    const docsNeedArr = i18n?.docsNeeded  || docCfg.docsNeeded;
    const stepsArr    = i18n?.steps       || docCfg.steps.filter(s => !s.startsWith("ONLINE"));

    const formRows = docCfg.formFields.map(f => {
      const lbl = (FIELD_LABELS[f.key]?.[printLang]) || f.label;
      const val = formData[f.key] || "";
      return `<tr>
        <td style="padding:7px 12px;background:#F4F6F8;font-weight:600;font-size:12px;color:#5A6A7A;width:42%;border-bottom:1px solid #E8EDF3">${lbl}${f.required ? ' <span style="color:red">*</span>' : ''}</td>
        <td style="padding:7px 12px;font-size:13px;font-weight:700;color:#0D2240;border-bottom:1px solid #E8EDF3">${val || '<em style="color:#AAA;font-weight:400">' + notFilled + '</em>'}</td>
      </tr>`;
    }).join("");

    const docsList = docsNeedArr.map(d =>
      `<label style="display:flex;align-items:flex-start;gap:10px;padding:7px 0;border-bottom:1px solid #F0F4F8;font-size:13px;cursor:pointer">
        <input type="checkbox" style="margin-top:2px;flex-shrink:0;width:15px;height:15px"> <span>${d}</span>
      </label>`
    ).join("");

    const stepsList = stepsArr.map((s, i) =>
      `<div style="display:flex;gap:10px;margin-bottom:10px;font-size:13px;line-height:1.5">
        <div style="background:#E8690B;color:#fff;border-radius:50%;min-width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;margin-top:1px">${i+1}</div>
        <span>${s.replace(/^OFFLINE:\s*/,"")}</span>
      </div>`
    ).join("");

    const langLabel = printLang === "bn" ? "বাংলা" : printLang === "hi" ? "हिंदी" : "English";

    const html = `<!DOCTYPE html><html lang="${printLang === "bn" ? "bn" : printLang === "hi" ? "hi" : "en"}">
    <head><meta charset="utf-8">
    <title>${docTitle} — ${L.title}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap');
      body{font-family:'Noto Sans Bengali','Noto Sans Devanagari',Arial,sans-serif;max-width:720px;margin:32px auto;padding:0 24px;color:#1A2A3A;font-size:13.5px;line-height:1.7}
      .hdr{background:#0D2240;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0}
      .hdr-main{font-size:17px;font-weight:800;margin-bottom:4px}
      .hdr-sub{font-size:11px;opacity:.75}
      .hdr-meta{display:flex;justify-content:space-between;align-items:flex-start}
      .hdr-date{font-size:11px;background:rgba(255,255,255,.15);padding:4px 10px;border-radius:6px;font-family:monospace}
      .lang-badge{display:inline-block;background:#E8690B;color:#fff;border-radius:8px;padding:3px 10px;font-size:11px;font-weight:700;margin-top:6px}
      .section{border:1.5px solid #E0E8F0;border-radius:10px;overflow:hidden;margin:18px 0;box-shadow:0 1px 4px rgba(0,0,0,.05)}
      .sec-title{background:#EAF0FA;padding:10px 16px;font-weight:700;font-size:12px;color:#0D2240;letter-spacing:.3px}
      table{width:100%;border-collapse:collapse}
      .office-box{background:#EAF0FA;border-radius:0;padding:14px 16px;font-size:13px;line-height:2}
      .tip{background:#FEF3E2;border-left:4px solid #E8690B;padding:10px 14px;font-size:12px;color:#7A5000;margin:14px 0;border-radius:0 8px 8px 0}
      .sign-row{margin-top:36px;border-top:2px dashed #E0E8F0;padding-top:22px;display:flex;justify-content:space-between}
      .sign-box{text-align:center;width:45%}
      .sign-line{border-top:1.5px solid #0D2240;padding-top:5px;font-weight:700;font-size:12px;margin-top:44px}
      .sign-org{font-size:11px;color:#7A8A9A}
      @media print{body{margin:0}.no-print{display:none}}
    </style>
    </head><body>
    <div class="no-print" style="text-align:right;margin-bottom:14px">
      <button onclick="window.print()" style="background:#E8690B;color:#fff;border:none;padding:9px 20px;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer">${L.printBtn}</button>
    </div>

    <div class="hdr">
      <div class="hdr-meta">
        <div>
          <div class="hdr-main">${docCfg.icon} ${docTitle}</div>
          <div class="hdr-sub">JAN SETU — ${L.org}</div>
          <div class="lang-badge">${langLabel}</div>
        </div>
        <div class="hdr-date">${L.date}: ${today}</div>
      </div>
    </div>

    <div class="section">
      <div class="sec-title">${L.prefilledDetails}</div>
      <table>${formRows}</table>
    </div>

    <div class="section">
      <div class="sec-title">${L.whereToSubmit}</div>
      <div class="office-box">
        <strong>${officeLabel}</strong><br>
        📍 ${docCfg.officeAddress}<br>
        🕐 ${docCfg.officeHours}<br>
        💰 ${docCfg.officeFee}
        ${docCfg.bookingUrl ? `<br><br>📅 <strong>${docCfg.bookingUrl}</strong>` : ""}
      </div>
    </div>

    <div class="section">
      <div class="sec-title">${L.docsToBring}</div>
      <div style="padding:12px 16px">${docsList}</div>
    </div>

    <div class="section">
      <div class="sec-title">${L.stepsAtOffice}</div>
      <div style="padding:14px 16px">${stepsList}</div>
    </div>

    ${docGuide ? `<div style="margin-top:22px;border-top:2px dashed #E0E8F0;padding-top:18px"><div style="font-weight:700;font-size:13px;color:#0D2240;margin-bottom:10px">${L.refGuide}</div>${docGuide.content}</div>` : ""}

    <div class="sign-row">
      <div class="sign-box"><div class="sign-line">${L.agentSign}</div><div class="sign-org">MB Sponge & Power Limited</div></div>
      <div class="sign-box"><div class="sign-line">${formData.name || formData.headName || "[worker]"}</div><div class="sign-org">${L.workerSign}</div></div>
    </div>
    </body></html>`;

    _openDoc(html);
  };

  const tabStyle = (t) => ({
    flex: 1, padding: "9px 0", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
    background: tab === t ? "#fff" : COLORS.mist,
    color: tab === t ? COLORS.saffron : COLORS.slate,
    borderBottom: tab === t ? `2px solid ${COLORS.saffron}` : "2px solid transparent",
    fontFamily: "inherit",
  });

  return (
    <div>
      <BackButton onClick={onBack} label="Back to Documents" />

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${docCfg.color} 0%, ${docCfg.color}CC 100%)`, borderRadius: 14, padding: "16px 20px", marginBottom: 20, color: "#fff" }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>{docCfg.icon}</div>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>{docCfg.title}</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>{docCfg.subtitle}</div>
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(docCfg.mode === "online" || docCfg.mode === "both") && <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>🌐 Available Online</span>}
          {(docCfg.mode === "offline" || docCfg.mode === "both") && <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>🏛️ {docCfg.officeLabel}</span>}
          <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>💰 {docCfg.officeFee}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: COLORS.mist, borderRadius: 10, marginBottom: 20, overflow: "hidden" }}>
        <button style={tabStyle("form")} onClick={() => setTab("form")}>✏️ Fill Form</button>
        {docCfg.uploadDocs?.length > 0 && (() => {
          const totalRequired = docCfg.uploadDocs.flatMap(g => g.items || []).filter(i => i.required).length;
          const uploadedCount = Object.keys(uploadedFiles).length;
          return (
            <button style={tabStyle("uploads")} onClick={() => setTab("uploads")}>
              📎 Docs
              {uploadedCount > 0
                ? <span style={{ background: COLORS.green, color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, marginLeft: 4 }}>{uploadedCount}</span>
                : totalRequired > 0
                  ? <span style={{ background: COLORS.red, color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, marginLeft: 4 }}>{totalRequired}</span>
                : null}
            </button>
          );
        })()}
        <button style={tabStyle("submit")} onClick={() => setTab("submit")}>📤 Submit</button>
      </div>

      {/* FORM TAB */}
      {tab === "form" && (
        <div>
          {/* Quick Aadhaar scan strip */}
          <QuickAadhaarScan onFilled={(data) => {
            setFormData(prev => ({
              ...prev,
              name:       data.name       || prev.name       || "",
              aadhaar:    data.aadhaarNumber || prev.aadhaar || "",
              headName:   data.name       || prev.headName   || "",
              dob:        data.dob        || prev.dob        || "",
              fatherName: data.fatherName || prev.fatherName || "",
              address:    data.address    || prev.address    || "",
              caste:      data.caste      || prev.caste      || "",
            }));
            setAadhaarScanned(true);
          }} />

          <div style={{ fontSize: 12, color: "#7A8A9A", marginBottom: 16, marginTop: 4 }}>
            {aadhaarScanned ? "✅ Aadhaar scanned — green fields auto-filled · Complete remaining fields" : "Fill in details by asking the worker — or scan Aadhaar above to auto-fill"}
          </div>
          {docCfg.formFields.map(f => {
            const isFilled = !!(formData[f.key] || "").trim();
            const wasPreFilled = isFilled && (
              aadhaarScanned ||
              (["name","phone","aadhaar","headName","annualIncome","caste","address"].includes(f.key) && !!(worker && (worker[f.key] || worker.name)))
            );
            return (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: COLORS.slate, marginBottom: 5 }}>
                  <span>{f.label} {f.required && <span style={{ color: COLORS.red }}>*</span>}</span>
                  {isFilled && wasPreFilled && <span style={{ color: COLORS.green, fontWeight: 600 }}>● AI filled</span>}
                </label>
                <input
                  value={formData[f.key] || ""}
                  onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.ph}
                  style={isFilled && wasPreFilled ? filledStyle : inputStyle}
                />
              </div>
            );
          })}
          <Button onClick={() => setTab("submit")} variant="primary" size="lg" disabled={!requiredFilled} style={{ marginTop: 8 }}>
            Continue to Submission →
          </Button>
          {!requiredFilled && <div style={{ fontSize: 11, color: "#7A8A9A", marginTop: 6, textAlign: "center" }}>Fill all required (*) fields to continue</div>}
        </div>
      )}

      {/* UPLOADS TAB */}
      {tab === "uploads" && docCfg.uploadDocs?.length > 0 && (() => {
        const allItems = docCfg.uploadDocs.flatMap(g => g.items || []);
        const requiredMissing = allItems.filter(ud => ud.required && !uploadedFiles[ud.key]).length;
        const workerForDoc = { ...worker, ...formData, name: formData.name || worker?.name };
        return (
          <div>
            <div style={{ fontSize: 13, color: COLORS.slate, marginBottom: 16, lineHeight: 1.6 }}>
              Documents are grouped by their <strong>purpose</strong> — this mirrors how the government portal categorises them. Required marked <span style={{ color: COLORS.red, fontWeight: 700 }}>*</span>
              {Object.keys(docVault).length > 0 && (
                <span style={{ marginLeft: 8, background: "#E8F5EE", color: COLORS.green, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                  ✅ {Object.keys(docVault).length} doc(s) auto-filled from previous uploads
                </span>
              )}
            </div>

            {docCfg.uploadDocs.map((group, gi) => (
              <div key={gi} style={{ marginBottom: 20 }}>
                {/* Category header */}
                <div style={{ background: "linear-gradient(90deg, #0D2240 0%, #1A3A5C 100%)", color: "#fff", borderRadius: "10px 10px 0 0", padding: "10px 14px" }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{group.category}</div>
                  {group.categoryHint && <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{group.categoryHint}</div>}
                </div>
                <div style={{ border: "1.5px solid #D0D8E4", borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                  {(group.items || []).map((ud, ii) => {
                    const uploaded = uploadedFiles[ud.key];
                    const fromVault = ud.sharedKey && docVault[ud.sharedKey] && uploaded === docVault[ud.sharedKey];
                    return (
                      <div key={ud.key} style={{ padding: "12px 14px", borderBottom: ii < (group.items.length - 1) ? "1px solid #F0F4F8" : "none", background: uploaded ? "#F0FFF4" : "#FAFBFC" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: uploaded ? 10 : 0 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 700, color: COLORS.navy, fontSize: 13 }}>{ud.label}</span>
                              {ud.required && <span style={{ color: COLORS.red, fontWeight: 700 }}>*</span>}
                              {fromVault && <span style={{ background: "#E8F5EE", color: COLORS.green, borderRadius: 8, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>● auto-filled from vault</span>}
                            </div>
                            <div style={{ fontSize: 11, color: "#7A8A9A", marginTop: 2 }}>{ud.hint}</div>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                            {/* Generate button if this doc can be made on-the-spot */}
                            {ud.generateType && !uploaded && (
                              <button onClick={() => {
                                const doc = generateDocument(ud.generateType, workerForDoc, null, {}, {});
                                if (doc) openPrintWindow(doc.title, doc.content);
                              }} style={{ background: "#FEF3E2", color: COLORS.amber, border: `1px solid ${COLORS.saffron}50`, borderRadius: 7, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                                ✏️ {ud.generateLabel || "Generate"}
                              </button>
                            )}
                            {uploaded ? (
                              <button onClick={() => removeFile(ud.key)}
                                style={{ background: "#FADBD8", color: COLORS.red, border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                ✕ Remove
                              </button>
                            ) : isPhotoSlot(ud) ? (
                              <button onClick={() => setPhotoProcessorSlot(ud.key)}
                                style={{ background: COLORS.saffron, color: "#fff", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                                📸 AI Check & Fix
                              </button>
                            ) : (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => setScanCameraSlot(ud.key)}
                                  style={{ background: "#1A3A5C", color: "#fff", border: "none", borderRadius: 7, padding: "6px 11px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                                  📷 Scan
                                </button>
                                <label style={{ background: COLORS.navy, color: "#fff", borderRadius: 7, padding: "6px 11px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", display: "block" }}>
                                  📁 File
                                  <input type="file" accept={ud.accept} style={{ display: "none" }} onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      setAndVault(ud.key, { name: file.name, size: file.size, type: file.type, preview: ev.target.result }, ud.sharedKey);
                                    };
                                    reader.readAsDataURL(file);
                                  }} />
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                        {uploaded && (
                          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#E8F5EE", borderRadius: 8, padding: "8px 12px" }}>
                            {uploaded.type?.startsWith("image/") ? (
                              <img src={uploaded.preview} alt="preview" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid #C0E0C8", flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 56, height: 56, background: "#EAF0FA", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📄</div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, color: COLORS.green, fontSize: 12 }}>✅ {fromVault ? "Auto-filled from vault" : "Uploaded"}</div>
                              <div style={{ fontSize: 11, color: "#5A6A7A" }}>{uploaded.name}</div>
                              <div style={{ fontSize: 10, color: "#7A8A9A" }}>{(uploaded.size / 1024).toFixed(0)} KB</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {requiredMissing === 0 ? (
              <div style={{ background: "#E8F5EE", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: COLORS.green, fontWeight: 700, marginTop: 4 }}>
                ✅ All required documents uploaded — ready to proceed to Submit
              </div>
            ) : (
              <div style={{ background: "#FEF3E2", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: COLORS.amber, marginTop: 4 }}>
                ⚠️ {requiredMissing} required document(s) still missing
              </div>
            )}
            <Button onClick={() => setTab("submit")} variant="primary" style={{ marginTop: 14 }}>Continue to Submit →</Button>
          </div>
        );
      })()}

      {/* SUBMIT TAB */}
      {tab === "submit" && (
        <div>
          {/* Mode selector for "both" docs */}
          {docCfg.mode === "both" && (
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {[["online", "🌐 Apply Online", "#E8F5EE", "#1A7A4A"], ["offline", "🏛️ Go to Office", "#EAF0FA", "#0D2240"]].map(([m, label, bg, fg]) => (
                <button key={m} onClick={() => setSubmitMode(m)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `2px solid ${submitMode === m ? fg : "#E0E8F0"}`, background: submitMode === m ? bg : "#fff", color: submitMode === m ? fg : COLORS.slate, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* ONLINE path */}
          {(submitMode === "online") && (
            <div>
              <div style={{ background: "#E8F5EE", border: "1.5px solid #34A85A30", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 800, color: "#1A7A4A", fontSize: 14, marginBottom: 8 }}>🌐 Online Submission</div>
                <div style={{ fontSize: 13, color: COLORS.slate, lineHeight: 1.7, marginBottom: 14 }}>
                  Open the portal and fill in the form using the details below. Keep this tab open for reference.
                </div>
                {docCfg.uploadDocs?.length > 0 && (() => {
                  const allItems = docCfg.uploadDocs.flatMap(g => g.items || []);
                  const requiredMissing = allItems.filter(i => i.required && !uploadedFiles[i.key]).length;
                  return requiredMissing > 0 ? (
                    <div style={{ background: "#FEF3E2", border: "1px solid #E8690B30", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setTab("uploads")}>
                      <span style={{ fontSize: 18 }}>📎</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: COLORS.amber }}>{requiredMissing} required document(s) not yet uploaded</div>
                        <div style={{ fontSize: 11, color: "#7A8A9A" }}>Upload them so the docket embeds them alongside the portal form for easy picking</div>
                      </div>
                      <span style={{ color: COLORS.saffron, fontWeight: 700, fontSize: 12 }}>Upload →</span>
                    </div>
                  ) : null;
                })()}
                {Object.keys(uploadedFiles).length > 0 && (
                  <div style={{ background: "#E8F5EE", border: "1px solid #34A85A30", borderRadius: 10, padding: "8px 14px", marginBottom: 14, fontSize: 12, color: COLORS.green, fontWeight: 700 }}>
                    ✅ {Object.keys(uploadedFiles).length} document(s) uploaded — will be embedded in docket for easy access
                  </div>
                )}
                <div style={{ background: "#fff", borderRadius: 8, padding: 12, marginBottom: 14, border: "1px solid #C0E0C8" }}>
                  {docCfg.formFields.filter(f => formData[f.key]).map(f => (
                    <div key={f.key} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #F0F4F8", fontSize: 12 }}>
                      <span style={{ color: "#5A6A7A", fontWeight: 600 }}>{f.label}</span>
                      <span style={{ color: COLORS.navy, fontWeight: 700 }}>{formData[f.key]}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => {
                  // Auto-download docket named WorkerName_DocType_Date.html
                  const workerName = (formData.name || formData.headName || worker?.name || "Worker").replace(/\s+/g, "_");
                  const docSlug = docCfg.title.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_");
                  const dateStr = new Date().toISOString().slice(0, 10);
                  const fileName = `${workerName}_${docSlug}_${dateStr}.html`;

                  // Build the docket HTML
                  const L = PKT[printLang];
                  const formRows = docCfg.formFields.map(f => {
                    const lbl = (FIELD_LABELS[f.key]?.[printLang]) || f.label;
                    return `<tr><td style="padding:7px 12px;background:#F4F6F8;font-weight:600;font-size:12px;color:#5A6A7A;width:42%;border-bottom:1px solid #E8EDF3">${lbl}</td><td style="padding:7px 12px;font-size:13px;font-weight:700;color:#0D2240;border-bottom:1px solid #E8EDF3">${formData[f.key] || ""}</td></tr>`;
                  }).join("");
                  const uploadList = Object.entries(uploadedFiles).length === 0
                    ? '<div style="font-size:12px;color:#7A8A9A;padding:8px 0">No documents uploaded yet</div>'
                    : Object.entries(uploadedFiles).map(([key, f]) => {
                        const allItems = docCfg.uploadDocs?.flatMap(g => g.items || []) || [];
                        const docLabel = allItems.find(ud => ud.key === key)?.label || key;
                        const imgTag = f.type?.startsWith("image/")
                          ? `<img src="${f.preview}" style="max-width:100%;max-height:300px;display:block;margin:8px 0;border:1px solid #C0D0E8;border-radius:6px;object-fit:contain">`
                          : `<div style="background:#EAF0FA;border-radius:6px;padding:12px;font-size:13px;color:#5A6A7A;margin:8px 0">📄 PDF/file: ${f.name} — open in your file manager to view</div>`;
                        return `<div style="border:1px solid #E0E8F0;border-radius:8px;padding:14px;margin-bottom:12px;background:#F8FAFD">
                          <div style="font-weight:700;color:#0D2240;font-size:13px;margin-bottom:4px">📎 ${docLabel}</div>
                          <div style="font-size:11px;color:#7A8A9A;margin-bottom:6px">${f.name} · ${(f.size/1024).toFixed(0)} KB</div>
                          ${imgTag}
                        </div>`;
                      }).join("");

                  const docketHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileName}</title>
                  <style>body{font-family:Arial,sans-serif;max-width:700px;margin:32px auto;padding:0 24px;color:#1A2A3A;font-size:13px}
                  .hdr{background:#0D2240;color:#fff;padding:14px 18px;border-radius:8px;margin-bottom:16px}
                  .section{border:1px solid #E0E8F0;border-radius:8px;overflow:hidden;margin:14px 0}
                  .sec-title{background:#EAF0FA;padding:8px 14px;font-weight:700;font-size:12px;color:#0D2240}
                  table{width:100%;border-collapse:collapse}
                  .portal-link{background:#1A7A4A;color:#fff;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:700;font-size:14px;text-decoration:none;margin:10px 0}
                  @media print{.no-print{display:none}}</style></head><body>
                  <div class="no-print" style="text-align:right;margin-bottom:10px"><button onclick="window.print()" style="background:#E8690B;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:700;cursor:pointer">🖨️ Print</button></div>
                  <div class="hdr">
                    <div style="font-size:17px;font-weight:900">${docCfg.icon} ${docCfg.title} — Application Docket</div>
                    <div style="font-size:11px;opacity:.75;margin-top:4px">JAN SETU · MB Sponge & Power · Generated: ${new Date().toLocaleDateString("en-IN")}</div>
                  </div>
                  <div class="section"><div class="sec-title">📋 Applicant Details (copy these into the online form)</div><table>${formRows}</table></div>
                  <div class="section"><div class="sec-title">🌐 Portal Link</div><div style="padding:14px"><a href="${docCfg.onlineUrl}" target="_blank" class="portal-link">→ Open ${docCfg.onlineLabel || "Portal"}</a></div></div>
                  <div class="section"><div class="sec-title">📎 Documents Uploaded (${Object.keys(uploadedFiles).length} files)</div><div style="padding:12px 14px">${uploadList}</div></div>
                  </body></html>`;

                  // Download the docket
                  const a = document.createElement("a");
                  a.href = "data:text/html;charset=utf-8," + encodeURIComponent(docketHtml);
                  a.download = fileName;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);

                  // Then open the portal
                  setTimeout(() => window.open(docCfg.onlineUrl, "_blank"), 500);
                }}
                  style={{ background: "#1A7A4A", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
                  🌐 Download Docket & Open {docCfg.onlineLabel || "Portal"} →
                </button>
                <div style={{ fontSize: 11, color: "#7A8A9A", marginTop: 8, textAlign: "center" }}>
                  Docket downloads as <strong>{(formData.name || formData.headName || worker?.name || "Worker").replace(/\s+/g, "_")}_{docCfg.title.replace(/[^a-zA-Z0-9]/g,"_")}_today.html</strong> — open it alongside the portal to copy details across
                </div>
              </div>
            </div>
          )}

          {/* OFFLINE path */}
          {(submitMode === "offline") && (
            <div>
              <div style={{ background: "#EAF0FA", border: "1.5px solid #0D224030", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 800, color: "#0D2240", fontSize: 14, marginBottom: 8 }}>🏛️ Office Visit</div>
                <div style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", marginBottom: 14, border: "1px solid #C0D0E8", fontSize: 12, lineHeight: 1.8 }}>
                  <strong>{docCfg.officeLabel}</strong><br/>
                  📍 {docCfg.officeAddress}<br/>
                  🕐 {docCfg.officeHours}<br/>
                  💰 {docCfg.officeFee}
                  {docCfg.bookingUrl && <><br/>📅 Appointment: <a href={docCfg.bookingUrl} target="_blank" style={{ color: COLORS.saffron }}>{docCfg.bookingUrl}</a></>}
                </div>
                <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 8, fontSize: 13 }}>✅ Documents to carry</div>
                {docCfg.docsNeeded.map((d, i) => {
                  const dl = d.toLowerCase();
                  const genMap = [
                    { match: "employer address", type: "employer_address_letter", label: "Generate 🖨️", bg: "#EAF0FA", fg: "#0D2240" },
                    { match: "mb sponge", type: "employer_address_letter", label: "Generate 🖨️", bg: "#EAF0FA", fg: "#0D2240" },
                    { match: "appointment", type: "appointment_cheatsheet", label: "Print Guide 🖨️", bg: "#EAF0FA", fg: "#0D2240" },
                    { match: "seva kendra", type: "seva_kendra_docket", label: "Print Docket 🖨️", bg: "#EAF0FA", fg: "#0D2240" },
                    { match: "jan dhan", type: "jan_dhan_prefill", label: "Pre-fill Card 🖨️", bg: "#E8F5EE", fg: "#1A7A4A" },
                    { match: "name correction", type: "bank_name_correction_letter", label: "Generate 🖨️", bg: "#E8F5EE", fg: "#1A7A4A" },
                  ];
                  const hit = genMap.find(g => dl.includes(g.match));
                  const workerForDoc = { ...worker, ...formData, name: formData.name || worker?.name };
                  return (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F0F4F8" }}>
                      <input type="checkbox" style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, color: COLORS.slate }}>{d}</span>
                      {hit && (
                        <button onClick={() => { const doc = generateDocument(hit.type, workerForDoc, null, {}, {}); if (doc) openPrintWindow(doc.title, doc.content); }}
                          style={{ background: hit.bg, color: hit.fg, border: `1px solid ${hit.fg}40`, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>
                          {hit.label}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 8, fontSize: 13 }}>📖 Steps at the office</div>
              {docCfg.steps.filter(s => !s.startsWith("ONLINE")).map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 13 }}>
                  <div style={{ background: COLORS.saffron, color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <span style={{ color: COLORS.slate }}>{s.replace(/^OFFLINE:\s*/,"")}</span>
                </div>
              ))}

              <div style={{ marginTop: 20, background: COLORS.mist, borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700, color: COLORS.navy, fontSize: 13, marginBottom: 10 }}>🖨️ Print Full Packet</div>
                <div style={{ fontSize: 12, color: "#7A8A9A", marginBottom: 12 }}>Choose language — worker carries this to the government office</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {[["bn","বাংলা"], ["hi","हिंदी"], ["en","English"]].map(([l, label]) => (
                    <button key={l} onClick={() => setPrintLang(l)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `2px solid ${printLang === l ? COLORS.saffron : "#D0D8E4"}`, background: printLang === l ? "#FEF3E2" : "#fff", color: printLang === l ? COLORS.saffron : COLORS.slate, fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={printPacket}
                  style={{ background: COLORS.navy, color: "#fff", border: "none", borderRadius: 10, padding: "13px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  🖨️ Print in {printLang === "bn" ? "বাংলা" : printLang === "hi" ? "हिंदी" : "English"} — Form + Checklist + Guide
                </button>
                <div style={{ fontSize: 11, color: "#7A8A9A", marginTop: 8, textAlign: "center" }}>
                  Includes: filled form · documents checklist · office address · step-by-step guide · worker carries this
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* DocScanCamera modal overlay */}
      {scanCameraSlot && (() => {
        const allItems = docCfg.uploadDocs?.flatMap(g => g.items || []) || [];
        const slot = allItems.find(i => i.key === scanCameraSlot);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(13,34,64,0.7)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #E0E8F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 800, color: COLORS.navy, fontSize: 15 }}>📷 Scan Document</div>
                  <div style={{ fontSize: 11, color: "#7A8A9A", marginTop: 2 }}>{slot?.label}</div>
                </div>
                <button onClick={() => setScanCameraSlot(null)} style={{ background: "#F0F4F8", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, fontWeight: 700, color: COLORS.slate }}>✕</button>
              </div>
              <div style={{ padding: 16 }}>
                <DocScanCamera
                  slotKey={scanCameraSlot}
                  slotLabel={slot?.label || scanCameraSlot}
                  onCancel={() => setScanCameraSlot(null)}
                  onCapture={(result) => {
                    setAndVault(scanCameraSlot, {
                      name:      result.name,
                      size:      result.size,
                      type:      result.type,
                      preview:   result.preview,
                      extracted: result.extracted,
                    }, slot?.sharedKey);
                    setScanCameraSlot(null);
                  }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* PhotoProcessor modal overlay */}
      {photoProcessorSlot && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,34,64,0.6)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E0E8F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 800, color: COLORS.navy, fontSize: 15 }}>📸 AI Photo Check & Fix</div>
              <button onClick={() => setPhotoProcessorSlot(null)} style={{ background: "#F0F4F8", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, fontWeight: 700, color: COLORS.slate }}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              <PhotoProcessor
                specType="standard"
                onCancel={() => setPhotoProcessorSlot(null)}
                onAccept={(result) => {
                  const slotKey = photoProcessorSlot;
                  // Find the slot's sharedKey
                  const allItems = docCfg.uploadDocs?.flatMap(g => g.items || []) || [];
                  const slot = allItems.find(i => i.key === slotKey);
                  setAndVault(slotKey, {
                    name: result.name || "photo_processed.jpg",
                    size: result.size || 0,
                    type: result.type || "image/jpeg",
                    preview: result.src || result.preview,
                  }, slot?.sharedKey);
                  setPhotoProcessorSlot(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VERIFY SCREEN ────────────────────────────────────────────────────────────
function VerifyScreen({ onVerified }) {
  const [phone, setPhone] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarLast4, setAadhaarLast4] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone");
  const [lang, setLang] = useState("en");
  const [resendTimer, setResendTimer] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleAadhaarChange = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 12);
    setAadhaarNumber(digits);
    if (digits.length >= 4) setAadhaarLast4(digits.slice(-4));
  };

  const L = {
    en: { title: "Worker Verification", sub: "MB Sponge & Power Limited — Jan Setu Portal" },
    hi: { title: "कर्मचारी सत्यापन", sub: "MB Sponge & Power Limited — जनमित्र पोर्टल" },
    bn: { title: "কর্মী যাচাইকরণ", sub: "MB Sponge & Power Limited — জনমিত্র পোর্টাল" },
  }[lang];

  const btnStyle = (active) => ({
    padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer",
    fontWeight: 700, fontSize: 12, fontFamily: "inherit",
    background: active ? COLORS.saffron : COLORS.mist,
    color: active ? "#fff" : COLORS.slate,
  });

  const inputStyle = { width: "100%", padding: "10px 13px", border: "1.5px solid #D0D8E4", borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: "#fff", boxSizing: "border-box" };

  const canSendOtp = phone.length >= 10 && aadhaarNumber.length === 12;

  return (
    <div>
      {/* Language selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["en", "hi", "bn"].map(l => (
          <button key={l} style={btnStyle(lang === l)} onClick={() => setLang(l)}>
            {l === "en" ? "English" : l === "hi" ? "हिंदी" : "বাংলা"}
          </button>
        ))}
      </div>

      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🪪</div>
        <h2 style={{ fontSize: 22, color: COLORS.navy, margin: "0 0 6px" }}>{L.title}</h2>
        <p style={{ color: "#7A8A9A", fontSize: 13, margin: 0 }}>{L.sub}</p>
      </div>

      {/* ── STEP 1: Phone + Aadhaar ── */}
      {step === "phone" && (
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.slate, marginBottom: 5 }}>
              Mobile Number <span style={{ color: COLORS.red }}>*</span>
            </label>
            <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
              type="tel" placeholder="10-digit mobile number" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.slate, marginBottom: 5 }}>
              Aadhaar Number <span style={{ color: COLORS.red }}>*</span>
              <span style={{ fontWeight: 400, color: "#7A8A9A", marginLeft: 8, fontSize: 11 }}>12-digit number from Aadhaar card</span>
            </label>
            <input value={aadhaarNumber} onChange={e => handleAadhaarChange(e.target.value)}
              type="tel" placeholder="Enter full 12-digit Aadhaar number" style={{ ...inputStyle, letterSpacing: aadhaarNumber ? 3 : 0 }} />
            {aadhaarNumber.length > 0 && aadhaarNumber.length < 12 && (
              <div style={{ fontSize: 11, color: COLORS.amber, marginTop: 3 }}>{12 - aadhaarNumber.length} more digits needed</div>
            )}
            {aadhaarNumber.length === 12 && (
              <div style={{ fontSize: 11, color: COLORS.green, marginTop: 3 }}>✓ Aadhaar number complete · Last 4: {aadhaarLast4}</div>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.slate, marginBottom: 5 }}>
              Worker ID / UAN <span style={{ color: "#7A8A9A", fontWeight: 400, fontSize: 11 }}>(optional)</span>
            </label>
            <input value={workerId} onChange={e => setWorkerId(e.target.value)} placeholder="Leave blank if unknown" style={inputStyle} />
          </div>

          <Button onClick={async () => { try { const r = await fetch("/api/otp", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"send",mobile:phone})}); const d = await r.json(); if(d.success){window._jansetuOtp=d.otp;setStep("otp_sent");setResendTimer(30);}else{alert("Failed to send OTP: "+d.error);} } catch(e){alert("Error: "+e.message);} }} variant="secondary" size="lg" disabled={!canSendOtp}>
            📲 Send OTP to {phone || "mobile"}
          </Button>

          {!canSendOtp && (
            <div style={{ fontSize: 11, color: "#7A8A9A", marginTop: 8, textAlign: "center" }}>
              {phone.length < 10 ? "Enter 10-digit mobile · " : ""}
              {aadhaarNumber.length < 12 ? "Enter 12-digit Aadhaar number" : ""}
            </div>
          )}

          <div style={{ marginTop: 20, borderTop: "1px solid #E8EDF3", paddingTop: 20 }}>
            <div style={{ fontSize: 12, color: "#7A8A9A", textAlign: "center", marginBottom: 12 }}>
              Is there a problem with the Aadhaar?
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep("no_link")} style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${COLORS.amber}`, background: "#FEF3E2", color: COLORS.amber, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>
                📵 Mobile not linked<br/><span style={{ fontWeight: 400, fontSize: 11 }}>to Aadhaar</span>
              </button>
              <button onClick={() => setStep("no_aadhaar")} style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${COLORS.red}`, background: "#FADBD8", color: COLORS.red, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>
                ❌ No Aadhaar<br/><span style={{ fontWeight: 400, fontSize: 11 }}>card yet</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── STEP 2a: OTP sent ── */}
      {step === "otp_sent" && (
        <>
          <div style={{ background: COLORS.greenPale, border: `1px solid ${COLORS.green}40`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: COLORS.green }}>
            ✅ OTP sent to <strong>{phone}</strong>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.slate, marginBottom: 5 }}>Enter OTP</label>
            <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
              type="tel" placeholder="6-digit OTP" style={{ ...inputStyle, letterSpacing: 6, fontSize: 18 }} />
          </div>

          {/* Resend OTP with visual countdown */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16, gap: 10 }}>
            {resendTimer > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ position: "relative", width: 48, height: 48 }}>
                  <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#E8EDF3" strokeWidth="3" />
                    <circle cx="24" cy="24" r="20" fill="none" stroke={COLORS.saffron} strokeWidth="3"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - resendTimer / 30)}`}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 1s linear" }} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: COLORS.saffron }}>
                    {resendTimer}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.slate }}>OTP sent to {phone}</div>
                  <div style={{ fontSize: 11, color: "#7A8A9A" }}>Resend available in {resendTimer} seconds</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FEF3E2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⏰</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.slate }}>Didn't receive OTP?</div>
                  <div style={{ fontSize: 11, color: "#7A8A9A" }}>Network issues? Tap resend below</div>
                </div>
              </div>
            )}
            <button
              disabled={resendTimer > 0 || resending}
              onClick={async () => {
                setResending(true);
                try {
                  const r = await fetch("/api/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send", mobile: phone }) });
                  const d = await r.json();
                  if (d.success) { window._jansetuOtp = d.otp; setOtp(""); setResendTimer(30); }
                  else { alert("Failed to resend OTP: " + d.error); }
                } catch (e) { alert("Error: " + e.message); }
                setResending(false);
              }}
              style={{
                width: "100%", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                background: resendTimer > 0 ? "#F1F5F9" : "#FEF3E2",
                border: `1.5px solid ${resendTimer > 0 ? "#D0D8E4" : COLORS.saffron}`,
                color: resendTimer > 0 ? "#94A3B8" : COLORS.saffron,
                cursor: resendTimer > 0 ? "not-allowed" : "pointer",
                opacity: resending ? 0.6 : 1,
                transition: "all 0.3s ease",
              }}
            >
              {resending ? "📲 Sending new OTP..." : resendTimer > 0 ? `🔄 Resend OTP (${resendTimer}s)` : "🔄 Resend OTP Now"}
            </button>
          </div>

          <div style={{ background: "#EFF8F3", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: COLORS.green }}>
            🔒 Aadhaar number is used only for identity consent — not stored in our system.
          </div>
          <Button onClick={() => { if(otp === window._jansetuOtp){ onVerified({ phone, workerId, aadhaarNumber, aadhaarLast4, aadhaarVerified: true, verifyMode: "otp" }); } else { alert("Incorrect OTP. Please try again."); } }}
            variant="primary" size="lg" disabled={otp.length < 4}>
            ✅ Verify & Continue
          </Button>
          <button onClick={() => setStep("phone")} style={{ background: "none", border: "none", color: COLORS.saffron, fontSize: 13, cursor: "pointer", marginTop: 14, display: "flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
            ← Back
          </button>
        </>
      )}

      {/* ── STEP 2b: Mobile not linked ── */}
      {step === "no_link" && (
        <>
          <button onClick={() => setStep("phone")} style={{ background: "none", border: "none", color: COLORS.saffron, fontSize: 13, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
            ← Back
          </button>
          <div style={{ background: "#FEF3E2", border: `1.5px solid ${COLORS.amber}40`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 800, color: COLORS.amber, fontSize: 14, marginBottom: 8 }}>📵 Mobile not linked to Aadhaar</div>
            <div style={{ fontSize: 13, color: COLORS.slate, lineHeight: 1.6, marginBottom: 14 }}>
              Linking requires a visit to Aadhaar Seva Kendra — biometric verification, cannot be done online.
            </div>
            <div style={{ background: "#fff", borderRadius: 10, padding: 14, border: "1px solid #E8D090", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 6, fontSize: 13 }}>📍 Nearest Aadhaar Seva Kendra</div>
              <div style={{ fontSize: 12, color: COLORS.slate, lineHeight: 1.8 }}>
                <strong>Asansol ASK</strong> · Ground Floor, Surya Sen Park<br/>
                170 G.T. Road (West), Asansol, WB — 713304<br/>
                🕐 9:30 AM–5:30 PM · 📏 ~12 km · 💰 ₹100 (biometric)
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => window.open("https://bookappointment.uidai.gov.in/", "_blank")}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: COLORS.navy, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  📅 Book Appointment →
                </button>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#7A8A9A", fontStyle: "italic" }}>
              Worker can still be registered. Doc Health will flag "mobile not linked" with a fix guide.
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.slate, marginBottom: 5 }}>Mobile Number <span style={{ color: COLORS.red }}>*</span></label>
            <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} type="tel" placeholder="9876543210" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.slate, marginBottom: 5 }}>Aadhaar Number <span style={{ color: COLORS.red }}>*</span></label>
            <input value={aadhaarNumber} onChange={e => handleAadhaarChange(e.target.value)} type="tel" placeholder="12-digit Aadhaar" style={{ ...inputStyle, letterSpacing: aadhaarNumber ? 3 : 0 }} />
          </div>
          <Button onClick={() => onVerified({ phone, workerId, aadhaarNumber, aadhaarLast4, aadhaarVerified: false, verifyMode: "no_link", pendingMobileLink: true })}
            variant="secondary" size="lg" disabled={phone.length < 10 || aadhaarNumber.length < 12}>
            ▶ Continue Registration (Mobile Link Pending)
          </Button>
        </>
      )}

      {/* ── STEP 2c: No Aadhaar ── */}
      {step === "no_aadhaar" && (
        <>
          <button onClick={() => setStep("phone")} style={{ background: "none", border: "none", color: COLORS.saffron, fontSize: 13, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
            ← Back
          </button>
          <div style={{ background: "#FADBD8", border: `1.5px solid ${COLORS.red}30`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 800, color: COLORS.red, fontSize: 14, marginBottom: 8 }}>❌ Worker has no Aadhaar</div>
            <div style={{ fontSize: 13, color: COLORS.slate, lineHeight: 1.6, marginBottom: 14 }}>
              Aadhaar enrolment is the single highest-priority action — required for almost every scheme.
            </div>
            <div style={{ background: "#fff", borderRadius: 10, padding: 14, border: "1px solid #E8C0C0", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 6, fontSize: 13 }}>📍 Enrolment at Asansol Aadhaar Seva Kendra</div>
              <div style={{ fontSize: 12, color: COLORS.slate, lineHeight: 1.8 }}>
                Ground Floor, Surya Sen Park, 170 G.T. Road (West), Asansol — 713304<br/>
                🆓 New Aadhaar enrolment is FREE<br/>
                📎 Bring: Any photo ID (Voter ID / PAN / Passport) + Address Proof
              </div>
              <button onClick={() => window.open("https://bookappointment.uidai.gov.in/", "_blank")}
                style={{ marginTop: 10, padding: "6px 14px", borderRadius: 8, border: "none", background: COLORS.navy, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                📅 Book Enrolment Appointment →
              </button>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.slate, marginBottom: 5 }}>Mobile Number <span style={{ color: COLORS.red }}>*</span></label>
            <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} type="tel" placeholder="9876543210" style={inputStyle} />
          </div>
          <Button onClick={() => onVerified({ phone, workerId, aadhaarNumber: "", aadhaarLast4: "", aadhaarVerified: false, verifyMode: "no_aadhaar", noAadhaar: true })}
            variant="subtle" size="lg" disabled={phone.length < 10}>
            ▶ Register Without Aadhaar (Enrolment Pending)
          </Button>
        </>
      )}
    </div>
  );
}
```

4. **Save** (Cmd+S)
5. **Push:**
```
git add src/janmitra-platform.jsx
git commit -m "Fix VerifyScreen - clean Resend OTP"
git push
// ─── SCREEN 2: HOUSEHOLD BUILDER ──────────────────────────────────────────────
// Member doc upload component (reused for each family member)
function MemberDocUpload({ member, memberIndex, onDocScanned, scannedDocs }) {
  const isMinor = parseInt(member.age) < 18;
  const isWife = member.relation === "wife";

  const docs = isMinor
    ? [
        { docType: "aadhaar", label: "Aadhaar Card", icon: "🪪", description: "Upload if available — optional for minors under 5", required: false },
        { docType: "birth", label: "Birth Certificate / School ID", icon: "📋", description: "For age proof — required for Kanyashree, NSP", required: true },
      ]
    : [
        { docType: "aadhaar", label: "Aadhaar Card", icon: "🪪", description: "Front side — AI reads name, DOB, address", required: true },
        { docType: "bank", label: "Bank Passbook / Cheque", icon: "🏦", description: "For verifying account in own name", required: isWife },
      ];

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.navyMid, letterSpacing: 0.5, marginBottom: 8 }}>
        📎 DOCUMENTS — {member.name || "Member"} ({member.relation}, Age {member.age})
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {docs.map(d => (
          <DocUploadTile key={d.docType}
            {...d}
            scannedData={scannedDocs?.[`member_${memberIndex}_${d.docType}`]}
            onScanned={(dt, data, fname) => onDocScanned(`member_${memberIndex}_${dt}`, data, fname)}
          />
        ))}
      </div>
    </div>
  );
}

function HouseholdScreen({ worker, onComplete, onBack }) {
  // ── Worker data — AI-filled + manual ────────────────────────────────────────
  const [workerData, setWorkerData] = useState({
    name: "", age: "", gender: "male", caste: "", maritalStatus: "married",
    disability: 0, unorganised: true, epfoCovered: false, farmer: false,
    // from verify screen
    phone: worker?.phone || "",
    workerId: worker?.workerId || "",
    aadhaarNumber: worker?.aadhaarNumber || "",
    aadhaarLast4: worker?.aadhaarLast4 || "",
    aadhaarVerified: worker?.aadhaarVerified || false,
    // doc health — filled by AI or Aadhaar scan
    aadhaarName: "", aadhaarAddressState: "West Bengal",
    aadhaarMobileLinked: worker?.pendingMobileLink ? false : true,
    bankAccount: false, bankAccountName: "", bankAccountNo: "", bankName: "", bankAadhaarSeeded: false,
    casteCert: false, casteCertExpiry: "", incomeCertAvailable: false, annualIncome: "",
    voterId: "", panNumber: "",
    // flags
    aadhaar: !worker?.noAadhaar,
  });

  // ── Docs scanned for worker ──────────────────────────────────────────────────
  const [scannedDocs, setScannedDocs] = useState({});
  const [mismatches, setMismatches] = useState(null); // null = not checked yet

  // ── Family members ───────────────────────────────────────────────────────────
  const [members, setMembers] = useState([]);
  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "", age: "", gender: "female", relation: "wife", caste: "",
    maritalStatus: "married", disability: 0, student: false,
    bankAccount: false, bankInOwnName: false, pregnant: false, firstChild: false,
    aadhaarName: "", aadhaarLast4: "", aadhaarAddressState: "West Bengal",
  });

  // ── When a doc is scanned, merge extracted data into workerData ──────────────
  const handleWorkerDocScanned = (docType, data, fname) => {
    const updated = { ...scannedDocs, [docType]: data };
    setScannedDocs(updated);

    if (!data) return;

    if (docType === "aadhaar") {
      setWorkerData(p => ({
        ...p,
        name: p.name || data.name || "",
        aadhaarName: data.name || p.aadhaarName,
        aadhaarLast4: data.aadhaarLast4 || p.aadhaarLast4,
        aadhaarAddressState: data.addressState || p.aadhaarAddressState,
        gender: data.gender ? data.gender.toLowerCase() : p.gender,
        age: p.age || (data.dob ? String(new Date().getFullYear() - parseInt((data.dob || "").split("/")[2]) || "") : ""),
        aadhaar: true,
      }));
    }
    if (docType === "bank") {
      setWorkerData(p => ({
        ...p,
        bankAccount: true,
        bankAccountName: data.accountHolderName || p.bankAccountName,
        bankAccountNo: data.accountNumber || p.bankAccountNo,
        bankName: (data.bankName || "") + (data.branchName ? ` — ${data.branchName}` : "") || p.bankName,
      }));
    }
    if (docType === "caste") {
      setWorkerData(p => ({
        ...p,
        casteCert: true,
        caste: p.caste || (data.caste || ""),
        casteCertExpiry: data.issueDate ? data.issueDate.split("/").reverse().join("-") : p.casteCertExpiry,
      }));
    }
    if (docType === "income") {
      setWorkerData(p => ({
        ...p,
        incomeCertAvailable: true,
        annualIncome: data.annualIncome || p.annualIncome,
      }));
    }
    if (docType === "voter") {
      setWorkerData(p => ({
        ...p,
        voterId: data.voterId || p.voterId || "",
        aadhaarAddressState: data.addressState || p.aadhaarAddressState,
      }));
    }
    if (docType === "pan") {
      setWorkerData(p => ({
        ...p,
        panNumber: data.panNumber || p.panNumber || "",
      }));
    }

    // Run cross-compare after each scan
    const mm = crossCompareDocuments(updated);
    setMismatches(mm.length > 0 ? mm : []);
  };

  // ── Member doc scanned ────────────────────────────────────────────────────────
  const handleMemberDocScanned = (key, data, fname) => {
    setScannedDocs(p => ({ ...p, [key]: data }));
    // If it's the member's Aadhaar, pre-fill the form
    const match = key.match(/^member_(\d+)_aadhaar$/);
    if (match && data) {
      const idx = parseInt(match[1]);
      setMembers(prev => prev.map((m, i) => i !== idx ? m : {
        ...m,
        name: m.name || data.name || "",
        aadhaarName: data.name || m.aadhaarName,
        aadhaarLast4: data.aadhaarLast4 || m.aadhaarLast4,
        age: m.age || (data.dob ? String(new Date().getFullYear() - parseInt((data.dob || "").split("/")[2])) : m.age),
        gender: data.gender ? data.gender.toLowerCase() : m.gender,
      }));
    }
  };

  // ── New member doc scanned (before adding) ─────────────────────────────────
  const [newMemberDocs, setNewMemberDocs] = useState({});
  const handleNewMemberDocScanned = (key, data) => {
    setNewMemberDocs(p => ({ ...p, [key]: data }));
    if (key === "aadhaar" && data) {
      setNewMember(p => ({
        ...p,
        name: p.name || data.name || "",
        aadhaarName: data.name || p.aadhaarName,
        aadhaarLast4: data.aadhaarLast4 || "",
        age: p.age || (data.dob ? String(new Date().getFullYear() - parseInt((data.dob || "").split("/")[2])) : ""),
        gender: data.gender ? data.gender.toLowerCase() : p.gender,
      }));
    }
    if (key === "bank" && data) {
      setNewMember(p => ({
        ...p,
        bankAccount: true,
        bankInOwnName: true,
        bankAccountName: data.accountHolderName || "",
      }));
    }
  };

  const addMember = () => {
    setMembers(p => [...p, { ...newMember }]);
    setAddingMember(false);
    setNewMember({ name: "", age: "", gender: "female", relation: "wife", caste: "", maritalStatus: "married", disability: 0, student: false, bankAccount: false, bankInOwnName: false, pregnant: false, firstChild: false, aadhaarName: "", aadhaarLast4: "", aadhaarAddressState: "West Bengal" });
    setNewMemberDocs({});
  };

  const isMinorNew = parseInt(newMember.age) < 18;

  const W = workerData;
  const setW = (k, v) => setWorkerData(p => ({ ...p, [k]: v }));

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div>
      {onBack && <BackButton onClick={onBack} label="Back to Verify" />}
      <h2 style={{ fontSize: 20, color: COLORS.navy, marginBottom: 4 }}>👨‍👩‍👧 Household Profile</h2>
      <p style={{ color: "#7A8A9A", fontSize: 13, marginBottom: 20 }}>Upload documents first — AI fills what it can · Fill the rest manually</p>

      {/* Verify mode banner */}
      {worker?.pendingMobileLink && (
        <div style={{ background: "#FEF3E2", border: `1px solid ${COLORS.amber}40`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: COLORS.amber }}>
          ⚠️ <strong>Mobile not linked to Aadhaar</strong> — flagged for resolution in Doc Health. Continue filling details.
        </div>
      )}
      {worker?.noAadhaar && (
        <div style={{ background: "#FADBD8", border: `1px solid ${COLORS.red}30`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: COLORS.red }}>
          ❌ <strong>No Aadhaar yet</strong> — Aadhaar enrolment is critical priority. Continue registration with available documents.
        </div>
      )}

      {/* ═══ SECTION 1: DOCUMENT UPLOAD ═══════════════════════════════════════ */}
      <Card style={{ marginBottom: 16, background: "#F8FAFD" }}>
        <div style={{ fontWeight: 800, color: COLORS.navy, marginBottom: 4, fontSize: 15 }}>📎 Upload Worker Documents</div>
        <div style={{ fontSize: 12, color: "#7A8A9A", marginBottom: 14 }}>AI reads each document and auto-fills the form below. Upload what you have.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <DocUploadTile docType="aadhaar" label="Aadhaar Card" icon="🪪" required
            description="Front side — fills name, DOB, address state" scannedData={scannedDocs.aadhaar}
            onScanned={handleWorkerDocScanned} />
          <DocUploadTile docType="bank" label="Bank Passbook / Cheque" icon="🏦" required={false}
            description="Fills account number, bank name, account holder name" scannedData={scannedDocs.bank}
            onScanned={handleWorkerDocScanned} />
          <DocUploadTile docType="caste" label="Caste Certificate" icon="📜" required={false}
            description="Fills caste category and issue date" scannedData={scannedDocs.caste}
            onScanned={handleWorkerDocScanned} />
          <DocUploadTile docType="income" label="Income Certificate" icon="💰" required={false}
            description="Fills annual income and issue date" scannedData={scannedDocs.income}
            onScanned={handleWorkerDocScanned} />
          <DocUploadTile docType="voter" label="Voter ID (EPIC Card)" icon="🗳️" required={false}
            description="Fills voter ID number — useful for address proof" scannedData={scannedDocs.voter}
            onScanned={handleWorkerDocScanned} />
          <DocUploadTile docType="pan" label="PAN Card" icon="💳" required={false}
            description="Fills PAN number — needed for EPFO KYC, APY" scannedData={scannedDocs.pan}
            onScanned={handleWorkerDocScanned} />
        </div>

        {/* Mismatch panel — appears after scan */}
        {mismatches !== null && mismatches.length > 0 && (
          <MismatchPanel mismatches={mismatches} scannedDocs={scannedDocs} onAccepted={() => {}} />
        )}
        {mismatches !== null && mismatches.length === 0 && Object.keys(scannedDocs).length > 0 && (
          <div style={{ marginTop: 12, background: COLORS.greenPale, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: COLORS.green, fontWeight: 700 }}>
            ✅ All uploaded documents match — no mismatches found
          </div>
        )}
      </Card>

      {/* ═══ SECTION 2: WORKER DETAILS (AI pre-filled + manual) ════════════════ */}
      <Card style={{ marginBottom: 16, background: "#F9F5FF" }}>
        <div style={{ fontWeight: 800, color: COLORS.navy, marginBottom: 4, fontSize: 15 }}>👷 Worker Details</div>
        <div style={{ fontSize: 12, color: "#7A8A9A", marginBottom: 14 }}>
          <span style={{ background: COLORS.greenPale, color: COLORS.green, padding: "1px 7px", borderRadius: 4, fontWeight: 700, marginRight: 6 }}>●</span>Green fields auto-filled from documents · White fields — enter manually
        </div>

        {/* AI-filled fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
          {[
            { key: "name", label: "Full Name", ph: "Ram Kumar", fromDoc: !!scannedDocs.aadhaar?.name },
            { key: "age", label: "Age", ph: "35", type: "number", fromDoc: !!scannedDocs.aadhaar?.dob },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.slate, marginBottom: 3 }}>
                {f.label} {f.fromDoc && <span style={{ color: COLORS.green, fontSize: 10, fontWeight: 700 }}>● AI filled</span>}
              </label>
              <input value={W[f.key] || ""} onChange={e => setW(f.key, f.type === "number" ? parseInt(e.target.value) || 0 : e.target.value)}
                placeholder={f.ph} type={f.type || "text"}
                style={{ width: "100%", padding: "8px 10px", border: `1.5px solid ${f.fromDoc ? COLORS.green + "60" : "#D0D8E4"}`, borderRadius: 7, fontSize: 13, fontFamily: "inherit", background: f.fromDoc ? "#F0FAF4" : "#fff", boxSizing: "border-box" }} />
            </div>
          ))}
        </div>

        {/* Manual fields — can't come from docs */}
        <div style={{ background: "#F0F4F8", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.navy, marginBottom: 10, letterSpacing: 0.5 }}>✍️ FILL MANUALLY — agent asks worker</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <Input label="Gender" value={W.gender} onChange={v => setW("gender", v)} options={[{value:"male",label:"Male"},{value:"female",label:"Female"},{value:"other",label:"Other"}]} />
            <Input label="Caste Category" value={W.caste} onChange={v => setW("caste", v)} options={["General","SC","ST","OBC-A","OBC-B"]} />
            <Input label="Marital Status" value={W.maritalStatus} onChange={v => setW("maritalStatus", v)} options={["married","unmarried","widow"]} />
            <Input label="Annual Household Income (₹)" value={W.annualIncome} onChange={v => setW("annualIncome", v)} placeholder="e.g. 120000" type="number" />
            <Input label="Disability %" value={W.disability} onChange={v => setW("disability", parseInt(v)||0)} type="number" placeholder="0 if none" />
            <Input label="Wife's Name" value={W.wifeName || ""} onChange={v => setW("wifeName", v)} placeholder="If married" />
          </div>

          {/* Children */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 10px", marginTop: 4 }}>
            <Input label="Total Children" value={W.totalChildren || ""} onChange={v => setW("totalChildren", parseInt(v)||0)} type="number" placeholder="0" />
            <Input label="Boys" value={W.boys || ""} onChange={v => setW("boys", parseInt(v)||0)} type="number" placeholder="0" />
            <Input label="Girls" value={W.girls || ""} onChange={v => setW("girls", parseInt(v)||0)} type="number" placeholder="0" />
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10 }}>
            {[
              ["unorganised", "Unorganised Worker"],
              ["epfoCovered", "EPFO / ESI Covered"],
              ["farmer", "Is Farmer"],
              ["aadhaarMobileLinked", "Mobile linked to Aadhaar"],
              ["bankAadhaarSeeded", "Bank Aadhaar-seeded (DBT)"],
            ].map(([k, l]) => (
              <label key={k} style={{ fontSize: 12, color: COLORS.slate, display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                <input type="checkbox" checked={!!W[k]} onChange={e => setW(k, e.target.checked)} /> {l}
              </label>
            ))}
          </div>
        </div>

        {/* Auto-filled from docs — shown as read-only summary */}
        {(scannedDocs.aadhaar || scannedDocs.bank || scannedDocs.caste || scannedDocs.income) && (
          <div style={{ background: COLORS.greenPale, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.green, marginBottom: 8 }}>✅ AUTO-FILLED FROM DOCUMENTS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: 12, color: COLORS.slate }}>
              {scannedDocs.aadhaar?.name && <span>🪪 Aadhaar name: <strong>{scannedDocs.aadhaar.name}</strong></span>}
              {scannedDocs.aadhaar?.addressState && <span>📍 Address state: <strong>{scannedDocs.aadhaar.addressState}</strong></span>}
              {scannedDocs.bank?.accountNumber && <span>🏦 Account: <strong>...{scannedDocs.bank.accountNumber.slice(-4)}</strong></span>}
              {scannedDocs.bank?.bankName && <span>Bank: <strong>{scannedDocs.bank.bankName}</strong></span>}
              {scannedDocs.caste?.caste && <span>📜 Caste: <strong>{scannedDocs.caste.caste}</strong></span>}
              {scannedDocs.income?.annualIncome && <span>💰 Income: <strong>₹{scannedDocs.income.annualIncome}</strong></span>}
              {scannedDocs.voter?.voterId && <span>🗳️ Voter ID: <strong>{scannedDocs.voter.voterId}</strong></span>}
              {scannedDocs.pan?.panNumber && <span>💳 PAN: <strong>{scannedDocs.pan.panNumber}</strong></span>}
            </div>
          </div>
        )}
      </Card>

      {/* ═══ SECTION 3: FAMILY MEMBERS ══════════════════════════════════════════ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontWeight: 800, color: COLORS.navy, fontSize: 15 }}>👨‍👩‍👧 Family Members ({members.length})</div>
        {!addingMember && <button onClick={() => setAddingMember(true)} style={{ background: COLORS.saffron, color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>➕ Add Member</button>}
      </div>

      {/* Member cards */}
      {members.map((m, i) => (
        <Card key={i} style={{ marginBottom: 10, border: "1.5px solid #E8EDF3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontWeight: 700, color: COLORS.navy, fontSize: 14 }}>{m.name || "—"}</span>
              <span style={{ color: "#7A8A9A", fontSize: 12, marginLeft: 10 }}>
                {m.relation} · Age {m.age} · {m.gender} · {m.caste || "General"}
                {m.student && " · Student"}
                {m.bankAccount && " · Bank ✓"}
                {m.pregnant && " · Pregnant"}
              </span>
            </div>
            <button onClick={() => setMembers(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.red, fontSize: 18 }}>🗑️</button>
          </div>
          {scannedDocs[`member_${i}_aadhaar`] && (
            <div style={{ marginTop: 6, fontSize: 11, color: COLORS.green }}>✅ Aadhaar scanned · {scannedDocs[`member_${i}_aadhaar`]?.name}</div>
          )}
          <MemberDocUpload member={m} memberIndex={i} onDocScanned={handleMemberDocScanned} scannedDocs={scannedDocs} />
        </Card>
      ))}

      {/* Add member form */}
      {addingMember && (
        <Card style={{ marginBottom: 16, border: `2px dashed ${COLORS.saffron}` }}>
          <div style={{ fontWeight: 700, color: COLORS.saffron, marginBottom: 12, fontSize: 14 }}>➕ Add Family Member</div>

          {/* Doc upload first */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.navy, marginBottom: 8 }}>📎 Upload documents first (AI will fill details)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <DocUploadTile docType="aadhaar" label="Aadhaar Card" icon="🪪" required={!isMinorNew}
                description={isMinorNew ? "Optional for minors under 5" : "AI fills name, DOB, gender"}
                scannedData={newMemberDocs.aadhaar}
                onScanned={(dt, data) => handleNewMemberDocScanned(dt, data)} />
              {isMinorNew
                ? <DocUploadTile docType="birth" label="Birth Cert / School ID" icon="📋" required={true}
                    description="For age proof — Kanyashree, NSP"
                    scannedData={newMemberDocs.birth}
                    onScanned={(dt, data) => handleNewMemberDocScanned(dt, data)} />
                : <DocUploadTile docType="bank" label="Bank Passbook" icon="🏦" required={newMember.relation === "wife"}
                    description={newMember.relation === "wife" ? "Required — own account check" : "Optional"}
                    scannedData={newMemberDocs.bank}
                    onScanned={(dt, data) => handleNewMemberDocScanned(dt, data)} />
              }
            </div>
          </div>

          {/* Manual fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <Input label="Name" value={newMember.name} onChange={v => setNewMember(p => ({...p, name: v}))} required
              hint={newMemberDocs.aadhaar?.name ? `AI read: ${newMemberDocs.aadhaar.name}` : ""} />
            <Input label="Age" value={newMember.age} onChange={v => setNewMember(p => ({...p, age: parseInt(v)||0}))} type="number" required />
            <Input label="Relation to Worker" value={newMember.relation} onChange={v => setNewMember(p => ({...p, relation: v}))}
              options={["wife","daughter","son","father","mother","other"]} />
            <Input label="Gender" value={newMember.gender} onChange={v => setNewMember(p => ({...p, gender: v}))}
              options={[{value:"male",label:"Male"},{value:"female",label:"Female"}]} />
            <Input label="Caste" value={newMember.caste} onChange={v => setNewMember(p => ({...p, caste: v}))}
              options={["General","SC","ST","OBC-A","OBC-B"]} />
            <Input label="Marital Status" value={newMember.maritalStatus} onChange={v => setNewMember(p => ({...p, maritalStatus: v}))}
              options={["married","unmarried","widow"]} />
          </div>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "8px 0 14px" }}>
            {[
              ["student", "Student"],
              ["bankAccount", "Has Bank Account"],
              ["bankInOwnName", "Account in own name"],
              ["pregnant", "Pregnant"],
              ["firstChild", "First child (PMMVY)"],
            ].map(([k, l]) => (
              <label key={k} style={{ fontSize: 12, color: COLORS.slate, display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                <input type="checkbox" checked={!!newMember[k]} onChange={e => setNewMember(p => ({...p, [k]: e.target.checked}))} /> {l}
              </label>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Button onClick={addMember} variant="secondary" disabled={!newMember.name || !newMember.age}>✅ Add Member</Button>
            <Button onClick={() => { setAddingMember(false); setNewMemberDocs({}); }} variant="subtle">Cancel</Button>
          </div>
        </Card>
      )}

      {/* ═══ CTA ══════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 24 }}>
        <Button onClick={() => onComplete({
          worker: {
            ...workerData,
            // Merge AI-scanned data
            aadhaarName: scannedDocs.aadhaar?.name || workerData.aadhaarName,
            aadhaarLast4: scannedDocs.aadhaar?.aadhaarLast4 || workerData.aadhaarLast4,
            aadhaarAddressState: scannedDocs.aadhaar?.addressState || workerData.aadhaarAddressState,
            bankAccountName: scannedDocs.bank?.accountHolderName || workerData.bankAccountName,
            bankAccountNo: scannedDocs.bank?.accountNumber || workerData.bankAccountNo,
            bankName: scannedDocs.bank?.bankName || workerData.bankName,
            casteCert: !!scannedDocs.caste || workerData.casteCert,
            casteCertExpiry: scannedDocs.caste?.issueDate ? scannedDocs.caste.issueDate.split("/").reverse().join("-") : workerData.casteCertExpiry,
            incomeCertAvailable: !!scannedDocs.income || workerData.incomeCertAvailable,
            bankAccount: !!scannedDocs.bank || workerData.bankAccount,
            aadhaar: !!scannedDocs.aadhaar || workerData.aadhaar,
            scannedDocMismatches: mismatches || [],
          },
          members,
        })} variant="primary" size="lg" disabled={!workerData.name || !workerData.age}>
          Continue to Doc Health Check →
        </Button>
        <div style={{ fontSize: 11, color: "#7A8A9A", marginTop: 8 }}>
          {Object.keys(scannedDocs).filter(k => !k.startsWith("member_")).length} worker doc{Object.keys(scannedDocs).filter(k => !k.startsWith("member_")).length !== 1 ? "s" : ""} scanned · {mismatches?.length || 0} mismatch{mismatches?.length !== 1 ? "es" : ""} detected
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN 3: QUESTIONNAIRE ──────────────────────────────────────────────────
function QuestionnaireScreen({ household, onComplete, onBack }) {
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [rationCard, setRationCard] = useState("");
  const [district] = useState("Paschim Bardhaman");

  return (
    <div>
      {onBack && <BackButton onClick={onBack} label="Back to Household" />}
      <h2 style={{ fontSize: 20, color: COLORS.navy, marginBottom: 4 }}>📋 Household Details</h2>
      <p style={{ color: "#7A8A9A", fontSize: 13, marginBottom: 20 }}>A few more details to find all eligible schemes</p>

      <Card style={{ background: "#EFF8F3", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: COLORS.green, fontWeight: 700 }}>📍 Location (Pre-filled)</div>
        <div style={{ fontSize: 14, color: COLORS.navy, marginTop: 4 }}>West Bengal · {district}</div>
      </Card>

      <Input label="Household Monthly Income (₹)" value={monthlyIncome} onChange={setMonthlyIncome} type="number" placeholder="e.g. 8000" required />
      <Input label="Household Annual Income (₹)" value={annualIncome} onChange={setAnnualIncome} type="number" placeholder="e.g. 96000" required />
      <Input label="Ration Card" value={rationCard} onChange={setRationCard} options={["Yes – PHH","Yes – AAY","Yes – SPHH","No"]} required />

      <div style={{ background: COLORS.amberLight, border: `1px solid ${COLORS.gold}40`, borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13, color: COLORS.amber }}>
        ℹ️ Worker & family details from the previous step will be used for eligibility. Additional scheme-specific questions will be asked during application.
      </div>

      <Button
        onClick={() => onComplete({ monthlyIncome: parseInt(monthlyIncome)||0, annualIncome: parseInt(annualIncome)||0, rationCard })}
        variant="primary" size="lg"
        disabled={!monthlyIncome || !annualIncome || !rationCard}
      >
        Find Eligible Schemes →
      </Button>
    </div>
  );
}

// ─── SCREEN 4: SCHEME RESULTS ─────────────────────────────────────────────────
function SchemesScreen({ results, lang, onApply, onBack }) {
  const [filter, setFilter] = useState("All");
  const categories = ["All", "Central", "West Bengal"];
  const filtered = filter === "All" ? results : results.filter(r => r.scheme.category === filter);

  const diffColor = d => d === "Easy" ? COLORS.green : d === "Medium" ? COLORS.amber : COLORS.red;

  return (
    <div>
      {onBack && <BackButton onClick={onBack} label="Back to Questions" />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h2 style={{ fontSize: 20, color: COLORS.navy, margin: 0 }}>🎯 Eligible Schemes</h2>
        <Badge label={`${results.length} found`} color={COLORS.green} />
      </div>
      <p style={{ color: "#7A8A9A", fontSize: 13, marginBottom: 16 }}>Sorted by easiest first, highest benefit within same difficulty</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12,
            background: filter === c ? COLORS.navy : COLORS.mist, color: filter === c ? "#fff" : COLORS.slate
          }}>{c}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#7A8A9A" }}>No schemes found for this filter.</div>
      )}

      {filtered.map((r, i) => (
        <Card key={i} style={{ marginBottom: 12, borderLeft: `4px solid ${COLORS.saffron}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 22 }}>{r.scheme.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, color: COLORS.navy, fontSize: 14 }}>{r.scheme.fullName}</div>
                  <div style={{ fontSize: 11, color: "#7A8A9A" }}>For: {r.person.name} ({r.person.relation})</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: COLORS.slate, marginBottom: 8 }}>
                {lang === "bn" ? r.scheme.description_bn : lang === "hi" ? r.scheme.description_hi : r.scheme.description_en}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <Badge label={r.scheme.benefit} color={COLORS.green} />
                <Badge label={r.scheme.category} color={COLORS.navy} />
                <Badge label={`Difficulty: ${r.scheme.difficultyLabel}`} color={diffColor(r.scheme.difficultyLabel)} />
              </div>
              {r.reasons && r.reasons.length > 0 && (
                <div style={{ background: COLORS.greenPale, borderRadius: 8, padding: "6px 10px", marginBottom: 8, fontSize: 11, color: COLORS.green }}>
                  ✅ Why eligible: {r.reasons.join(" · ")}
                </div>
              )}
              <div style={{ fontSize: 12, color: "#7A8A9A" }}>
                📎 Docs needed: {r.scheme.docs.join(", ")}
              </div>
            </div>
            <Button onClick={() => onApply(r)} variant="primary" size="sm" style={{ marginLeft: 12, flexShrink: 0 }}>
              Apply →
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── SCREEN 5: APPLICATION + DOC LOCKER ──────────────────────────────────────
function ApplicationScreen({ result, workerRef, lang, onBack, onSubmitApp }) {
  const [docs, setDocs] = useState(result.scheme.docs.reduce((acc, d) => ({ ...acc, [d]: null }), {}));
  const [message, setMessage] = useState("");
  const [applied, setApplied] = useState(false);

  const ref = generateRef();

  const uploadDoc = (docName) => {
    setDocs(p => ({ ...p, [docName]: "uploaded" }));
  };

  const allUploaded = Object.values(docs).every(v => v === "uploaded");

  const handleApply = () => {
    const m = MSG.created[lang](ref, result.scheme.name);
    setMessage(m);
    setApplied(true);
    onSubmitApp({ ref, scheme: result.scheme, person: result.person, docs, status: "Docs Pending" });
  };

  if (applied) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: COLORS.green, fontSize: 20 }}>Application Created!</h2>
        <div style={{ background: COLORS.greenPale, border: `1px solid ${COLORS.green}40`, borderRadius: 12, padding: 16, margin: "16px 0", textAlign: "left" }}>
          <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 6 }}>Reference Number</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.saffron, letterSpacing: 1 }}>{ref}</div>
        </div>
        <div style={{ background: "#F8F9FA", borderRadius: 12, padding: 16, fontSize: 13, color: COLORS.slate, textAlign: "left", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Message sent to worker:</div>
          <div style={{ fontStyle: "italic" }}>{message}</div>
        </div>
        <Button onClick={onBack} variant="secondary">← Back to Schemes</Button>
      </div>
    );
  }

  return (
    <div>
      <BackButton onClick={onBack} label="Back to Schemes" />
      <h2 style={{ fontSize: 18, color: COLORS.navy, marginBottom: 4 }}>{result.scheme.icon} {result.scheme.fullName}</h2>
      <p style={{ color: "#7A8A9A", fontSize: 13, marginBottom: 20 }}>For: {result.person.name} ({result.person.relation}) · {result.scheme.benefit}</p>

      <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 12 }}>📎 Document Locker</div>

      {result.scheme.docs.map(d => (
        <div key={d} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: docs[d] === "uploaded" ? COLORS.greenPale : COLORS.mist, borderRadius: 10, marginBottom: 8, border: `1px solid ${docs[d] === "uploaded" ? COLORS.green : "#E0E8F0"}40` }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.navy }}>{d}</div>
            <div style={{ fontSize: 11, color: docs[d] === "uploaded" ? COLORS.green : "#A0AABB" }}>{docs[d] === "uploaded" ? "✅ Uploaded" : "⏳ Pending"}</div>
          </div>
          {docs[d] !== "uploaded" ? (
            <div style={{ display: "flex", gap: 8 }}>
              <Button onClick={() => uploadDoc(d)} variant="secondary" size="sm">📤 Upload</Button>
              <Button onClick={() => uploadDoc(d)} variant="ghost" size="sm">💬 WhatsApp</Button>
            </div>
          ) : (
            <span style={{ color: COLORS.green, fontSize: 20 }}>✅</span>
          )}
        </div>
      ))}

      <div style={{ marginTop: 6, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 10 }}>📋 Missing Document? Create it:</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {DOC_SERVICES.map(ds => (
            <button key={ds.id} style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${COLORS.saffron}`, background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 700, color: COLORS.saffron }}>
              {ds.icon} {ds.name}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleApply} variant="primary" size="lg">
        📨 Submit Application
      </Button>
      {!allUploaded && <div style={{ fontSize: 11, color: COLORS.amber, marginTop: 8 }}>⚠️ You can submit now and upload documents later through the agent.</div>}
    </div>
  );
}

// ─── SCHEME SUBMISSION CONFIG ─────────────────────────────────────────────────
const SUBMISSION_CFG = {
  pmjjby: {
    mode: "bank_branch", modeIcon: "🏦", modeLabel: "Bank Branch",
    portalUrl: null, needsOtp: false,
    tip: "Bundle PMJJBY + PMSBY together — one bank visit covers both. Saves a trip.",
    instructions: ["Go to worker's bank branch with the filled docket + original Aadhaar","Ask counter staff for 'PMJJBY enrollment form' — they will provide it","Bank auto-debits ₹436 annually; collect the insurance certificate","Enter the certificate/policy number as the Ack Number below"],
    fields: [
      { key:"workerName", label:"Full Name (as per Aadhaar)", src:"person.name" },
      { key:"dob",        label:"Date of Birth",              src:"", ph:"DD/MM/YYYY" },
      { key:"mobile", label:"Mobile (from household)", src:"person.phone" },
      { key:"aadhaar4",   label:"Aadhaar Last 4 Digits",      src:"person.aadhaarLast4" },
      { key:"bankAcc",    label:"Bank Account Number",        src:"", ph:"Account number" },
      { key:"ifsc",       label:"IFSC Code",                  src:"", ph:"e.g. SBIN0001234" },
      { key:"bankBranch", label:"Bank Name & Branch",         src:"person.bankName", ph:"e.g. SBI Asansol" },
      { key:"nominee",    label:"Nominee Name",               src:"", ph:"Full name" },
      { key:"nomineeRel", label:"Nominee Relationship",       src:"", ph:"e.g. Wife, Son" },
    ],
  },
  pmsby: {
    mode: "bank_branch", modeIcon: "🏦", modeLabel: "Bank Branch",
    portalUrl: null, needsOtp: false,
    tip: "Only ₹20/year premium. Do this same visit as PMJJBY.",
    instructions: ["Ask for 'PMSBY enrollment form' at the same bank counter","Premium of ₹20 auto-debited annually from savings account","Collect confirmation slip — enter slip number as Ack Number"],
    fields: [
      { key:"workerName", label:"Full Name",             src:"person.name" },
      { key:"dob",        label:"Date of Birth",         src:"", ph:"DD/MM/YYYY" },
      { key:"mobile", label:"Mobile (from household)", src:"person.phone" },
      { key:"aadhaar4",   label:"Aadhaar Last 4 Digits", src:"person.aadhaarLast4" },
      { key:"bankAcc",    label:"Bank Account Number",   src:"", ph:"Account number" },
      { key:"ifsc",       label:"IFSC Code",             src:"", ph:"e.g. SBIN0001234" },
      { key:"nominee",    label:"Nominee Name",          src:"", ph:"Full name" },
      { key:"nomineeRel", label:"Nominee Relationship",  src:"", ph:"e.g. Wife, Son" },
    ],
  },
  apy: {
    mode: "bank_branch", modeIcon: "🏦", modeLabel: "Bank Branch / Online",
    portalUrl: "https://enps.nsdl.com/eNPS/NationalPensionSystem.html",
    portalLabel: "Open eNPS Portal →", needsOtp: false,
    tip: "Worker must choose pension slab: ₹1,000 / ₹2,000 / ₹3,000 / ₹4,000 / ₹5,000/month. Show them the contribution table before deciding.",
    instructions: ["At bank: fill APY subscriber registration form, attach Aadhaar + bank passbook","Worker must be 18–40 years old — verify age before applying","Monthly contribution is auto-calculated by bank based on age + chosen pension slab","Collect PRAN (Permanent Retirement Account Number) as the Ack Number"],
    fields: [
      { key:"workerName",   label:"Full Name",                  src:"person.name" },
      { key:"dob",          label:"Date of Birth",              src:"", ph:"DD/MM/YYYY" },
      { key:"mobile",       label:"Mobile (from household)",  src:"person.phone" },
      { key:"aadhaar",      label:"Aadhaar Number",             src:"", ph:"12-digit Aadhaar" },
      { key:"bankAcc",      label:"Bank Account Number",        src:"", ph:"Account number" },
      { key:"ifsc",         label:"IFSC Code",                  src:"", ph:"e.g. SBIN0001234" },
      { key:"pensionSlab",  label:"Chosen Pension Amount", src:"", type:"select",
        options:["₹1,000/month","₹2,000/month","₹3,000/month","₹4,000/month","₹5,000/month"] },
      { key:"nominee",      label:"Nominee Name",               src:"", ph:"Full name" },
      { key:"nomineeRel",   label:"Nominee Relationship",       src:"", ph:"e.g. Wife" },
      { key:"nomineeDob",   label:"Nominee Date of Birth",      src:"", ph:"DD/MM/YYYY" },
    ],
  },
  pm_sym: {
    mode: "online_form", modeIcon: "🌐", modeLabel: "Online Portal",
    portalUrl: "https://maandhan.in/shramyogi",
    portalLabel: "Open maandhan.in →", needsOtp: true,
    tip: "⚠️ Workers covered under ESIC/EPFO are NOT eligible. Verify before applying — rejection wastes everyone's time.",
    instructions: ["Open maandhan.in → 'Self Enrolment' tab","Enter Aadhaar number → worker gets OTP on Aadhaar-linked mobile (worker must be present or on call)","Enter OTP → fill all details from the pre-filled form below","After submission, note the Acknowledgement Number"],
    fields: [
      { key:"workerName",  label:"Full Name (as per Aadhaar)",  src:"person.name" },
      { key:"dob",         label:"Date of Birth",               src:"", ph:"DD/MM/YYYY" },
      { key:"aadhaar",     label:"Aadhaar Number",              src:"", ph:"12-digit" },
      { key:"mobile",      label:"Mobile (from household)",      src:"person.phone" },
      { key:"bankAcc",     label:"Bank / Jan Dhan Account No.", src:"", ph:"Account number" },
      { key:"ifsc",        label:"IFSC Code",                   src:"", ph:"e.g. SBIN0001234" },
      { key:"spouseName",  label:"Spouse Name (if married)",    src:"", ph:"Leave blank if single" },
      { key:"nominee",     label:"Nominee Name",                src:"", ph:"Full name" },
      { key:"nomineeRel",  label:"Nominee Relationship",        src:"", ph:"e.g. Wife, Son" },
    ],
  },
  swasthya_sathi: {
    mode: "biometric_camp", modeIcon: "🏕️", modeLabel: "Biometric Camp",
    portalUrl: "https://swasthyasathi.gov.in", portalLabel: "Check Swasthya Sathi portal →",
    needsOtp: false,
    tip: "Cannot be done online. Organise a camp at factory OR take family to Duare Sarkar camp. ALL family members must be physically present.",
    instructions: ["Arrange Swasthya Sathi camp at factory with UIDAI biometric device (contact Jamuria BDO)","All family members must attend in person for fingerprint/iris scan","Smart card issued on the spot — no follow-up needed","Camp checklist below — share with worker a day before"],
    fields: [
      { key:"headName",     label:"Head of Household",              src:"person.name" },
      { key:"mobile", label:"Mobile (from household)", src:"person.phone" },
      { key:"address",      label:"Residential Address (WB)",       src:"", ph:"House, village/ward, district" },
      { key:"rationCard",   label:"Ration Card Number (if any)",    src:"", ph:"Optional" },
      { key:"memberCount",  label:"Number of family members",       src:"", ph:"e.g. 4", type:"number" },
    ],
    campChecklist: [
      "Aadhaar card (original + photocopy) of ALL family members",
      "Head of household's mobile number — Aadhaar-linked preferred",
      "Address proof: ration card / voter ID / utility bill with WB address",
      "2 passport-size photos of each member",
      "Any existing Swasthya Sathi card (if updating or adding a member)",
    ],
  },
  lakshmir_bhandar: {
    mode: "online_form", modeIcon: "🌐", modeLabel: "Online / Duare Sarkar",
    portalUrl: "https://socialsecurity.wb.gov.in",
    portalLabel: "Open Social Security WB →", needsOtp: false,
    tip: "Applicant is the WOMAN — not the worker. Bank account must be in her own name. SC/ST gets ₹1,200/month; General/OBC gets ₹1,000/month.",
    instructions: ["Open portal → 'Lakshmir Bhandar' → 'Apply Now'","Fill all details for the WOMAN applicant (not the worker)","Bank account must be solely in the woman's name — verify before submitting","After submission note the Application ID as Ack Number","Also available at Duare Sarkar camps if portal is slow"],
    fields: [
      { key:"applicantName", label:"Applicant Name (woman's name)", src:"person.name" },
      { key:"dob",           label:"Date of Birth",                 src:"", ph:"DD/MM/YYYY" },
      { key:"aadhaar",       label:"Aadhaar Number",                src:"", ph:"12-digit" },
      { key:"mobile", label:"Mobile (from household)", src:"person.phone" },
      { key:"caste",         label:"Caste Category", src:"person.caste", type:"select",
        options:["General","OBC-A","OBC-B","SC","ST"] },
      { key:"bankAcc",       label:"Bank Account (her own)",        src:"", ph:"Must be in her name only" },
      { key:"ifsc",          label:"IFSC Code",                     src:"", ph:"e.g. SBIN0001234" },
      { key:"bankName",      label:"Bank Name",                     src:"", ph:"e.g. SBI Asansol" },
      { key:"address",       label:"Residential Address (WB)",      src:"", ph:"Full WB address" },
      { key:"husbandName",   label:"Husband's Name",                src:"", ph:"If married" },
    ],
  },
  svmcm: {
    mode: "online_form", modeIcon: "🌐", modeLabel: "Online Portal",
    portalUrl: "https://svmcm.wbhed.gov.in",
    portalLabel: "Open SVMCM Portal →", needsOtp: false,
    tip: "Portal opens July–September each year. Student must register themselves. Income cert must be from current financial year.",
    instructions: ["Portal → 'Applicant Login' → 'New Registration' (first time)","Student fills their own details + uploads documents","Income certificate must be current year — check date before uploading","Note the Application ID as Ack Number after submission"],
    fields: [
      { key:"studentName",  label:"Student Full Name",       src:"person.name" },
      { key:"dob",          label:"Date of Birth",           src:"", ph:"DD/MM/YYYY" },
      { key:"aadhaar",      label:"Aadhaar Number",          src:"", ph:"12-digit" },
      { key:"mobile",       label:"Student Mobile",          src:"", ph:"For OTP" },
      { key:"eduLevel",     label:"Current Education Level", src:"", type:"select",
        options:["Class XI","Class XII","UG 1st Year","UG 2nd Year","UG 3rd Year","PG 1st Year","PG 2nd Year"] },
      { key:"institution",  label:"Institution Name",        src:"", ph:"Full school/college name" },
      { key:"rollNo",       label:"Roll / Admission Number", src:"", ph:"" },
      { key:"income",       label:"Annual Family Income (₹)",src:"", ph:"Must be ≤ ₹2,50,000" },
      { key:"bankAcc",      label:"Bank Account (student's)",src:"", ph:"Account number" },
      { key:"ifsc",         label:"IFSC Code",               src:"", ph:"e.g. SBIN0001234" },
    ],
  },
  wb_old_age_pension: {
    mode: "bdo_office", modeIcon: "🏛️", modeLabel: "BDO / e-District",
    portalUrl: "https://edistrict.wb.gov.in",
    portalLabel: "Open e-District WB →", needsOtp: false,
    tip: "Applicant must be 60+ years. Both online (e-District) and offline (BDO office) accepted.",
    instructions: ["Online: e-District portal → Social Welfare → Old Age Pension","Offline: BDO office, Jamuria Block with filled docket + original documents","Application Number issued — enter as Ack Number","Monthly ₹1,000 credited directly to account after approval"],
    fields: [
      { key:"applicantName", label:"Applicant Full Name",           src:"person.name" },
      { key:"dob",           label:"Date of Birth (must show ≥60)", src:"", ph:"DD/MM/YYYY" },
      { key:"aadhaar",       label:"Aadhaar Number",                src:"", ph:"12-digit" },
      { key:"mobile", label:"Mobile (from household)", src:"person.phone" },
      { key:"address",       label:"Full Residential Address",      src:"", ph:"House, village, PS, district" },
      { key:"bankAcc",       label:"Bank Account Number",           src:"", ph:"" },
      { key:"ifsc",          label:"IFSC Code",                     src:"", ph:"" },
      { key:"voterId",       label:"Voter ID Number",               src:"", ph:"Optional" },
    ],
  },
  wb_widow_pension: {
    mode: "bdo_office", modeIcon: "🏛️", modeLabel: "BDO / e-District",
    portalUrl: "https://edistrict.wb.gov.in",
    portalLabel: "Open e-District WB →", needsOtp: false,
    tip: "Death certificate is the critical document. Do not proceed without it.",
    instructions: ["Verify death certificate is available — without it application will be rejected","Apply at BDO office or e-District portal","Annual income must be ≤ ₹72,000 — income certificate required","Enter Application Number as Ack Number"],
    fields: [
      { key:"applicantName", label:"Applicant Name (widow)",  src:"person.name" },
      { key:"dob",           label:"Date of Birth",           src:"", ph:"DD/MM/YYYY" },
      { key:"aadhaar",       label:"Aadhaar Number",          src:"", ph:"12-digit" },
      { key:"husbandName",   label:"Late Husband's Name",     src:"", ph:"" },
      { key:"deathCertNo",   label:"Death Certificate No.",   src:"", ph:"From death certificate" },
      { key:"bankAcc",       label:"Bank Account Number",     src:"", ph:"" },
      { key:"ifsc",          label:"IFSC Code",               src:"", ph:"" },
      { key:"incomeCertNo",  label:"Income Certificate No.",  src:"", ph:"Annual income ≤ ₹72,000" },
    ],
  },
  manabik: {
    mode: "bdo_office", modeIcon: "🏛️", modeLabel: "BDO / e-District",
    portalUrl: "https://edistrict.wb.gov.in",
    portalLabel: "Open e-District WB →", needsOtp: false,
    tip: "Disability ≥40% required. Certificate must be from govt hospital CMO — private hospital cert rejected.",
    instructions: ["Disability certificate from CMO/govt hospital is mandatory","Apply at BDO office or e-District portal","No income limit — any person with ≥40% certified disability qualifies","Enter Application Number as Ack Number"],
    fields: [
      { key:"applicantName", label:"Applicant Full Name",       src:"person.name" },
      { key:"dob",           label:"Date of Birth",             src:"", ph:"DD/MM/YYYY" },
      { key:"aadhaar",       label:"Aadhaar Number",            src:"", ph:"12-digit" },
      { key:"disabCert",     label:"Disability Cert Number",    src:"", ph:"From CMO/govt hospital" },
      { key:"disabPct",      label:"Disability Percentage",     src:"", ph:"e.g. 60%" },
      { key:"disabType",     label:"Type of Disability",        src:"", ph:"e.g. Locomotor, Visual" },
      { key:"bankAcc",       label:"Bank Account Number",       src:"", ph:"" },
      { key:"ifsc",          label:"IFSC Code",                 src:"", ph:"" },
    ],
  },
  epfo_ekyc: {
    mode: "online_form", modeIcon: "🌐", modeLabel: "EPFO Portal",
    portalUrl: "https://unifiedportal-mem.epfindia.gov.in/memberInterface/",
    portalLabel: "Open EPFO Member Portal →", needsOtp: true,
    tip: "After Aadhaar + PAN + bank are submitted, employer (MB Sponge HR) must approve the KYC in their portal. Remind HR team.",
    instructions: ["Login with UAN + password (activate UAN first if new worker)","Go to: Manage → KYC tab","Add Aadhaar: worker gets OTP on Aadhaar-linked mobile — enter it","Add PAN: enter PAN number (no OTP needed)","Add Bank: enter account + IFSC — verification takes 1–2 days","Status shows 'Pending for Employer Approval' — MB Sponge HR must approve","Enter UAN as Ack Number below"],
    fields: [
      { key:"uan",         label:"UAN (Universal Account No.)", src:"", ph:"12-digit UAN" },
      { key:"workerName",  label:"Name as per EPFO records",   src:"person.name" },
      { key:"aadhaar",     label:"Aadhaar Number",             src:"", ph:"12-digit" },
      { key:"pan",         label:"PAN Number",                 src:"", ph:"10-character PAN" },
      { key:"bankAcc",     label:"Bank Account Number",        src:"", ph:"" },
      { key:"ifsc",        label:"IFSC Code",                  src:"", ph:"" },
      { key:"bankName",    label:"Bank Name",                  src:"", ph:"e.g. SBI" },
    ],
  },
  kanyashree_k1: {
    mode: "school_form", modeIcon: "🏫", modeLabel: "Through School",
    portalUrl: "https://wbkanyashree.gov.in",
    portalLabel: "Open Kanyashree Portal →", needsOtp: false,
    tip: "Form K1 is available at the girl's school. The school is the verifying authority — agent's role is to ensure she has a bank account in her own name before the school submits.",
    instructions: ["Ensure girl has her own bank account (Jan Dhan / school facilitated minor account)","Collect K1 application form from the school (printed on light green paper)","School fills and verifies the form — agent reviews it with the family","School submits to Block and District for approval","Scholarship credited directly to girl's account annually","Track status at wbkanyashree.gov.in using the Application ID"],
    fields: [
      { key:"studentName",  label:"Student Full Name",          src:"person.name" },
      { key:"dob",          label:"Date of Birth",              src:"", ph:"DD/MM/YYYY (must be 13–17 years 11 months)" },
      { key:"school",       label:"School Name",                src:"", ph:"Full school name" },
      { key:"className",    label:"Current Class",              src:"", ph:"e.g. Class 9" },
      { key:"aadhaar",      label:"Aadhaar Number",             src:"", ph:"12-digit" },
      { key:"bankAcc",      label:"Bank Account (girl's own)",  src:"", ph:"Must be in her name" },
      { key:"ifsc",         label:"IFSC Code",                  src:"", ph:"" },
      { key:"income",       label:"Annual Family Income (₹)",   src:"", ph:"Must be ≤ ₹1,20,000" },
      { key:"fatherName",   label:"Father's / Guardian's Name", src:"", ph:"" },
    ],
  },
  pmmvy: {
    mode: "online_form", modeIcon: "🌐", modeLabel: "PMMVY Portal / AWC",
    portalUrl: "https://pmmvy.wcd.gov.in",
    portalLabel: "Open PMMVY Portal →", needsOtp: false,
    tip: "⏰ TIME-SENSITIVE: Apply during pregnancy — do not wait until after delivery. Register at the nearest Anganwari Centre (AWC) as well.",
    instructions: ["Register at nearest AWC (Anganwari Centre) in Jamuria / Asansol — they process PMMVY","OR apply online at pmmvy.wcd.gov.in","Three instalments: 1st on early registration, 2nd after check-up, 3rd after delivery","Benefit is ₹5,000 total, credited directly to mother's own bank account","Bank account must be in the MOTHER's name — not husband's"],
    fields: [
      { key:"applicantName", label:"Mother's Full Name",        src:"person.name" },
      { key:"dob",           label:"Date of Birth (mother)",    src:"", ph:"DD/MM/YYYY" },
      { key:"aadhaar",       label:"Aadhaar Number (mother)",   src:"", ph:"12-digit" },
      { key:"mobile", label:"Mobile (from household)", src:"person.phone" },
      { key:"lmpDate",       label:"LMP Date (last period)",    src:"", ph:"DD/MM/YYYY — from MCP card" },
      { key:"bankAcc",       label:"Bank Account (mother's)",   src:"", ph:"Must be in her name" },
      { key:"ifsc",          label:"IFSC Code",                 src:"", ph:"" },
      { key:"hospital",      label:"Hospital / AWC Name",       src:"", ph:"Where she is registered" },
      { key:"husbandName",   label:"Husband's Name",            src:"", ph:"" },
      { key:"husbandAadhaar",label:"Husband's Aadhaar",         src:"", ph:"12-digit" },
    ],
  },
};

// ─── SUBMISSION DOCKET GENERATOR ─────────────────────────────────────────────
function generateSubmissionDocket(app, formData, appSettings) {
  const cfg = SUBMISSION_CFG[app.scheme.id];
  if (!cfg) return;
  const today = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" });
  const welfareOfficer = appSettings?.welfareOfficer || "Welfare Officer";

  const rows = (cfg.fields || []).map(f => {
    const val = formData[f.key] || "";
    return `<tr><td class="dl">${f.label}</td><td class="dv"><strong>${val || "<em style='color:#AAA'>[Not filled]</em>"}</strong></td></tr>`;
  }).join("");

  const campChecklist = cfg.campChecklist
    ? `<div class="section"><div class="sec-title">🏕️ Camp Day Checklist — Share with Worker</div>
       ${cfg.campChecklist.map(item => `<label class="chk"><input type="checkbox"> ${item}</label>`).join("")}</div>` : "";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Submission Docket — ${app.scheme.fullName}</title>
  <style>
    body{font-family:Arial,sans-serif;max-width:700px;margin:32px auto;padding:0 20px;color:#1A2A3A;font-size:13px;line-height:1.5}
    .hdr{background:#0D2240;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:center}
    .hdr-title{font-size:17px;font-weight:900;letter-spacing:.5px}
    .hdr-ref{font-family:monospace;font-size:12px;background:rgba(255,255,255,.15);padding:4px 10px;border-radius:6px}
    .meta{background:#F4F6F8;padding:10px 20px;border:1px solid #E0E8F0;font-size:12px;display:flex;gap:24px}
    .section{border:1px solid #E0E8F0;border-radius:8px;overflow:hidden;margin:16px 0}
    .sec-title{background:#EAF0FA;padding:8px 14px;font-weight:700;font-size:12px;color:#0D2240;letter-spacing:.5px;text-transform:uppercase}
    table{width:100%;border-collapse:collapse}
    .dl{padding:7px 14px;color:#5A6A7A;font-weight:600;width:42%;border-bottom:1px solid #F0F4F8;background:#FAFBFD}
    .dv{padding:7px 14px;border-bottom:1px solid #F0F4F8}
    .tip{background:#FEF3E2;border-left:4px solid #E8690B;padding:10px 14px;font-size:12px;color:#7A5000;margin:16px 0;border-radius:0 8px 8px 0}
    .chk{display:block;padding:6px 14px;border-bottom:1px solid #F0F4F8;font-size:13px}
    .steps{padding:12px 14px}
    .step{display:flex;gap:10px;margin-bottom:8px;align-items:flex-start;font-size:13px}
    .sn{background:#E8690B;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0;margin-top:1px}
    .sig{margin-top:32px;border-top:2px dashed #E0E8F0;padding-top:20px;display:flex;justify-content:space-between}
    .sig-box{text-align:center;width:45%}
    .sig-line{border-top:1px solid #0D2240;margin-bottom:6px;padding-top:4px;font-weight:700;font-size:12px}
    @media print{body{margin:0}button{display:none}}
  </style></head><body>
  <div style="text-align:right;margin-bottom:12px"><button onclick="window.print()" style="background:#E8690B;color:#fff;border:none;padding:8px 18px;border-radius:7px;font-weight:700;font-size:12px;cursor:pointer">🖨️ Print / Save PDF</button></div>
  <div class="hdr"><div><div class="hdr-title">${app.scheme.icon} ${app.scheme.fullName}</div><div style="font-size:11px;opacity:.7;margin-top:2px">Submission Docket — JAN SETU, MB Sponge & Power Limited</div></div><div class="hdr-ref">${app.ref}</div></div>
  <div class="meta"><span>👤 ${app.person.name} (${app.person.relation})</span><span>📅 ${today}</span><span>${cfg.modeIcon} ${cfg.modeLabel}</span></div>
  <div class="tip">💡 Agent Tip: ${cfg.tip}</div>
  <div class="section"><div class="sec-title">📋 Pre-filled Application Details</div><table>${rows}</table></div>
  <div class="section"><div class="sec-title">📖 Submission Steps</div><div class="steps">${cfg.instructions.map((s,i)=>`<div class="step"><div class="sn">${i+1}</div><span>${s}</span></div>`).join("")}</div></div>
  ${campChecklist}
  <div class="section"><div class="sec-title">📎 Documents to Carry</div><div class="steps">${app.scheme.docs.map(d=>`<label class="chk"><input type="checkbox"> ${d}</label>`).join("")}</div></div>
  <div class="sig"><div class="sig-box"><div style="margin-bottom:40px"></div><div class="sig-line">${welfareOfficer}</div><div style="font-size:11px;color:#7A8A9A">Welfare Officer / Jan Setu Pratinidhi<br>MB Sponge & Power Limited</div></div><div class="sig-box"><div style="margin-bottom:40px"></div><div class="sig-line">${app.person.name}</div><div style="font-size:11px;color:#7A8A9A">Beneficiary / Applicant Signature</div></div></div>
  </body></html>`;

  _openDoc(html);
}

// ─── SUBMISSION CONSOLE ───────────────────────────────────────────────────────
function SubmissionConsole({ app, onBack, onSubmitted }) {
  const cfg = SUBMISSION_CFG[app.scheme.id];
  const [formData, setFormData] = useState({});
  const [ackNumber, setAckNumber] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [activeTab, setActiveTab] = useState("form");
  const [submittedDone, setSubmittedDone] = useState(false);

  if (!cfg) return (
    <div>
      <BackButton onClick={onBack} label="Back to Case" />
      <div style={{ textAlign:"center", padding:40, color:"#7A8A9A" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🔧</div>
        <div style={{ fontWeight:700, color:COLORS.navy }}>Submission form not yet configured for this scheme.</div>
      </div>
    </div>
  );

  const resolve = (src) => {
    if (!src) return "";
    const [obj, key] = src.split(".");
    if (obj === "person") return app.person?.[key] || "";
    return "";
  };

  const val = (f) => formData[f.key] !== undefined ? formData[f.key] : resolve(f.src);
  const set = (key, v) => setFormData(p => ({...p, [key]: v}));

  const modeColors = {
    bank_branch:     { bg:"#E8F5EE", color:COLORS.green },
    online_form:     { bg:"#EAF0FA", color:COLORS.navyMid },
    bdo_office:      { bg:"#FEF3E2", color:COLORS.amber },
    biometric_camp:  { bg:"#F3E8FF", color:"#7B2CBF" },
    school_form:     { bg:"#E8F5EE", color:COLORS.green },
  };
  const mc = modeColors[cfg.mode] || modeColors.online_form;

  const tabStyle = (t) => ({
    padding:"8px 16px", border:"none", cursor:"pointer", fontWeight:700,
    fontSize:12, fontFamily:"inherit", borderRadius:"8px 8px 0 0",
    background: activeTab===t ? "#fff" : COLORS.mist,
    color: activeTab===t ? COLORS.saffron : COLORS.slate,
    borderBottom: activeTab===t ? `2px solid ${COLORS.saffron}` : "2px solid transparent",
  });

  if (submittedDone) return (
    <div style={{ textAlign:"center", padding:"28px 0" }}>
      <div style={{ fontSize:60, marginBottom:12 }}>🎉</div>
      <h2 style={{ color:COLORS.green, fontSize:20, marginBottom:8 }}>Successfully Submitted!</h2>
      <div style={{ background:COLORS.greenPale, borderRadius:12, padding:16, marginBottom:20, textAlign:"left" }}>
        <div style={{ fontSize:12, color:"#7A8A9A", marginBottom:4 }}>Acknowledgement Number</div>
        <div style={{ fontSize:22, fontWeight:900, color:COLORS.saffron, letterSpacing:1 }}>{ackNumber}</div>
        <div style={{ fontSize:12, color:COLORS.green, marginTop:8 }}>✅ Status → Submitted · SMS queued for worker</div>
      </div>
      <Button onClick={onBack} variant="secondary">← Back to Pipeline</Button>
    </div>
  );

  return (
    <div>
      <BackButton onClick={onBack} label="Back to Case" />

      {/* Header row */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
        <div>
          <h3 style={{ color:COLORS.navy, margin:"0 0 4px" }}>{app.scheme.icon} {app.scheme.fullName}</h3>
          <div style={{ fontSize:12, color:"#7A8A9A" }}>For: {app.person.name} ({app.person.relation}) · {app.ref}</div>
        </div>
        <div style={{ background:mc.bg, borderRadius:8, padding:"6px 12px", textAlign:"center", flexShrink:0 }}>
          <div style={{ fontSize:18 }}>{cfg.modeIcon}</div>
          <div style={{ fontSize:11, fontWeight:700, color:mc.color }}>{cfg.modeLabel}</div>
        </div>
      </div>

      {/* OTP warning */}
      {cfg.needsOtp && (
        <div style={{ background:"#FEF0E6", border:`1px solid ${COLORS.saffron}40`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13, color:COLORS.amber }}>
          ⚠️ <strong>Aadhaar OTP required</strong> — Worker must be present or reachable by phone during portal submission.
        </div>
      )}

      {/* Time-sensitive tip */}
      {cfg.tip && (
        <div style={{ background:COLORS.mist, borderLeft:`3px solid ${COLORS.saffron}`, borderRadius:"0 8px 8px 0", padding:"8px 14px", marginBottom:14, fontSize:12, color:COLORS.slate }}>
          💡 {cfg.tip}
        </div>
      )}

      {/* Portal + Docket buttons */}
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        {cfg.portalUrl && (
          <button onClick={() => window.open(cfg.portalUrl,"_blank")} style={{ background:COLORS.navy, color:"#fff", border:"none", borderRadius:8, padding:"7px 16px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            🌐 {cfg.portalLabel || "Open Portal ↗"}
          </button>
        )}
        <button onClick={() => generateSubmissionDocket(app, formData, { welfareOfficer:"Welfare Officer / Jan Setu Pratinidhi" })} style={{ background:COLORS.amberLight, color:COLORS.saffron, border:`1.5px solid ${COLORS.saffron}`, borderRadius:8, padding:"7px 16px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          🖨️ Print Docket / PDF
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:2, borderBottom:`2px solid #E8EDF3`, marginBottom:0 }}>
        <button style={tabStyle("form")} onClick={()=>setActiveTab("form")}>📋 Pre-filled Form</button>
        <button style={tabStyle("steps")} onClick={()=>setActiveTab("steps")}>📖 Steps</button>
        {cfg.campChecklist && <button style={tabStyle("camp")} onClick={()=>setActiveTab("camp")}>🏕️ Camp Checklist</button>}
        <button style={tabStyle("docs")} onClick={()=>setActiveTab("docs")}>📎 Documents</button>
      </div>

      <div style={{ background:"#FAFBFD", border:"1px solid #E8EDF3", borderTop:"none", borderRadius:"0 0 12px 12px", padding:20, marginBottom:16 }}>

        {/* ── FORM TAB ── */}
        {activeTab==="form" && (
          <div>
            <div style={{ fontSize:11, color:"#7A8A9A", marginBottom:14 }}>
              🟢 Green fields pre-filled from household · White fields need manual entry
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
              {(cfg.fields||[]).map(f => {
                const v = val(f);
                const prefilled = !!f.src && !!resolve(f.src);
                const inputStyle = { width:"100%", padding:"8px 10px", border:`1.5px solid ${prefilled ? COLORS.green+"50" : "#D0D8E4"}`, borderRadius:7, fontSize:13, fontFamily:"inherit", background:prefilled ? "#F0FAF4" : "#fff", color:COLORS.navy, boxSizing:"border-box" };
                return (
                  <div key={f.key} style={{ marginBottom:12 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:COLORS.slate, marginBottom:3, letterSpacing:.3 }}>
                      {f.label} {prefilled && <span style={{ color:COLORS.green, fontSize:10 }}>●</span>}
                    </label>
                    {f.type==="select" ? (
                      <select value={v} onChange={e=>set(f.key,e.target.value)} style={inputStyle}>
                        <option value="">Select...</option>
                        {(f.options||[]).map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={f.type||"text"} value={v} onChange={e=>set(f.key,e.target.value)} placeholder={f.ph||""} style={inputStyle} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* OTP capture */}
            {cfg.needsOtp && (
              <div style={{ background:"#FEF0E6", borderRadius:10, padding:14, marginTop:8 }}>
                <div style={{ fontWeight:700, color:COLORS.amber, marginBottom:8, fontSize:13 }}>🔐 Aadhaar OTP Verification</div>
                {!otpVerified ? (
                  <div style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
                    <div style={{ flex:1 }}>
                      <label style={{ display:"block", fontSize:11, fontWeight:700, color:COLORS.slate, marginBottom:4 }}>OTP received by worker on Aadhaar-linked mobile</label>
                      <input value={otpValue} onChange={e=>setOtpValue(e.target.value)} placeholder="6-digit OTP" style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #D0D8E4", borderRadius:7, fontSize:15, fontFamily:"inherit", letterSpacing:6, boxSizing:"border-box" }} />
                    </div>
                    <Button onClick={()=>setOtpVerified(true)} variant="secondary" disabled={otpValue.length<4}>✅ Confirm OTP</Button>
                  </div>
                ) : (
                  <div style={{ color:COLORS.green, fontWeight:700, fontSize:13 }}>✅ Aadhaar OTP confirmed — proceed with portal submission.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STEPS TAB ── */}
        {activeTab==="steps" && (
          <div>
            <div style={{ fontWeight:700, color:COLORS.navy, marginBottom:14, fontSize:14 }}>Agent Instructions</div>
            {(cfg.instructions||[]).map((inst,i) => (
              <div key={i} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:"1px solid #F0F4F8", alignItems:"flex-start" }}>
                <div style={{ width:24, height:24, borderRadius:"50%", background:COLORS.saffron, color:"#fff", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>{i+1}</div>
                <span style={{ fontSize:13, color:COLORS.slate, lineHeight:1.6 }}>{inst}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── CAMP CHECKLIST TAB ── */}
        {activeTab==="camp" && cfg.campChecklist && (
          <div>
            <div style={{ fontWeight:700, color:COLORS.navy, marginBottom:14, fontSize:14 }}>🏕️ Camp Day Checklist — Share with Worker</div>
            <div style={{ fontSize:12, color:COLORS.amber, marginBottom:14, background:COLORS.amberLight, borderRadius:8, padding:"8px 12px" }}>
              Share this list with the worker AT LEAST one day before the camp. Missing any item = biometric cannot be done.
            </div>
            {cfg.campChecklist.map((item, i) => (
              <label key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"10px 0", borderBottom:"1px solid #F0F4F8", cursor:"pointer", fontSize:13, color:COLORS.slate }}>
                <input type="checkbox" style={{ marginTop:2, flexShrink:0 }} /> {item}
              </label>
            ))}
            <div style={{ marginTop:16 }}>
              <button onClick={()=>generateSubmissionDocket(app, formData, {})} style={{ background:COLORS.navy, color:"#fff", border:"none", borderRadius:8, padding:"8px 18px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                🖨️ Print Camp Checklist for Worker →
              </button>
            </div>
          </div>
        )}

        {/* ── DOCUMENTS TAB ── */}
        {activeTab==="docs" && (
          <div>
            <div style={{ fontWeight:700, color:COLORS.navy, marginBottom:2, fontSize:14 }}>📎 Documents for {app.scheme.name}</div>
            <div style={{ fontSize:12, color:"#7A8A9A", marginBottom:14 }}>✅ Tick what you have · 🖨️ Click to generate any missing document right now</div>
            {app.scheme.docs.map((d,i) => {
              const dl = d.toLowerCase();
              const isAadhaar  = dl.includes("aadhaar");
              const isBank     = dl.includes("bank") || dl.includes("passbook");
              const isCaste    = dl.includes("caste");
              const isIncome   = dl.includes("income");
              const isAddress  = dl.includes("address") || dl.includes("proof");
              const isRation   = dl.includes("ration");
              const isPhoto    = dl.includes("photo");
              const isAge      = dl.includes("age proof") || dl.includes("birth");
              const isDisable  = dl.includes("disability");
              const isDeath    = dl.includes("death");

              const mk = (type, label, bg, fg, border) => (
                <button key={type} onClick={() => { const doc = generateDocument(type, app.person, null, {}, {}); openPrintWindow(doc.title, doc.content); }}
                  style={{ background:bg, color:fg, border:`1px solid ${border}`, borderRadius:6, padding:"5px 11px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", marginRight:5, marginBottom:4 }}>
                  🖨️ {label}
                </button>
              );

              const guide = (text, bg="#FEF3E2", fg="#7A5000") => (
                <span style={{ background:bg, borderRadius:6, padding:"4px 10px", fontSize:11, color:fg, fontWeight:600, whiteSpace:"nowrap" }}>{text}</span>
              );

              return (
                <div key={i} style={{ padding:"12px 0", borderBottom:"1px solid #F0F4F8" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom: (isAadhaar||isBank||isCaste||isIncome||isAddress||isRation) ? 8 : 0 }}>
                    <input type="checkbox" style={{ flexShrink:0, width:16, height:16, cursor:"pointer" }} />
                    <span style={{ flex:1, fontSize:13, fontWeight:700, color:COLORS.navy }}>{d}</span>
                    {isPhoto && guide("📷 2 passport-size photos — taken at camp or local studio")}
                    {isAge && guide("📋 Birth cert from Panchayat/Municipal office, or school record")}
                    {isDisable && guide("🏥 CMO Certificate — District Hospital / Govt Hospital only")}
                    {isDeath && guide("📋 Death certificate from Panchayat/Municipal office")}
                  </div>
                  <div style={{ paddingLeft:26, display:"flex", flexWrap:"wrap", gap:0 }}>
                    {isAadhaar && (<>
                      {mk("seva_kendra_docket",    "Seva Kendra Docket", "#EAF0FA", "#0D2240", "#B0C4E0")}
                      {mk("appointment_cheatsheet","Booking Guide",      "#EAF0FA", "#0D2240", "#B0C4E0")}
                      {mk("employer_address_letter","Address Certificate","#EAF0FA", "#0D2240", "#B0C4E0")}
                    </>)}
                    {isBank && (<>
                      {mk("jan_dhan_prefill",            "Jan Dhan Pre-fill Card", "#E8F5EE", "#1A7A4A", "#A0D4B4")}
                      {mk("bank_name_correction_letter", "Name Correction Letter", "#E8F5EE", "#1A7A4A", "#A0D4B4")}
                    </>)}
                    {isCaste && (<>
                      {mk("bdo_caste_guide",        "BDO Caste Cert Guide",   "#FEF3E2", "#7A5000", "#E8D090")}
                      {mk("employer_address_letter","Address Certificate",     "#FEF3E2", "#7A5000", "#E8D090")}
                    </>)}
                    {isIncome && (<>
                      {mk("bdo_income_guide",       "BDO Income Cert Guide",  "#FEF3E2", "#7A5000", "#E8D090")}
                      {mk("employer_address_letter","Address Certificate",     "#FEF3E2", "#7A5000", "#E8D090")}
                    </>)}
                    {isAddress && !isAadhaar && (
                      mk("employer_address_letter","Employer Address Cert", "#E8F5EE", "#1A7A4A", "#A0D4B4")
                    )}
                    {isRation && (
                      mk("ration_card_guide","Ration Card Guide", "#F3E8FF", "#5A1A7A", "#C0A0E0")
                    )}
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop:14, background:"#F0F4F8", borderRadius:8, padding:"10px 12px", fontSize:12, color:COLORS.slate }}>
              💡 All generators also available in the <strong>📄 Docs tab</strong> at the top — with person selector for family members.
            </div>
          </div>
        )}
      </div>

      {/* Ack number + submit */}
      <div style={{ background:"#fff", border:"1px solid #E8EDF3", borderRadius:12, padding:16 }}>
        <div style={{ fontWeight:700, color:COLORS.navy, marginBottom:10, fontSize:13 }}>📨 Record Submission</div>
        <div style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
          <div style={{ flex:1 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:COLORS.slate, marginBottom:4 }}>
              Acknowledgement / Reference / Policy Number
            </label>
            <input value={ackNumber} onChange={e=>setAckNumber(e.target.value)} placeholder="Enter Ack / Policy / PRAN / Application ID" style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${ackNumber ? COLORS.green : "#D0D8E4"}`, borderRadius:8, fontSize:13, fontFamily:"inherit", boxSizing:"border-box" }} />
          </div>
          <Button onClick={() => { if(ackNumber.trim()) { onSubmitted(app.ref, ackNumber.trim()); setSubmittedDone(true); } }} variant="primary" disabled={!ackNumber.trim()}>
            ✅ Mark Submitted
          </Button>
        </div>
        {(!cfg.needsOtp || otpVerified) ? null : (
          <div style={{ fontSize:11, color:COLORS.amber, marginTop:8 }}>⚠️ Confirm Aadhaar OTP above before marking submitted.</div>
        )}
      </div>
    </div>
  );
}

// ─── AGENT CONSOLE ────────────────────────────────────────────────────────────
function AgentConsole({ applications, onUpdateStatus }) {
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(null);
  const [langMsg, setLangMsg] = useState("bn");
  const [docStatus, setDocStatus] = useState({});

  // Handle submission done
  const handleSubmitted = (ref, ackNumber) => {
    onUpdateStatus(ref, "Submitted");
    setSubmitting(null);
    setSelected(null);
  };

  // Submission console
  if (submitting) {
    const app = applications.find(a => a.ref === submitting);
    if (!app) { setSubmitting(null); return null; }
    return <SubmissionConsole app={app} onBack={() => setSubmitting(null)} onSubmitted={handleSubmitted} />;
  }

  // Case detail view
  if (selected) {
    const app = applications.find(a => a.ref === selected);
    if (!app) { setSelected(null); return null; }
    const nextStatus = STATUSES[Math.min(STATUSES.indexOf(app.status) + 1, STATUSES.length - 1)];
    const msgFn = app.status === "Ready to Submit" ? MSG.submitted : MSG.created;
    const sampleMsg = msgFn[langMsg](app.ref, app.scheme.name, "ACK-" + Math.floor(Math.random()*99999));
    const schemeHasCfg = !!SUBMISSION_CFG[app.scheme.id];

    const toggleDoc = (ref, doc, approved) => {
      setDocStatus(p => ({ ...p, [`${ref}:${doc}`]: approved }));
    };

    return (
      <div>
        <BackButton onClick={() => setSelected(null)} label="Back to Pipeline" />
        <h3 style={{ color:COLORS.navy, marginBottom:4 }}>{app.scheme.icon} {app.scheme.fullName}</h3>
        <div style={{ color:"#7A8A9A", fontSize:13, marginBottom:16 }}>Ref: {app.ref} · {app.person.name} ({app.person.relation})</div>

        {/* Status pipeline */}
        <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
          {STATUSES.map((s, i) => (
            <div key={s} style={{ padding:"4px 10px", borderRadius:20, fontSize:10, fontWeight:700, background:s===app.status ? STATUS_COLORS[s] : "#F0F4F8", color:s===app.status ? "#fff" : "#A0AABB" }}>{i+1}. {s}</div>
          ))}
        </div>

        {/* Documents */}
        <Card style={{ marginBottom:16 }}>
          <div style={{ fontWeight:700, color:COLORS.navy, marginBottom:12 }}>📋 Documents</div>
          {app.scheme.docs.map(d => {
            const key = `${app.ref}:${d}`;
            const st = docStatus[key];
            return (
              <div key={d} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #F0F4F8" }}>
                <div>
                  <div style={{ fontSize:13, color:COLORS.slate }}>{d}</div>
                  {st !== undefined && <div style={{ fontSize:10, color:st ? COLORS.green : COLORS.red, fontWeight:700 }}>{st ? "✅ Approved" : "❌ Rejected"}</div>}
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={() => toggleDoc(app.ref, d, true)} style={{ padding:"3px 9px", borderRadius:5, border:"none", background:st===true ? COLORS.green : "#E8F5EE", color:st===true ? "#fff" : COLORS.green, fontSize:11, cursor:"pointer", fontWeight:700 }}>✅</button>
                  <button onClick={() => toggleDoc(app.ref, d, false)} style={{ padding:"3px 9px", borderRadius:5, border:"none", background:st===false ? COLORS.red : "#FADBD8", color:st===false ? "#fff" : COLORS.red, fontSize:11, cursor:"pointer", fontWeight:700 }}>❌</button>
                </div>
              </div>
            );
          })}
        </Card>

        {/* Worker message */}
        <Card style={{ marginBottom:16, background:"#F8F5FF" }}>
          <div style={{ fontWeight:700, color:COLORS.navy, marginBottom:10 }}>💬 Worker Message</div>
          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
            {["bn","hi","en"].map(l => (
              <button key={l} onClick={() => setLangMsg(l)} style={{ padding:"4px 12px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"inherit", background:langMsg===l ? COLORS.saffron : COLORS.mist, color:langMsg===l ? "#fff" : COLORS.slate }}>
                {l==="bn" ? "বাংলা" : l==="hi" ? "हिंदी" : "English"}
              </button>
            ))}
          </div>
          <div style={{ background:"#fff", borderRadius:8, padding:12, fontSize:13, color:COLORS.slate, border:"1px solid #E8EDF3" }}>{sampleMsg}</div>
          <div style={{ display:"flex", gap:8, marginTop:10 }}>
            <Button variant="secondary" size="sm">📲 Send WhatsApp</Button>
            <Button variant="subtle" size="sm">💬 Send SMS</Button>
          </div>
        </Card>

        {/* Actions */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {app.status === "Ready to Submit" && schemeHasCfg && (
            <Button onClick={() => setSubmitting(app.ref)} variant="primary">
              🚀 Open Submission Console
            </Button>
          )}
          {app.status === "Ready to Submit" && !schemeHasCfg && (
            <Button onClick={() => { onUpdateStatus(app.ref, "Submitted"); setSelected(null); }} variant="primary">
              ▶ Mark as Submitted
            </Button>
          )}
          {app.status !== "Completed" && app.status !== "Ready to Submit" && (
            <Button onClick={() => { onUpdateStatus(app.ref, nextStatus); setSelected(null); }} variant="primary">
              ▶ Move to: {nextStatus}
            </Button>
          )}
          {app.status === "Submitted" && (
            <Button onClick={() => { onUpdateStatus(app.ref, "Completed"); setSelected(null); }} variant="primary">
              🏆 Mark Completed
            </Button>
          )}
          <button onClick={() => generateSubmissionDocket(app, {}, {})} style={{ padding:"9px 16px", background:COLORS.mist, color:COLORS.slate, border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            🖨️ Print Docket
          </button>
        </div>
      </div>
    );
  }

  // Pipeline list view
  const readyToSubmit = applications.filter(a => a.status === "Ready to Submit");

  return (
    <div>
      <h2 style={{ fontSize:20, color:COLORS.navy, marginBottom:4 }}>🗂️ Agent Pipeline</h2>
      <p style={{ color:"#7A8A9A", fontSize:13, marginBottom:16 }}>All applications — click to review and submit</p>

      {/* Ready to submit highlight */}
      {readyToSubmit.length > 0 && (
        <div style={{ background:"#F3E8FF", border:"1.5px solid #7B2CBF40", borderRadius:12, padding:14, marginBottom:20 }}>
          <div style={{ fontWeight:700, color:"#7B2CBF", marginBottom:10, fontSize:13 }}>🚀 Ready to Submit — {readyToSubmit.length} case{readyToSubmit.length>1?"s":""}</div>
          {readyToSubmit.map(app => (
            <div key={app.ref} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#fff", borderRadius:8, padding:"10px 12px", marginBottom:6, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
              <div>
                <div style={{ fontWeight:700, color:COLORS.navy, fontSize:13 }}>{app.scheme.icon} {app.scheme.name} — {app.person.name}</div>
                <div style={{ fontSize:11, color:"#7A8A9A" }}>Ref: {app.ref}</div>
              </div>
              <button onClick={() => setSubmitting(app.ref)} style={{ background:"#7B2CBF", color:"#fff", border:"none", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                🚀 Submit →
              </button>
            </div>
          ))}
        </div>
      )}

      {applications.length === 0 && (
        <div style={{ textAlign:"center", padding:40, color:"#7A8A9A" }}>
          <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
          No applications yet. Workers will appear here after applying.
        </div>
      )}

      {STATUSES.map(status => {
        const group = applications.filter(a => a.status === status);
        if (!group.length) return null;
        return (
          <div key={status} style={{ marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:STATUS_COLORS[status] }} />
              <span style={{ fontWeight:700, color:COLORS.navy }}>{status}</span>
              <Badge label={group.length} color={STATUS_COLORS[status]} />
            </div>
            {group.map(app => (
              <Card key={app.ref} onClick={() => setSelected(app.ref)} style={{ marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
                <div>
                  <div style={{ fontWeight:700, color:COLORS.navy, fontSize:13 }}>{app.scheme.icon} {app.scheme.name} — {app.person.name}</div>
                  <div style={{ fontSize:11, color:"#7A8A9A" }}>Ref: {app.ref} · {app.person.relation}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <Badge label={status} color={STATUS_COLORS[status]} />
                  <span style={{ color:COLORS.saffron }}>›</span>
                </div>
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── DOCUMENTS HUB ───────────────────────────────────────────────────────────
function DocumentsHub({ household, onBack, showBackButton }) {
  const worker = household?.worker || {};
  const members = household?.members || [];
  const [selectedPerson, setSelectedPerson] = useState("worker");

  const allPeople = [
    { key: "worker", label: `👷 ${worker.name || "Worker"}`, data: worker },
    ...members.map((m, i) => ({
      key: `member_${i}`,
      label: `👤 ${m.name || m.relation} (${m.relation})`,
      data: m,
    })),
  ];

  const personData = allPeople.find(p => p.key === selectedPerson)?.data || worker;

  const DOC_GROUPS = [
    {
      group: "🪪 Aadhaar Documents",
      bg: "#EAF0FA", border: "#0D2240",
      docs: [
        { type: "seva_kendra_docket",     icon: "🏛️", label: "Seva Kendra Visit Docket",     desc: "Print before visiting Asansol ASK — checklist, address, fee, what to say" },
        { type: "appointment_cheatsheet", icon: "📅", label: "Appointment Booking Guide",     desc: "Step-by-step guide for bookappointment.uidai.gov.in" },
        { type: "employer_address_letter",icon: "🏭", label: "Employer Address Certificate",  desc: "MB Sponge letterhead certifying WB address — for Aadhaar address update" },
      ],
    },
    {
      group: "🏦 Bank Documents",
      bg: "#E8F5EE", border: "#1A7A4A",
      docs: [
        { type: "bank_name_correction_letter", icon: "✏️", label: "Name Correction Letter",   desc: "Letter to branch manager to fix name mismatch between Aadhaar and bank records" },
        { type: "jan_dhan_prefill",            icon: "🏦", label: "Jan Dhan Pre-filled Card", desc: "Pre-filled details card to carry to bank for zero-balance account opening" },
      ],
    },
    {
      group: "📝 Declaration Letters",
      bg: "#FEF3E2", border: "#E8690B",
      docs: [
        { type: "name_variance_letter", icon: "📄", label: "Name Variance Declaration", desc: "For married women — explains maiden name on Aadhaar vs current name mismatch" },
      ],
    },
    {
      group: "🏛️ BDO / Government Office Guides",
      bg: "#F3E8FF", border: "#5A1A7A",
      docs: [
        { type: "bdo_caste_guide",   icon: "📜", label: "Caste Certificate Guide",   desc: "Step-by-step for BDO office — docs needed, what to say, how long it takes" },
        { type: "bdo_income_guide",  icon: "💰", label: "Income Certificate Guide",  desc: "BDO office + online edistrict.wb.gov.in — steps, documents, ₹30 fee" },
        { type: "ration_card_guide", icon: "🗂️", label: "Ration Card Application",   desc: "Block Food Office or wbpds.wb.gov.in — how to apply or add family member" },
      ],
    },
  ];

  const generate = (type) => {
    const doc = generateDocument(type, worker, personData.relation ? personData : null, {}, {});
    if (doc) openPrintWindow(doc.title, doc.content);
  };

  return (
    <div>
      {showBackButton && onBack && <BackButton onClick={onBack} label="Back" />}
      <h2 style={{ fontSize: 20, color: COLORS.navy, marginBottom: 4 }}>📄 Document Generator</h2>
      <p style={{ color: "#7A8A9A", fontSize: 13, marginBottom: 20 }}>Make any letter, docket or cheatsheet on demand — without going through Doc Health</p>

      {!worker.name && (
        <div style={{ background: "#FEF3E2", border: `1px solid ${COLORS.amber}40`, borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13, color: COLORS.amber }}>
          ⚠️ No worker registered yet — documents will have blank name/account fields. Register a worker first for fully pre-filled output.
        </div>
      )}

      {allPeople.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.slate, marginBottom: 8 }}>Generate for:</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {allPeople.map(p => (
              <button key={p.key} onClick={() => setSelectedPerson(p.key)} style={{
                padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${selectedPerson === p.key ? COLORS.saffron : "#D0D8E4"}`,
                background: selectedPerson === p.key ? "#FEF3E2" : "#fff",
                color: selectedPerson === p.key ? COLORS.saffron : COLORS.slate,
                fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              }}>{p.label}</button>
            ))}
          </div>
        </div>
      )}

      {worker.name && (
        <div style={{ background: COLORS.mist, borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: COLORS.slate, display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
          <span>👤 <strong>{personData.name || worker.name}</strong></span>
          {worker.phone && <span>📱 {worker.phone}</span>}
          {(worker.aadhaarLast4) && <span>🪪 ...{worker.aadhaarLast4}</span>}
          {worker.bankName && <span>🏦 {worker.bankName}</span>}
          {worker.bankAccountNo && <span>A/C: ...{String(worker.bankAccountNo).slice(-4)}</span>}
        </div>
      )}

      {DOC_GROUPS.map(g => (
        <div key={g.group} style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 800, color: COLORS.navy, fontSize: 14, marginBottom: 10 }}>{g.group}</div>
          {g.docs.map(doc => (
            <div key={doc.type} style={{ background: g.bg, borderLeft: `4px solid ${g.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: COLORS.navy, fontSize: 13, marginBottom: 2 }}>{doc.icon} {doc.label}</div>
                <div style={{ fontSize: 12, color: "#5A6A7A", lineHeight: 1.5 }}>{doc.desc}</div>
              </div>
              <button onClick={() => generate(doc.type)} style={{ background: COLORS.navy, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                🖨️ Print
              </button>
            </div>
          ))}
        </div>
      ))}

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 800, color: COLORS.navy, fontSize: 14, marginBottom: 4 }}>📋 Scheme Submission Dockets</div>
        <div style={{ fontSize: 12, color: "#7A8A9A", marginBottom: 12 }}>Generate blank dockets for any scheme — useful during camps or walk-ins.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {Object.entries(SUBMISSION_CFG).map(([schemeId, cfg]) => {
            const scheme = [...SCHEMES, ...NEW_SCHEMES].find(s => s.id === schemeId);
            if (!scheme) return null;
            return (
              <button key={schemeId} onClick={() => {
                const fakeApp = {
                  scheme: { ...scheme, docs: scheme.docs || [] },
                  person: { name: personData.name || worker.name || "[Name]", relation: personData.relation || "Worker", phone: worker.phone || "", bankName: worker.bankName || "", aadhaarLast4: worker.aadhaarLast4 || "", caste: personData.caste || worker.caste || "" },
                  ref: "CAMP-" + Math.floor(Math.random()*9999),
                };
                const fill = {};
                (cfg.fields || []).forEach(f => {
                  if (f.src === "person.name")         fill[f.key] = fakeApp.person.name;
                  if (f.src === "person.phone")        fill[f.key] = worker.phone || "";
                  if (f.src === "person.bankName")     fill[f.key] = worker.bankName || "";
                  if (f.src === "person.aadhaarLast4") fill[f.key] = worker.aadhaarLast4 || "";
                  if (f.src === "person.caste")        fill[f.key] = fakeApp.person.caste;
                });
                generateSubmissionDocket(fakeApp, fill, { welfareOfficer: "Welfare Officer / Jan Setu Pratinidhi" });
              }} style={{ background: "#FAFBFD", border: "1.5px solid #E0E8F0", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: COLORS.navyMid, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{scheme.icon}</span>
                <span style={{ flex: 1 }}>{scheme.name}</span>
                <span style={{ color: COLORS.saffron, fontSize: 14 }}>🖨️</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function AdminDashboard({ applications }) {
  const stats = {
    total: applications.length,
    completed: applications.filter(a => a.status === "Completed").length,
    submitted: applications.filter(a => ["Submitted","Completed"].includes(a.status)).length,
    pending: applications.filter(a => ["Docs Pending","Created"].includes(a.status)).length,
  };

  const schemeCount = {};
  applications.forEach(a => {
    schemeCount[a.scheme.name] = (schemeCount[a.scheme.name] || 0) + 1;
  });

  return (
    <div>
      <h2 style={{ fontSize: 20, color: COLORS.navy, marginBottom: 4 }}>📊 Admin Dashboard</h2>
      <p style={{ color: "#7A8A9A", fontSize: 13, marginBottom: 20 }}>MB Sponge & Power — Jan Setu Pilot Overview</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Applications", value: stats.total, color: COLORS.navy, icon: "📋" },
          { label: "Submitted", value: stats.submitted, color: COLORS.green, icon: "✅" },
          { label: "Pending Docs", value: stats.pending, color: COLORS.amber, icon: "⏳" },
          { label: "Completed", value: stats.completed, color: COLORS.saffron, icon: "🏆" },
        ].map(s => (
          <Card key={s.label} style={{ textAlign: "center", borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#7A8A9A", fontWeight: 600 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 14 }}>📊 Scheme-wise Breakdown</div>
        {Object.entries(schemeCount).length === 0 && <div style={{ color: "#7A8A9A", fontSize: 13 }}>No data yet.</div>}
        {Object.entries(schemeCount).sort((a,b) => b[1]-a[1]).map(([name, count]) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 120, fontSize: 12, color: COLORS.slate, fontWeight: 600 }}>{name}</div>
            <div style={{ flex: 1, height: 16, background: "#F0F4F8", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, count * 25)}%`, height: "100%", background: COLORS.saffron, borderRadius: 8 }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy, width: 20 }}>{count}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function JanSetuApp() {
  const [screen, setScreen] = useState("verify");
  const [intent, setIntent] = useState(null); // "schemes" | "documents"
  const [verifiedWorker, setVerifiedWorker] = useState(null);
  const [household, setHousehold] = useState(null);
  const [eligibleResults, setEligibleResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [applications, setApplications] = useState([]);
  const [lang, setLang] = useState("bn");
  const [activeTab, setActiveTab] = useState("worker"); // worker, agent, admin
  const [selectedDocCfg, setSelectedDocCfg] = useState(null);
  const [docTabScreen, setDocTabScreen] = useState("list"); // list | detail
  const [docTabDocCfg, setDocTabDocCfg] = useState(null);
  // Global document vault — upload once, reuse anywhere across all doc applications
  const [docVault, setDocVault] = useState({}); // sharedKey -> { name, size, type, preview }
  const addToVault = (sharedKey, fileData) => setDocVault(prev => ({ ...prev, [sharedKey]: fileData }));

  const SCHEME_STEPS = ["Verify", "Intent", "Household", "Questions", "Doc Health", "Schemes", "Apply"];
  const schemeStepMap = { verify: 0, intent: 1, household: 2, questionnaire: 3, dochealth: 4, schemes: 5, application: 6 };
  const DOC_STEPS = ["Verify", "Intent", "Select Doc", "Fill & Print"];
  const docStepMap = { verify: 0, intent: 1, docmode: 2, docdetail: 3 };
  const STEPS = intent === "documents" ? DOC_STEPS : SCHEME_STEPS;
  const stepMap = intent === "documents" ? docStepMap : schemeStepMap;
  const currentStep = activeTab === "worker" ? (stepMap[screen] ?? 0) : null;

  const handleVerified = (data) => {
    setVerifiedWorker({ ...data, phone: data.phone });
    setScreen("intent");
    saveWorker({ id: data.id || crypto.randomUUID(), mobile: data.phone, aadhaarLast4: data.aadhaar?.slice(-4), name: data.name }).catch(console.error);
  };

  const handleHousehold = (hh) => {
    setHousehold(hh);
    if (intent === "documents") {
      setScreen("docmode");
    } else {
      setScreen("questionnaire");
    }
  };

  const handleQuestionnaire = (q) => {
    const fullHousehold = { ...household, ...q };
    setHousehold(fullHousehold);
    setScreen("dochealth");
  };

  const handleDocHealthProceed = () => {
    const results = getEligibleSchemes(household);
    setEligibleResults(results);
    setScreen("schemes");
  };

  const handleApply = (result) => {
    setSelectedResult(result);
    setScreen("application");
  };

  const handleSubmitApp = (app) => {
    setApplications(prev => [...prev, app]);
  };

  const handleUpdateStatus = (ref, newStatus) => {
    setApplications(prev => prev.map(a => a.ref === ref ? { ...a, status: newStatus } : a));
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "100vh", background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyMid} 100%)` }}>
      {/* HEADER */}
      <div style={{ background: COLORS.navy, padding: "0 20px", boxShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: COLORS.saffron, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🌟</div>
            <div>
              <div style={{ fontWeight: 900, color: "#fff", fontSize: 16, letterSpacing: 0.5 }}>JAN SETU</div>
              <div style={{ fontSize: 10, color: COLORS.saffronLight, letterSpacing: 1 }}>MB SPONGE & POWER · JAMURIA</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["bn","hi","en"].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{ padding: "4px 10px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, background: lang === l ? COLORS.saffron : "rgba(255,255,255,0.1)", color: "#fff" }}>
                {l === "bn" ? "বাং" : l === "hi" ? "हिं" : "EN"}
              </button>
            ))}
          </div>
        </div>

        {/* TABS */}
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {[["worker","👷 Worker"],["agent","🗂️ Agent"],["docs","📄 Docs"],["admin","📊 Admin"]].map(([t, label]) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              flex: 1, padding: "10px 0", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
              background: activeTab === t ? "rgba(232,105,11,0.2)" : "transparent",
              color: activeTab === t ? COLORS.saffronLight : "rgba(255,255,255,0.5)",
              borderBottom: activeTab === t ? `2px solid ${COLORS.saffron}` : "2px solid transparent",
              transition: "all 0.15s"
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}>

          {activeTab === "worker" && (
            <>
              {currentStep !== null && screen !== "application" && (
                <ProgressBar
                  step={currentStep}
                  steps={STEPS}
                  onStepClick={(i) => {
                    const stepScreens = intent === "documents"
                      ? ["verify", "intent", "household", "docmode"]
                      : ["verify", "intent", "household", "questionnaire", "dochealth", "schemes"];
                    if (stepScreens[i]) setScreen(stepScreens[i]);
                  }}
                />
              )}
              {screen === "verify" && <VerifyScreen onVerified={handleVerified} />}
              {screen === "intent" && (
                <IntentScreen
                  worker={verifiedWorker}
                  onSchemes={() => { setIntent("schemes"); setScreen("household"); }}
                  onDocuments={() => { setIntent("documents"); setScreen("docmode"); }}
                />
              )}
              {screen === "household" && (
                <HouseholdScreen
                  worker={verifiedWorker}
                  onComplete={handleHousehold}
                  onBack={() => setScreen("intent")}
                />
              )}
              {screen === "docmode" && (
                <DocMakeScreen
                  worker={verifiedWorker}
                  onSelectDoc={(docCfg) => { setSelectedDocCfg(docCfg); setScreen("docdetail"); }}
                  onBack={() => setScreen("intent")}
                />
              )}
              {screen === "docdetail" && selectedDocCfg && (
                <DocDetailScreen
                  docCfg={selectedDocCfg}
                  worker={verifiedWorker}
                  docVault={docVault}
                  addToVault={addToVault}
                  onBack={() => setScreen("docmode")}
                />
              )}
              {screen === "questionnaire" && (
                <QuestionnaireScreen
                  household={household}
                  onComplete={handleQuestionnaire}
                  onBack={() => setScreen("household")}
                />
              )}
              {screen === "dochealth" && (
                <DocHealthScreen
                  household={household}
                  questionnaire={household}
                  appSettings={{ welfareOfficer: "Welfare Officer / Jan Setu Pratinidhi" }}
                  onProceed={handleDocHealthProceed}
                  onBack={() => setScreen("questionnaire")}
                />
              )}
              {screen === "schemes" && (
                <SchemesScreen
                  results={eligibleResults}
                  lang={lang}
                  onApply={handleApply}
                  onBack={() => setScreen("questionnaire")}
                />
              )}
              {screen === "application" && selectedResult && (
                <ApplicationScreen
                  result={selectedResult}
                  workerRef={verifiedWorker}
                  lang={lang}
                  onBack={() => setScreen("schemes")}
                  onSubmitApp={handleSubmitApp}
                />
              )}
            </>
          )}

          {activeTab === "agent" && (
            <AgentConsole applications={applications} onUpdateStatus={handleUpdateStatus} />
          )}

          {activeTab === "docs" && (
            docTabScreen === "detail" && docTabDocCfg ? (
              <DocDetailScreen
                docCfg={docTabDocCfg}
                worker={verifiedWorker || {}}
                docVault={docVault}
                addToVault={addToVault}
                onBack={() => { setDocTabScreen("list"); setDocTabDocCfg(null); }}
              />
            ) : (
              <DocMakeScreen
                worker={verifiedWorker || {}}
                onSelectDoc={(cfg) => { setDocTabDocCfg(cfg); setDocTabScreen("detail"); }}
                onBack={null}
              />
            )
          )}
          {activeTab === "admin" && (
            <AdminDashboard applications={applications} />
          )}
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: "center", marginTop: 20, color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
          Powered by Jan Setu · Jaagruk Bharat · v1.0 MVP
        </div>
      </div>
    </div>
  );
}
