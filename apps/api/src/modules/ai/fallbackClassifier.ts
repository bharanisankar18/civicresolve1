import {
  AIAnalysisOutput,
  ComplaintCategory,
  ComplaintPriority,
  COIMBATORE_POIS,
  ScoreBreakdown,
} from "@civicresolve/shared";
import { haversineDistanceMeters } from "../../utils/haversine";

interface KeywordRule {
  category: ComplaintCategory;
  deptCode: string;
  defaultPriority: ComplaintPriority;
  keywords: string[];
}

const CATEGORY_RULES: KeywordRule[] = [
  {
    category: "POTHOLE",
    deptCode: "ROADS",
    defaultPriority: "HIGH",
    keywords: [
      "pothole",
      "crater",
      "road pit",
      "asphalt cavity",
      "குழி",
      "ரோடு குழி",
      "பள்ளம்",
      "गड्ढा",
      "सड़क का गड्ढा",
      "सड़क में गड्ढा",
    ],
  },
  {
    category: "GARBAGE",
    deptCode: "SANITATION",
    defaultPriority: "MEDIUM",
    keywords: [
      "garbage",
      "trash",
      "waste",
      "rubbish",
      "debris",
      "dump",
      "bin",
      "litter",
      "குப்பை",
      "கழிவு",
      "குப்பைத்தொட்டி",
      "कूड़ा",
      "कचरा",
      "कचरे का ढेर",
    ],
  },
  {
    category: "STREETLIGHT",
    deptCode: "ELECTRICAL",
    defaultPriority: "MEDIUM",
    keywords: [
      "streetlight",
      "street light",
      "lamp",
      "light pole",
      "unlit",
      "dark street",
      "bulb",
      "தெருவிளக்கு",
      "மின்விளக்கு",
      "இருட்டு",
      "விளக்கு எரியவில்லை",
      "स्ट्रीट लाइट",
      "बत्ती",
      "अंधेरा",
      "लाइट खराब",
    ],
  },
  {
    category: "WATER_LEAKAGE",
    deptCode: "WATER_DRAINAGE",
    defaultPriority: "HIGH",
    keywords: [
      "water leak",
      "pipeline burst",
      "pipe leak",
      "drinking water",
      "water main",
      "potable water",
      "தண்ணீர் கசிவு",
      "குடிநீர்",
      "பைப் உடைப்பு",
      "தண்ணீர் வீணாகிறது",
      "पानी का रिसाव",
      "पाइपलाइन",
      "पानी बह रहा है",
    ],
  },
  {
    category: "BAD_ROAD",
    deptCode: "ROADS",
    defaultPriority: "MEDIUM",
    keywords: [
      "bad road",
      "broken road",
      "damaged road",
      "unpaved",
      "bumpy",
      "gravel",
      "surface wear",
      "மோசமான சாலை",
      "சாலை சேதம்",
      "தார் சாலை பழுது",
      "खराब सड़क",
      "टूटी सड़क",
      "सड़क टूटी हुई",
    ],
  },
  {
    category: "DRAINAGE",
    deptCode: "WATER_DRAINAGE",
    defaultPriority: "HIGH",
    keywords: [
      "drainage",
      "sewage",
      "sewer",
      "gutter",
      "manhole",
      "overflowing drain",
      "silt",
      "சாக்கடை",
      "கழிவுநீர் கால்வாய்",
      "சாக்கடை அடைப்பு",
      "மேன்ஹோல்",
      "नाला",
      "सीवर",
      "गंदा पानी",
      "नाली जाम",
    ],
  },
];

const HIGH_SEVERITY_KEYWORDS = [
  "accident",
  "danger",
  "hazard",
  "emergency",
  "school",
  "hospital",
  "electric shock",
  "falling",
  "injury",
  "severe",
  "விபத்து",
  "அபாயம்",
  "அவசரம்",
  "பள்ளி",
  "மருத்துவமனை",
  "காயம்",
  "துயரம்",
  "दुर्घटना",
  "खतरा",
  "आपातकालीन",
  "अस्पताल",
  "स्कूल",
  "गंभीर",
];

/**
 * Resilient Rule-Based Keyword Classifier.
 * Guaranteed to return structured civic analysis when Gemini AI is offline, missing an API key, or times out.
 */
