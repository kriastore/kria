// DTDC zone-based shipping calculation from Pune (411033)
// Uses India Post API for pincode validation, zone-based rates for shipping
// Supports international shipping by continent

export type ShippingResult = {
  available: boolean;
  charge: number;
  estimatedDays: string;
  courierPartner: string;
  zone: string;
  message?: string;
};

export type PincodeInfo = {
  pincode: string;
  city: string;
  state: string;
  district: string;
  available: boolean;
};

// Zone-based rates from Pune (411033) via DTDC
// Rates include fuel surcharge (~20%). GST (18%) applied on top.
type ZoneDef = { rate: number; perItem: number; days: string; label: string };

const ZONES: Record<string, ZoneDef> = {
  state:  { rate: 50,  perItem: 15, days: "2-4", label: "Maharashtra" },
  metro:  { rate: 65,  perItem: 20, days: "3-5", label: "Metro" },
  zone_a: { rate: 75,  perItem: 20, days: "4-6", label: "Regional" },
  zone_b: { rate: 85,  perItem: 25, days: "5-7", label: "North India" },
  zone_c: { rate: 80,  perItem: 20, days: "5-7", label: "South India" },
  zone_d: { rate: 90,  perItem: 25, days: "6-8", label: "East India" },
  oda:    { rate: 130, perItem: 30, days: "8-12", label: "Remote / ODA" },
  intl_asia:       { rate: 350,  perItem: 100, days: "7-14",  label: "Asia" },
  intl_europe:     { rate: 450,  perItem: 150, days: "10-18", label: "Europe" },
  intl_namerica:   { rate: 500,  perItem: 180, days: "10-18", label: "North America" },
  intl_samerica:   { rate: 550,  perItem: 200, days: "12-20", label: "South America" },
  intl_africa:     { rate: 500,  perItem: 160, days: "10-18", label: "Africa" },
  intl_oceania:    { rate: 480,  perItem: 170, days: "10-18", label: "Australia / Oceania" },
};

// Country to continent mapping
const COUNTRY_CONTINENT: Record<string, string> = {
  india: "asia",
  // Asia
  afghanistan: "asia", armenia: "asia", azerbaijan: "asia", bahrain: "asia",
  bangladesh: "asia", bhutan: "asia", brunei: "asia", cambodia: "asia",
  china: "asia", cyprus: "asia", georgia: "asia", "hong kong": "asia",
  indonesia: "asia", iran: "asia", iraq: "asia", israel: "asia",
  japan: "asia", jordan: "asia", kazakhstan: "asia", kuwait: "asia",
  kyrgyzstan: "asia", laos: "asia", lebanon: "asia", malaysia: "asia",
  maldives: "asia", mongolia: "asia", myanmar: "asia", nepal: "asia",
  oman: "asia", pakistan: "asia", philippines: "asia", qatar: "asia",
  "saudi arabia": "asia", singapore: "asia", "south korea": "asia",
  "sri lanka": "asia", syria: "asia", taiwan: "asia", tajikistan: "asia",
  thailand: "asia", timor: "asia", turkey: "asia", turkmenistan: "asia",
  "united arab emirates": "asia", uzbekistan: "asia", vietnam: "asia", yemen: "asia",
  // Europe
  albania: "europe", andorra: "europe", austria: "europe", belarus: "europe",
  belgium: "europe", "bosnia and herzegovina": "europe", bulgaria: "europe",
  croatia: "europe", "czech republic": "europe", denmark: "europe",
  estonia: "europe", finland: "europe", france: "europe", germany: "europe",
  greece: "europe", hungary: "europe", iceland: "europe", ireland: "europe",
  italy: "europe", kosovo: "europe", latvia: "europe", liechtenstein: "europe",
  lithuania: "europe", luxembourg: "europe", malta: "europe", moldova: "europe",
  monaco: "europe", montenegro: "europe", netherlands: "europe",
  "north macedonia": "europe", norway: "europe", poland: "europe",
  portugal: "europe", romania: "europe", russia: "europe",
  "san marino": "europe", serbia: "europe", slovakia: "europe",
  slovenia: "europe", spain: "europe", sweden: "europe", switzerland: "europe",
  ukraine: "europe", "united kingdom": "europe", "uk": "europe",
  "vatican city": "europe",
  // North America
  "antigua and barbuda": "namerica", bahamas: "namerica", barbados: "namerica",
  belize: "namerica", canada: "namerica", "costa rica": "namerica", cuba: "namerica",
  dominica: "namerica", "dominican republic": "namerica", "el salvador": "namerica",
  grenada: "namerica", guatemala: "namerica", haiti: "namerica", honduras: "namerica",
  jamaica: "namerica", mexico: "namerica", nicaragua: "namerica", panama: "namerica",
  "saint lucia": "namerica", "trinidad and tobago": "namerica",
  "united states": "namerica", "usa": "namerica",
  // South America
  argentina: "samerica", bolivia: "samerica", brazil: "samerica", chile: "samerica",
  colombia: "samerica", ecuador: "samerica", guyana: "samerica", paraguay: "samerica",
  peru: "samerica", suriname: "samerica", uruguay: "samerica", venezuela: "samerica",
  // Africa
  algeria: "africa", angola: "africa", botswana: "africa", burkina: "africa",
  burundi: "africa", cameroon: "africa", "cape verde": "africa",
  "central african republic": "africa", chad: "africa", comoros: "africa",
  "congo": "africa", "drc": "africa", djibouti: "africa", egypt: "africa",
  "equatorial guinea": "africa", eritrea: "africa", ethiopia: "africa",
  gabon: "africa", gambia: "africa", ghana: "africa", guinea: "africa",
  "ivory coast": "africa", kenya: "africa", lesotho: "africa", liberia: "africa",
  libya: "africa", madagascar: "africa", malawi: "africa", mali: "africa",
  mauritania: "africa", mauritius: "africa", morocco: "africa", mozambique: "africa",
  namibia: "africa", niger: "africa", nigeria: "africa", rwanda: "africa",
  "sao tome": "africa", senegal: "africa", seychelles: "africa",
  "sierra leone": "africa", somalia: "africa", "south africa": "africa",
  "south sudan": "africa", sudan: "africa", swaziland: "africa", tanzania: "africa",
  togo: "africa", tunisia: "africa", uganda: "africa", zambia: "africa",
  zimbabwe: "africa",
  // Oceania
  australia: "oceania", fiji: "oceania", kiribati: "oceania",
  "marshall islands": "oceania", micronesia: "oceania", nauru: "oceania",
  "new zealand": "oceania", palau: "oceania", "papua new guinea": "oceania",
  samoa: "oceania", "solomon islands": "oceania", tonga: "oceania",
  tuvalu: "oceania", vanuatu: "oceania",
};

