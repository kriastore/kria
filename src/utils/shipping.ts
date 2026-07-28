// DTDC zone-based shipping calculation from Pune (411033)
// Uses India Post API for pincode validation, zone-based rates for shipping

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
  // North East India
  "790", "791", "792", "793", "794", "795", "796", "797", "798",
  // Jammu & Kashmir / Ladakh
  "180", "181", "182", "183", "184", "185", "186", "187", "188", "189",
  "190", "191", "192", "193", "194",
]);

// Maharashtra sorting districts (2-digit prefix)
const MAHARASHTRA_PREFIXES = new Set([
  "40", "41", "42", "43", "44",
]);

// Neighboring states: Gujarat, Karnataka (non-metro), Telangana (non-metro), Goa, MP, CG
const NEIGHBORING_PREFIXES = new Set([
  "36", "37", "38", "39", // Gujarat
  "57", "58", "59",       // Karnataka (non-Bangalore)
  "45", "46", "47", "48", // Madhya Pradesh
  "49",                   // Chhattisgarh
]);

// South: Andhra Pradesh, Tamil Nadu (non-metro), Kerala
const SOUTH_PREFIXES = new Set([
  "51", "52", "53",       // Andhra Pradesh
  "60", "61", "62", "63", // Tamil Nadu (non-Chennai)
  "67", "68", "69",       // Kerala
]);

// East: West Bengal (non-metro), Odisha, Bihar, Jharkhand, Assam (non-ODA)
const EAST_PREFIXES = new Set([
  "71", "72",             // West Bengal (non-Kolkata)
  "75", "76",             // Odisha
  "80", "81", "82", "83", // Bihar
]);

// North: Delhi+ (non-metro), UP, Rajasthan, Punjab, Haryana, HP, Uttarakhand
const NORTH_PREFIXES = new Set([
  "12", "13",             // Haryana, Punjab
  "14", "15", "16", "17", // Punjab, HP
  "20", "21", "22", "23", "24", "25", "26", "27", "28", // UP, Uttarakhand
  "30", "31", "32", "33", "34",                         // Rajasthan
]);

function getZone(pincode: string): string {
  const p3 = pincode.slice(0, 3);
  const p2 = pincode.slice(0, 2);

  // ODA check first (most specific remote)
  if (ODA_PREFIXES.has(p3)) return "oda";

  // Pune (same as Maharashtra)
  if (p3 === "411") return "state";

  // Metro
  if (METRO_PREFIXES.has(p3)) return "metro";

  // Maharashtra (same state)
  if (MAHARASHTRA_PREFIXES.has(p2)) return "state";

  // Neighboring states
  if (NEIGHBORING_PREFIXES.has(p2)) return "zone_a";

  // South
  if (SOUTH_PREFIXES.has(p2)) return "zone_c";

  // East
  if (EAST_PREFIXES.has(p2)) return "zone_d";

  // North
  if (NORTH_PREFIXES.has(p2)) return "zone_b";

  // Default: zone_b (national)
  return "zone_b";
}

// Validate pincode via India Post API
export async function validatePincode(pincode: string): Promise<PincodeInfo> {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();

    if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      return {
        pincode,
        city: po.Name || "",
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

// Calculate shipping charge based on zone
// Optionally accepts custom zones and a free delivery threshold from admin settings
export function calculateShipping(
  totalItems: number,
  orderValue: number,
  pincode: string,
  customZones?: Record<string, { rate: number; perItem: number; days: string; label: string }>,
  freeDeliveryThreshold?: number
): ShippingResult {
  const zone = getZone(pincode);
  const zones = customZones && Object.keys(customZones).length > 0 ? customZones : ZONES;
  const z = zones[zone] || ZONES[zone];

  // Free delivery if order value meets the threshold
  if (typeof freeDeliveryThreshold === "number" && freeDeliveryThreshold > 0 && orderValue >= freeDeliveryThreshold) {
    return {
      available: true,
      charge: 0,
      estimatedDays: z.days,
      courierPartner: "DTDC",
      zone: z.label,
    };
  }

  // Flat base rate + per-item charge for additional items
  const baseCharge = z.rate + Math.max(0, totalItems - 1) * z.perItem;

  // GST on shipping (18%)
  const charge = Math.round(baseCharge * 1.18);

  return {
    available: true,
    charge,
    estimatedDays: z.days,
    courierPartner: "DTDC",
    zone: z.label,
  };
}

// Pincode lookup for auto-filling city/state
export async function lookupPincode(pincode: string): Promise<{ city: string; state: string } | null> {
  const info = await validatePincode(pincode);
  if (info.available && info.state) {
    return { city: info.city || info.district, state: info.state };
  }
  return null;
}