export function classifyWithRules(userText = ""): AIAnalysisOutput {
  const lower = userText.toLowerCase();

  let matchedCategory: ComplaintCategory = "BAD_ROAD";
  let matchedDept = "ROADS";
  let matchedPriority: ComplaintPriority = "MEDIUM";
  let maxKeywordMatches = 0;

  for (const rule of CATEGORY_RULES) {
    let matches = 0;
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        matches++;
      }
    }
    if (matches > maxKeywordMatches) {
      maxKeywordMatches = matches;
      matchedCategory = rule.category;
      matchedDept = rule.deptCode;
      matchedPriority = rule.defaultPriority;
    }
  }

  // Assess urgency & safety hazard based on severity keywords
  let severityScore = 0;
  for (const kw of HIGH_SEVERITY_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      severityScore += 8;
    }
  }

  let urgencyScore = matchedPriority === "HIGH" ? 22 : matchedPriority === "CRITICAL" ? 30 : 14;
  let safetyHazardScore = Math.min(25, 10 + severityScore);

  if (severityScore >= 16) {
    matchedPriority = "CRITICAL";
    urgencyScore = 30;
    safetyHazardScore = 25;
  }

  const title =
    userText.trim().length > 5
      ? userText.trim().slice(0, 80)
      : `${matchedCategory.replace("_", " ")} issue reported`;

  const description =
    userText.trim().length > 10
      ? userText.trim()
      : `Civic issue regarding ${matchedCategory.toLowerCase()} requiring municipal maintenance.`;

  return {
    title,
    description,
    category: matchedCategory,
    priority: matchedPriority,
    urgencyScore,
    safetyHazardScore,
    reasoning: `Categorized as ${matchedCategory} via rule-based keyword detection. Matched municipal department: ${matchedDept}.`,
    suggestedDepartmentCode: matchedDept,
  };
}

/**
 * Computes proximity to sensitive seeded points of interest (Hospitals & Schools)
 */
export function calculatePoiProximity(
  lat: number,
  lng: number,
): {
  score: number;
  nearestPoiName?: string;
  distanceMeters?: number;
} {
  let minDistance = Infinity;
  let nearestPoiName = "";

  for (const poi of COIMBATORE_POIS) {
    const dist = haversineDistanceMeters(lat, lng, poi.lat, poi.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestPoiName = poi.name;
    }
  }

  let score = 0;
  if (minDistance <= 200) {
    score = 25;
  } else if (minDistance <= 500) {
    score = 15;
  } else if (minDistance <= 1000) {
    score = 5;
  }

  return {
    score,
    nearestPoiName: minDistance < 5000 ? nearestPoiName : undefined,
    distanceMeters: minDistance < 5000 ? minDistance : undefined,
  };
}

/**
 * Calculates complete Explainable Impact Score (0-100)
 */
export function calculateImpactScore(params: {
  urgencyScore: number;
  safetyHazardScore: number;
  lat: number;
  lng: number;
  supportCount?: number;
  createdAt?: Date;
}): { impactScore: number; breakdown: ScoreBreakdown } {
  const urgency = isNaN(params.urgencyScore) ? 0 : Math.max(0, params.urgencyScore);
  const safetyHazard = isNaN(params.safetyHazardScore) ? 0 : Math.max(0, params.safetyHazardScore);
  const supportCount = isNaN(params.supportCount ?? 0) ? 0 : Math.max(0, params.supportCount ?? 0);
  const lat = isNaN(params.lat) ? 0 : params.lat;
  const lng = isNaN(params.lng) ? 0 : params.lng;

  const poi = calculatePoiProximity(lat, lng);
  const supportBoost = Math.min(10, supportCount * 2);

  let ageBoost = 0;
  if (params.createdAt && !isNaN(params.createdAt.getTime())) {
    const ageHours = Math.max(0, (Date.now() - params.createdAt.getTime()) / (3600 * 1000));
    ageBoost = Math.min(10, Math.floor(ageHours / 12));
  }

  const total = Math.max(
    0,
    Math.min(100, Math.round(urgency + safetyHazard + poi.score + supportBoost + ageBoost)),
  );

  const breakdown: ScoreBreakdown = {
    urgency,
    safetyHazard,
    poiProximity: poi.score,
    nearestPoiName: poi.nearestPoiName,
    distanceToPoiMeters: poi.distanceMeters,
    supportBoost,
    ageBoost,
    total,
  };

  return {
    impactScore: total,
    breakdown,
  };
}