// Metro pincodes (3-digit prefix)
const METRO_PREFIXES = new Set([
  "110", // Delhi
  "400", // Mumbai
  "500", // Hyderabad
  "560", // Bangalore
  "600", // Chennai
  "700", // Kolkata
]);

// ODA pincodes (3-digit prefix)
const ODA_PREFIXES = new Set([
  "790", "791", "792", "793", "794", "795", "796", "797", "798",
  "180", "181", "182", "183", "184", "185", "186", "187", "188", "189",
  "190", "191", "192", "193", "194",
]);

const MAHARASHTRA_PREFIXES = new Set(["40", "41", "42", "43", "44"]);

const NEIGHBORING_PREFIXES = new Set([
  "36", "37", "38", "39",
  "57", "58", "59",
  "45", "46", "47", "48",
  "49",
]);

const SOUTH_PREFIXES = new Set([
  "51", "52", "53",
  "60", "61", "62", "63",
  "67", "68", "69",
]);

const EAST_PREFIXES = new Set([
  "71", "72",
  "75", "76",
  "80", "81", "82", "83",
]);

const NORTH_PREFIXES = new Set([
  "12", "13",
  "14", "15", "16", "17",
  "20", "21", "22", "23", "24", "25", "26", "27", "28",
  "30", "31", "32", "33", "34",
]);

function getContinentKey(country: string): string {
  const key = country.trim().toLowerCase();
  return COUNTRY_CONTINENT[key] || "intl";
}

export function getZone(pincode: string, country?: string): string {
  // International shipping
  if (country && country.trim().toLowerCase() !== "india") {
    const continent = getContinentKey(country);
    if (continent === "intl") return "intl_asia";
    return `intl_${continent}`;
  }

  // Domestic pincode checks
  const p3 = pincode.slice(0, 3);
  const p2 = pincode.slice(0, 2);

  if (ODA_PREFIXES.has(p3)) return "oda";
  if (p3 === "411") return "state";
  if (METRO_PREFIXES.has(p3)) return "metro";
  if (MAHARASHTRA_PREFIXES.has(p2)) return "state";
  if (NEIGHBORING_PREFIXES.has(p2)) return "zone_a";
  if (SOUTH_PREFIXES.has(p2)) return "zone_c";
  if (EAST_PREFIXES.has(p2)) return "zone_d";
  if (NORTH_PREFIXES.has(p2)) return "zone_b";
  return "zone_b";
}

export async function validatePincode(pincode: string, country?: string): Promise<PincodeInfo> {
  // International: skip India Post API
  if (country && country.trim().toLowerCase() !== "india") {
    return { pincode, city: "", state: "", district: "", available: true };
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();

    if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      return {
        pincode,
        city: po.District || po.Name || "",
        state: po.State || "",
        district: po.District || "",
        available: true,
      };
    }

    return { pincode, city: "", state: "", district: "", available: false };
  } catch {
    return { pincode, city: "", state: "", district: "", available: true };
  }
}

export function calculateShipping(
  totalItems: number,
  orderValue: number,
  pincode: string,
  customZones?: Record<string, { rate: number; perItem: number; days: string; label: string }>,
  freeDeliveryThreshold?: number,
  country?: string
): ShippingResult {
  const zone = getZone(pincode, country);
  const zones = customZones && Object.keys(customZones).length > 0 ? customZones : ZONES;
  const z = zones[zone] || ZONES[zone] || zones["intl_asia"] || ZONES["intl_asia"];

  // Free delivery only applies domestically
  if (country && country.trim().toLowerCase() !== "india") {
    const baseCharge = z.rate + Math.max(0, totalItems - 1) * z.perItem;
    const charge = Math.round(baseCharge * 1.18);
    return {
      available: true,
      charge,
      estimatedDays: z.days,
      courierPartner: "DTDC",
      zone: z.label,
    };
  }

  if (typeof freeDeliveryThreshold === "number" && freeDeliveryThreshold > 0 && orderValue >= freeDeliveryThreshold) {
    return {
      available: true,
      charge: 0,
      estimatedDays: z.days,
      courierPartner: "DTDC",
      zone: z.label,
    };
  }

  const baseCharge = z.rate + Math.max(0, totalItems - 1) * z.perItem;
  const charge = Math.round(baseCharge * 1.18);

  return {
    available: true,
    charge,
    estimatedDays: z.days,
    courierPartner: "DTDC",
    zone: z.label,
  };
}

export async function lookupPincode(pincode: string, country?: string): Promise<{ city: string; state: string } | null> {
  const info = await validatePincode(pincode, country);
  if (info.available && (info.state || country)) {
    return { city: info.city || info.district, state: info.state || country || "" };
  }
  return null;
}
