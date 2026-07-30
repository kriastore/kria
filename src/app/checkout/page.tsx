"use client";
import React, { useEffect, useRef, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import PriceText from "@/components/PriceText";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  deleteDoc,
  doc as firestoreDoc,
  updateDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { resolvePricing } from "@/utils/pricing";
import { calculateShipping, type ShippingResult } from "@/utils/shipping";
import { useDeliverySettings } from "@/hooks/useDeliverySettings";
import { useCartSidebar } from "@/context/CartSidebarContext";
import ProductImage from "@/components/ProductImage";

type CartItem = {
  docId?: string;
  ID: number | string;
  Quantity: number;
  Size?: string;
  Color?: string;
  ItemNotes?: string;
  UserMail?: string;
  AddedOn?: any;
  isCustomized?: boolean;
  customizationText?: string;
  customPrice?: number;
};

const COUNTRIES = [
  { label: "India", value: "India" },
  { label: "Afghanistan", value: "Afghanistan" },
  { label: "Australia", value: "Australia" },
  { label: "Bangladesh", value: "Bangladesh" },
  { label: "Brazil", value: "Brazil" },
  { label: "Canada", value: "Canada" },
  { label: "China", value: "China" },
  { label: "Egypt", value: "Egypt" },
  { label: "France", value: "France" },
  { label: "Germany", value: "Germany" },
  { label: "Indonesia", value: "Indonesia" },
  { label: "Iran", value: "Iran" },
  { label: "Iraq", value: "Iraq" },
  { label: "Italy", value: "Italy" },
  { label: "Japan", value: "Japan" },
  { label: "Kenya", value: "Kenya" },
  { label: "Malaysia", value: "Malaysia" },
  { label: "Maldives", value: "Maldives" },
  { label: "Nepal", value: "Nepal" },
  { label: "New Zealand", value: "New Zealand" },
  { label: "Nigeria", value: "Nigeria" },
  { label: "Pakistan", value: "Pakistan" },
  { label: "Philippines", value: "Philippines" },
  { label: "Qatar", value: "Qatar" },
  { label: "Russia", value: "Russia" },
  { label: "Saudi Arabia", value: "Saudi Arabia" },
  { label: "Singapore", value: "Singapore" },
  { label: "South Africa", value: "South Africa" },
  { label: "South Korea", value: "South Korea" },
  { label: "Sri Lanka", value: "Sri Lanka" },
  { label: "Thailand", value: "Thailand" },
  { label: "Turkey", value: "Turkey" },
  { label: "UAE", value: "UAE" },
  { label: "United Kingdom", value: "United Kingdom" },
  { label: "United States", value: "United States" },
  { label: "Vietnam", value: "Vietnam" },
];

const PHONE_CODES = [
  { code: "+93", label: "AF +93", country: "Afghanistan" },
  { code: "+355", label: "AL +355", country: "Albania" },
  { code: "+213", label: "DZ +213", country: "Algeria" },
  { code: "+376", label: "AD +376", country: "Andorra" },
  { code: "+244", label: "AO +244", country: "Angola" },
  { code: "+54", label: "AR +54", country: "Argentina" },
  { code: "+374", label: "AM +374", country: "Armenia" },
  { code: "+61", label: "AU +61", country: "Australia" },
  { code: "+43", label: "AT +43", country: "Austria" },
  { code: "+994", label: "AZ +994", country: "Azerbaijan" },
  { code: "+973", label: "BH +973", country: "Bahrain" },
  { code: "+880", label: "BD +880", country: "Bangladesh" },
  { code: "+375", label: "BY +375", country: "Belarus" },
  { code: "+32", label: "BE +32", country: "Belgium" },
  { code: "+501", label: "BZ +501", country: "Belize" },
  { code: "+229", label: "BJ +229", country: "Benin" },
  { code: "+975", label: "BT +975", country: "Bhutan" },
  { code: "+591", label: "BO +591", country: "Bolivia" },
  { code: "+387", label: "BA +387", country: "Bosnia and Herzegovina" },
  { code: "+267", label: "BW +267", country: "Botswana" },
  { code: "+55", label: "BR +55", country: "Brazil" },
  { code: "+673", label: "BN +673", country: "Brunei" },
  { code: "+359", label: "BG +359", country: "Bulgaria" },
  { code: "+226", label: "BF +226", country: "Burkina Faso" },
  { code: "+257", label: "BI +257", country: "Burundi" },
  { code: "+855", label: "KH +855", country: "Cambodia" },
  { code: "+237", label: "CM +237", country: "Cameroon" },
  { code: "+1", label: "CA +1", country: "Canada" },
  { code: "+238", label: "CV +238", country: "Cape Verde" },
  { code: "+235", label: "TD +235", country: "Chad" },
  { code: "+56", label: "CL +56", country: "Chile" },
  { code: "+86", label: "CN +86", country: "China" },
  { code: "+57", label: "CO +57", country: "Colombia" },
  { code: "+269", label: "KM +269", country: "Comoros" },
  { code: "+242", label: "CG +242", country: "Congo" },
  { code: "+506", label: "CR +506", country: "Costa Rica" },
  { code: "+385", label: "HR +385", country: "Croatia" },
  { code: "+53", label: "CU +53", country: "Cuba" },
  { code: "+357", label: "CY +357", country: "Cyprus" },
  { code: "+420", label: "CZ +420", country: "Czech Republic" },
  { code: "+45", label: "DK +45", country: "Denmark" },
  { code: "+253", label: "DJ +253", country: "Djibouti" },
  { code: "+1", label: "DM +1", country: "Dominica" },
  { code: "+1", label: "DO +1", country: "Dominican Republic" },
  { code: "+593", label: "EC +593", country: "Ecuador" },
  { code: "+20", label: "EG +20", country: "Egypt" },
  { code: "+503", label: "SV +503", country: "El Salvador" },
  { code: "+240", label: "GQ +240", country: "Equatorial Guinea" },
  { code: "+291", label: "ER +291", country: "Eritrea" },
  { code: "+372", label: "EE +372", country: "Estonia" },
  { code: "+251", label: "ET +251", country: "Ethiopia" },
  { code: "+679", label: "FJ +679", country: "Fiji" },
  { code: "+358", label: "FI +358", country: "Finland" },
  { code: "+33", label: "FR +33", country: "France" },
  { code: "+241", label: "GA +241", country: "Gabon" },
  { code: "+220", label: "GM +220", country: "Gambia" },
  { code: "+995", label: "GE +995", country: "Georgia" },
  { code: "+49", label: "DE +49", country: "Germany" },
  { code: "+233", label: "GH +233", country: "Ghana" },
  { code: "+30", label: "GR +30", country: "Greece" },
  { code: "+1", label: "GD +1", country: "Grenada" },
  { code: "+502", label: "GT +502", country: "Guatemala" },
  { code: "+224", label: "GN +224", country: "Guinea" },
  { code: "+245", label: "GW +245", country: "Guinea-Bissau" },
  { code: "+592", label: "GY +592", country: "Guyana" },
  { code: "+509", label: "HT +509", country: "Haiti" },
  { code: "+504", label: "HN +504", country: "Honduras" },
  { code: "+852", label: "HK +852", country: "Hong Kong" },
  { code: "+36", label: "HU +36", country: "Hungary" },
  { code: "+354", label: "IS +354", country: "Iceland" },
  { code: "+91", label: "IN +91", country: "India" },
  { code: "+62", label: "ID +62", country: "Indonesia" },
  { code: "+98", label: "IR +98", country: "Iran" },
  { code: "+964", label: "IQ +964", country: "Iraq" },
  { code: "+353", label: "IE +353", country: "Ireland" },
  { code: "+972", label: "IL +972", country: "Israel" },
  { code: "+39", label: "IT +39", country: "Italy" },
  { code: "+225", label: "CI +225", country: "Ivory Coast" },
  { code: "+1", label: "JM +1", country: "Jamaica" },
  { code: "+81", label: "JP +81", country: "Japan" },
  { code: "+962", label: "JO +962", country: "Jordan" },
  { code: "+7", label: "KZ +7", country: "Kazakhstan" },
  { code: "+254", label: "KE +254", country: "Kenya" },
  { code: "+686", label: "KI +686", country: "Kiribati" },
  { code: "+965", label: "KW +965", country: "Kuwait" },
  { code: "+996", label: "KG +996", country: "Kyrgyzstan" },
  { code: "+856", label: "LA +856", country: "Laos" },
  { code: "+371", label: "LV +371", country: "Latvia" },
  { code: "+961", label: "LB +961", country: "Lebanon" },
  { code: "+266", label: "LS +266", country: "Lesotho" },
  { code: "+231", label: "LR +231", country: "Liberia" },
  { code: "+218", label: "LY +218", country: "Libya" },
  { code: "+423", label: "LI +423", country: "Liechtenstein" },
  { code: "+370", label: "LT +370", country: "Lithuania" },
  { code: "+352", label: "LU +352", country: "Luxembourg" },
  { code: "+853", label: "MO +853", country: "Macau" },
  { code: "+389", label: "MK +389", country: "North Macedonia" },
  { code: "+261", label: "MG +261", country: "Madagascar" },
  { code: "+265", label: "MW +265", country: "Malawi" },
  { code: "+60", label: "MY +60", country: "Malaysia" },
  { code: "+960", label: "MV +960", country: "Maldives" },
  { code: "+223", label: "ML +223", country: "Mali" },
  { code: "+356", label: "MT +356", country: "Malta" },
  { code: "+692", label: "MH +692", country: "Marshall Islands" },
  { code: "+222", label: "MR +222", country: "Mauritania" },
  { code: "+230", label: "MU +230", country: "Mauritius" },
  { code: "+52", label: "MX +52", country: "Mexico" },
  { code: "+691", label: "FM +691", country: "Micronesia" },
  { code: "+373", label: "MD +373", country: "Moldova" },
  { code: "+377", label: "MC +377", country: "Monaco" },
  { code: "+976", label: "MN +976", country: "Mongolia" },
  { code: "+382", label: "ME +382", country: "Montenegro" },
  { code: "+212", label: "MA +212", country: "Morocco" },
  { code: "+258", label: "MZ +258", country: "Mozambique" },
  { code: "+95", label: "MM +95", country: "Myanmar" },
  { code: "+264", label: "NA +264", country: "Namibia" },
  { code: "+674", label: "NR +674", country: "Nauru" },
  { code: "+977", label: "NP +977", country: "Nepal" },
  { code: "+31", label: "NL +31", country: "Netherlands" },
  { code: "+64", label: "NZ +64", country: "New Zealand" },
  { code: "+505", label: "NI +505", country: "Nicaragua" },
  { code: "+227", label: "NE +227", country: "Niger" },
  { code: "+234", label: "NG +234", country: "Nigeria" },
  { code: "+850", label: "KP +850", country: "North Korea" },
  { code: "+47", label: "NO +47", country: "Norway" },
  { code: "+968", label: "OM +968", country: "Oman" },
  { code: "+92", label: "PK +92", country: "Pakistan" },
  { code: "+680", label: "PW +680", country: "Palau" },
  { code: "+970", label: "PS +970", country: "Palestine" },
  { code: "+507", label: "PA +507", country: "Panama" },
  { code: "+675", label: "PG +675", country: "Papua New Guinea" },
  { code: "+595", label: "PY +595", country: "Paraguay" },
  { code: "+51", label: "PE +51", country: "Peru" },
  { code: "+63", label: "PH +63", country: "Philippines" },
  { code: "+48", label: "PL +48", country: "Poland" },
  { code: "+351", label: "PT +351", country: "Portugal" },
  { code: "+974", label: "QA +974", country: "Qatar" },
  { code: "+40", label: "RO +40", country: "Romania" },
  { code: "+7", label: "RU +7", country: "Russia" },
  { code: "+250", label: "RW +250", country: "Rwanda" },
  { code: "+1", label: "KN +1", country: "Saint Kitts and Nevis" },
  { code: "+1", label: "LC +1", country: "Saint Lucia" },
  { code: "+685", label: "WS +685", country: "Samoa" },
  { code: "+378", label: "SM +378", country: "San Marino" },
  { code: "+239", label: "ST +239", country: "Sao Tome and Principe" },
  { code: "+966", label: "SA +966", country: "Saudi Arabia" },
  { code: "+221", label: "SN +221", country: "Senegal" },
  { code: "+381", label: "RS +381", country: "Serbia" },
  { code: "+248", label: "SC +248", country: "Seychelles" },
  { code: "+232", label: "SL +232", country: "Sierra Leone" },
  { code: "+65", label: "SG +65", country: "Singapore" },
  { code: "+421", label: "SK +421", country: "Slovakia" },
  { code: "+386", label: "SI +386", country: "Slovenia" },
  { code: "+677", label: "SB +677", country: "Solomon Islands" },
  { code: "+252", label: "SO +252", country: "Somalia" },
  { code: "+27", label: "ZA +27", country: "South Africa" },
  { code: "+82", label: "KR +82", country: "South Korea" },
  { code: "+211", label: "SS +211", country: "South Sudan" },
  { code: "+34", label: "ES +34", country: "Spain" },
  { code: "+94", label: "LK +94", country: "Sri Lanka" },
  { code: "+249", label: "SD +249", country: "Sudan" },
  { code: "+597", label: "SR +597", country: "Suriname" },
  { code: "+268", label: "SZ +268", country: "Eswatini" },
  { code: "+46", label: "SE +46", country: "Sweden" },
  { code: "+41", label: "CH +41", country: "Switzerland" },
  { code: "+963", label: "SY +963", country: "Syria" },
  { code: "+886", label: "TW +886", country: "Taiwan" },
  { code: "+992", label: "TJ +992", country: "Tajikistan" },
  { code: "+255", label: "TZ +255", country: "Tanzania" },
  { code: "+66", label: "TH +66", country: "Thailand" },
  { code: "+670", label: "TL +670", country: "Timor-Leste" },
  { code: "+228", label: "TG +228", country: "Togo" },
  { code: "+676", label: "TO +676", country: "Tonga" },
  { code: "+1", label: "TT +1", country: "Trinidad and Tobago" },
  { code: "+216", label: "TN +216", country: "Tunisia" },
  { code: "+90", label: "TR +90", country: "Turkey" },
  { code: "+993", label: "TM +993", country: "Turkmenistan" },
  { code: "+688", label: "TV +688", country: "Tuvalu" },
  { code: "+256", label: "UG +256", country: "Uganda" },
  { code: "+380", label: "UA +380", country: "Ukraine" },
  { code: "+971", label: "AE +971", country: "United Arab Emirates" },
  { code: "+44", label: "GB +44", country: "United Kingdom" },
  { code: "+1", label: "US +1", country: "United States" },
  { code: "+598", label: "UY +598", country: "Uruguay" },
  { code: "+998", label: "UZ +998", country: "Uzbekistan" },
  { code: "+678", label: "VU +678", country: "Vanuatu" },
  { code: "+379", label: "VA +379", country: "Vatican City" },
  { code: "+58", label: "VE +58", country: "Venezuela" },
  { code: "+84", label: "VN +84", country: "Vietnam" },
  { code: "+967", label: "YE +967", country: "Yemen" },
  { code: "+260", label: "ZM +260", country: "Zambia" },
  { code: "+263", label: "ZW +263", country: "Zimbabwe" },
];

const COUNTRY_PHONE_MAP: Record<string, string> = Object.fromEntries(
  PHONE_CODES.map((pc) => [pc.country.toLowerCase(), pc.code])
);

type CustomerDetails = {
  name: string;
  email: string;
  phone: string;
  phoneCode: string;
  address: string;
  pinCode: string;
  stateCity: string;
  country: string;
};

type OrderStatus = "checkout" | "processing" | "success" | "failed";

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match('(^|;)\\s*' + name + "=([^;]+)");
  return match ? decodeURIComponent(match[2]) : null;
}

const formatCurrency = (n: number) => {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

function CheckoutContent() {
  const { user, loading } = useAuth();
  const { cart, removeItem } = useCart();
  const router = useRouter();
  const { openCart } = useCartSidebar();
  const { settings: deliverySettings } = useDeliverySettings();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [inventoryMap, setInventoryMap] = useState<Record<string, any>>({});
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("checkout");
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: "",
    email: user?.email || "",
    phone: "",
    phoneCode: "+91",
    address: "",
    pinCode: "",
    stateCity: "",
    country: "India",
  });
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountCodeStatus, setDiscountCodeStatus] = useState<"idle" | "valid" | "invalid" | "checking">("idle");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const emailInitializedRef = useRef(false);
  const autoFilledRef = useRef(false);
  const [shippingInfo, setShippingInfo] = useState<ShippingResult>({
    available: true,
    charge: 0,
    estimatedDays: "5-7",
    courierPartner: "DTDC",
    zone: "",
  });
  const [pincodeChecked, setPincodeChecked] = useState(false);

  useEffect(() => {
    if (user?.email && !emailInitializedRef.current) {
      setCustomerDetails((prev) => ({
        ...prev,
        email: user.email || "",
        name: user.displayName || prev.name,
        phone: user.phoneNumber?.replace("+91", "") || prev.phone,
      }));
      emailInitializedRef.current = true;
    }
  }, [user]);

  useEffect(() => {
    if (!user || autoFilledRef.current) return;
    const addrQuery = query(
      collection(db!, "users", user.uid, "addresses"),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    getDocs(addrQuery).then((snap) => {
      if (snap.empty) return;
      const data = snap.docs[0].data();
      setCustomerDetails((prev) => ({
        ...prev,
        name: data.name || prev.name,
        phone: data.phone || prev.phone,
        address: data.address || prev.address,
        pinCode: data.pinCode || prev.pinCode,
        stateCity: data.stateCity || prev.stateCity,
      }));
      autoFilledRef.current = true;
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    setItems([]);
    setLoadingItems(true);

    if (user && user.email) {
      const colRef = collection(db!, "Cart");
      const q = query(colRef, where("UserMail", "==", user.email));
      unsub = onSnapshot(
        q,
        (snap) => {
          const rows: CartItem[] = snap.docs.map((d) => ({ docId: d.id, ...(d.data() as any) }));
          setItems(rows);
          setLoadingItems(false);
        },
        (e) => {
          console.error("Cart read error:", e);
          setLoadingItems(false);
        }
      );
    } else {
      const raw = readCookie("guest_cart");
      try {
        const parsed = raw ? JSON.parse(raw) : [];
        setItems(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setItems([]);
      }
      setLoadingItems(false);
    }

    return () => unsub && unsub();
  }, [user]);

  useEffect(() => {
    if (!items || items.length === 0) {
      setInventoryMap({});
      return;
    }

    const ids = items.map((it) => it.ID).filter(Boolean);
    const chunks: any[] = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

    async function fetchChunks() {
      const map: Record<string, any> = {};
      for (const chunk of chunks) {
        try {
          const q = query(collection(db!, "inventory"), where("ID", "in", chunk));
          const snap = await getDocs(q);
          snap.docs.forEach((d) => {
            const data = d.data();
            const key = String(data?.ID ?? d.id);
            map[key] = { ...data, _docId: d.id };
          });
        } catch (e) {
          try {
            const allSnap = await getDocs(collection(db!, "inventory"));
            allSnap.docs.forEach((d) => {
              const data = d.data();
              const key = String(data?.ID ?? d.id);
              if (ids.map(String).includes(key)) map[key] = { ...data, _docId: d.id };
            });
          } catch (err) {
            console.error("Failed fetching inventory details:", err);
          }
        }
      }
      setInventoryMap(map);
    }

    fetchChunks();
  }, [items]);

  const grandTotal = items.reduce((sum, it) => {
    const basePrice = resolvePricing({
      Price: inventoryMap[String(it.ID)]?.Price,
      OriginalPrice: inventoryMap[String(it.ID)]?.OriginalPrice,
      DiscountPercent: inventoryMap[String(it.ID)]?.DiscountPercent,
    }).selling;
    const customPrice = it.isCustomized && it.customPrice ? Number(it.customPrice) : 0;
    const totalPrice = basePrice + customPrice;
    const qty = Number(it.Quantity || 0);
    return sum + (isNaN(totalPrice) ? 0 : totalPrice * qty);
  }, 0);

  const discountAmount =
    discountCodeStatus === "valid" && discountPercent > 0 ? Math.round(grandTotal * (discountPercent / 100)) : 0;
  const discountedTotal = grandTotal - discountAmount;
  const finalTotal = discountedTotal + shippingInfo.charge;

  // Calculate shipping when pincode or cart changes
  useEffect(() => {
    const isIntl = customerDetails.country !== "India";
    const minLen = isIntl ? 3 : 6;
    if (customerDetails.pinCode.length >= minLen) {
      setPincodeChecked(true);
      const totalItems = items.reduce((sum, it) => sum + Number(it.Quantity || 0), 0);
      const result = calculateShipping(
        totalItems,
        grandTotal,
        customerDetails.pinCode,
        deliverySettings.zones,
        deliverySettings.freeDeliveryThreshold,
        customerDetails.country
      );
      setShippingInfo(result);
    } else {
      setPincodeChecked(false);
      setShippingInfo({ available: true, charge: 0, estimatedDays: "5-7", courierPartner: "DTDC", zone: "" });
    }
  }, [customerDetails.pinCode, customerDetails.country, grandTotal, items, deliverySettings]);

  const lookupPincodeAuto = async (pincode: string, country?: string) => {
    const ctry = country || customerDetails.country;
    const isIntl = ctry !== "India";
    if (!isIntl && pincode.length !== 6) return;
    if (isIntl && pincode.length < 3) return;
    try {
      const res = await fetch(`/api/lookup-pincode?pincode=${pincode}&country=${encodeURIComponent(ctry)}`);
      if (!res.ok) {
        console.error("Pincode lookup failed:", res.status, await res.text());
        return;
      }
      const info = await res.json();
      if (info?.state) {
        setCustomerDetails((prev) => ({
          ...prev,
          stateCity: `${info.city ?? ""}${info.city ? ", " : ""}${info.state}`,
        }));
      } else {
        console.warn("Pincode lookup returned no state:", info);
      }
    } catch (err) {
      console.error("Pincode lookup error:", err);
    }
  };

  const handleInputChange = (field: keyof CustomerDetails, value: string) => {
    if (field === "phone") {
      value = value.replace(/\D/g, "").slice(0, 15);
    }
    if (field === "pinCode") {
      const isIntl = customerDetails.country !== "India";
      value = value.replace(/\D/g, "").slice(0, isIntl ? 20 : 6);
    }
    if (field === "country") {
      const phoneCode = COUNTRY_PHONE_MAP[value.toLowerCase()] || "+91";
      const changedToIntl = value !== "India";
      setCustomerDetails((prev) => ({
        ...prev,
        country: value,
        phoneCode,
        phone: prev.phone.replace(/\D/g, "").slice(0, 15),
        pinCode: changedToIntl ? prev.pinCode.replace(/\D/g, "").slice(0, 20) : prev.pinCode.replace(/\D/g, "").slice(0, 6),
        stateCity: changedToIntl ? "" : prev.stateCity,
      }));
      return;
    }
    setCustomerDetails((prev) => ({ ...prev, [field]: value }));
    if (field === "pinCode") {
      const isIntl = customerDetails.country !== "India";
      if (isIntl && value.length >= 3) {
        lookupPincodeAuto(value);
      } else if (!isIntl && value.length === 6) {
        lookupPincodeAuto(value);
      }
    }
  };

  const isFormValid = () => {
    const isIntl = customerDetails.country !== "India";
    const pinValid = isIntl
      ? customerDetails.pinCode.trim().length >= 3
      : customerDetails.pinCode.trim().length === 6;
    const phoneValid = customerDetails.phone.trim().length >= 5;
    return (
      customerDetails.name.trim() &&
      customerDetails.email.trim() &&
      phoneValid &&
      customerDetails.address.trim() &&
      pinValid &&
      (isIntl || customerDetails.stateCity.trim()) &&
      customerDetails.country.trim() &&
      items.length > 0
    );
  };

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      alert("Payment system is loading, please try again.");
      return;
    }

    if (!isFormValid()) {
      alert("Please fill all required fields.");
      return;
    }

    const stockIssues: string[] = [];
    items.forEach((item) => {
      const prod: any = inventoryMap[String(item.ID)];
      if (!prod) return;
      const qty = Number(item.Quantity || 0);
      if (!qty || qty <= 0) return;
      let sizeStock: number | undefined;
      // Try VariantStock first
      if (prod.VariantStock && item.Color && item.Size) {
        const key = `${item.Color}|${item.Size}`;
        if (typeof prod.VariantStock[key] === "number") sizeStock = prod.VariantStock[key];
      }
      if (sizeStock === undefined) {
        const size = (item.Size || "").toUpperCase();
        if (size === "S") sizeStock = prod.StockS;
        else if (size === "M") sizeStock = prod.StockM;
        else if (size === "L") sizeStock = prod.StockL;
        else if (size === "XL") sizeStock = prod.StockXL;
      }
      const maxAllowed =
        (typeof sizeStock === "number" ? sizeStock : undefined) ??
        (typeof prod.Stock === "number" ? prod.Stock : undefined);
      if (typeof maxAllowed === "number" && qty > maxAllowed) {
        const label = prod.ProductName || prod.Description || prod.Product || `Item ${item.ID}`;
        const variant = item.Color ? `${item.Color} / ${item.Size || ""}` : (item.Size || "");
        stockIssues.push(`${label} (${variant}) - only ${maxAllowed} left`);
      }
    });

    if (stockIssues.length > 0) {
      alert(
        "Some items are out of stock or exceed available quantity. Please adjust your cart:\n\n" +
          stockIssues.join("\n")
      );
      return;
    }

    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKeyId) {
      alert("Payment setup issue: Razorpay key is not configured. Please contact support.");
      return;
    }

    setOrderStatus("processing");

    const orderData = {
      items: items.map((item) => ({
        ID: item.ID,
        Quantity: item.Quantity,
        Size: item.Size,
        Color: item.Color || "",
        ItemNotes: item.ItemNotes || "",
        product: inventoryMap[String(item.ID)],
        ...(item.isCustomized && {
          isCustomized: true,
          customizationText: item.customizationText,
          customPrice: item.customPrice || 0,
        }),
      })),
      customer: { ...customerDetails, fullPhone: `${customerDetails.phoneCode}${customerDetails.phone}` },
      country: customerDetails.country,
      total: finalTotal,
      subtotal: grandTotal,
      discountCode: discountCodeStatus === "valid" ? discountCode : "",
      discountPercent: discountCodeStatus === "valid" ? discountPercent : 0,
      discountAmount: discountCodeStatus === "valid" ? discountAmount : 0,
      shippingCharge: shippingInfo.charge,
      shippingZone: shippingInfo.zone,
      courierPartner: shippingInfo.courierPartner,
      estimatedDelivery: shippingInfo.estimatedDays,
      createdAt: new Date().toISOString(),
      userId: user?.uid || null,
      userEmail: user?.email || null,
      trackingId: "",
    };

    const options = {
      key: razorpayKeyId,
      amount: finalTotal * 100,
      currency: "INR",
      name: "Kria",
      description: `Order for ${items.length} items`,
      handler: async function (response: any) {
        try {
          const finalOrderData = {
            ...orderData,
            paymentId: response.razorpay_payment_id,
            status: "placed",
            createdAt: serverTimestamp(),
          };

          const orderRef = await addDoc(collection(db!, "Orders"), finalOrderData);
          setOrderDetails({ ...finalOrderData, orderId: orderRef.id });
          setOrderStatus("success");

          if (user?.uid) {
            addDoc(collection(db!, "users", user.uid, "addresses"), {
              ...customerDetails,
              createdAt: serverTimestamp(),
            }).catch(() => {});
          }

          try {
            await Promise.all(
              items.map(async (item) => {
                const prod: any = inventoryMap[String(item.ID)];
                if (!prod?._docId) return;
                const qty = Number(item.Quantity || 0);
                if (!qty || qty <= 0) return;
                const updates: Record<string, any> = {};
                // Deduct variant stock if applicable
                if (item.Color && item.Size && prod.VariantStock) {
                  const key = `${item.Color}|${item.Size}`;
                  if (typeof prod.VariantStock[key] === "number") {
                    const newVariantStock = { ...prod.VariantStock };
                    newVariantStock[key] = Math.max(0, (newVariantStock[key] || 0) - qty);
                    updates.VariantStock = newVariantStock;
                  }
                }
                // Also deduct per-size field if present
                if (item.Size) {
                  const sizeFieldMap: Record<string, string> = { S: "StockS", M: "StockM", L: "StockL", XL: "StockXL" };
                  const sizeKey = sizeFieldMap[String(item.Size).toUpperCase()];
                  if (sizeKey && typeof prod[sizeKey] === "number") {
                    updates[sizeKey] = Math.max(0, Number(prod[sizeKey] || 0) - qty);
                  }
                }
                // Always deduct general Stock
                if (typeof prod.Stock === "number") {
                  updates.Stock = Math.max(0, Number(prod.Stock || 0) - qty);
                }
                if (Object.keys(updates).length === 0) return;
                await updateDoc(firestoreDoc(db!, "inventory", prod._docId), updates);
              })
            );
          } catch (stockErr) {
            console.error("Failed to update inventory stock after order:", stockErr);
          }

          if (user && user.email) {
            try {
              const cartItemsToDelete = items.filter((item) => item.docId);
              await Promise.all(cartItemsToDelete.map((item) => deleteDoc(firestoreDoc(db!, "Cart", item.docId!))));
              Object.keys(cart).forEach((id) => {
                const totalCount = cart[id] || 0;
                for (let i = 0; i < totalCount; i++) {
                  removeItem(id);
                }
              });
            } catch (error) {
              console.error("Error clearing user cart:", error);
            }
          } else {
            document.cookie = "guest_cart=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
            Object.keys(cart).forEach((id) => {
              const totalCount = cart[id] || 0;
              for (let i = 0; i < totalCount; i++) {
                removeItem(id);
              }
            });
          }

          try {
            const safeOrderForEmail = {
              id: orderRef.id,
              status: "placed",
              total: finalTotal,
              subtotal: grandTotal,
              shippingCharge: shippingInfo.charge,
              shippingZone: shippingInfo.zone,
              courierPartner: shippingInfo.courierPartner,
              estimatedDelivery: shippingInfo.estimatedDays,
              customer: { ...customerDetails, country: customerDetails.country },
              country: customerDetails.country,
              items: orderData.items,
              createdAt: new Date().toISOString(),
            };

            fetch("/api/send-invoice", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                order: safeOrderForEmail,
                orderId: orderRef.id,
                sendTo: customerDetails.email,
              }),
            }).catch((err) => {
              console.error("Failed to trigger invoice email:", err);
            });
          } catch (emailErr) {
            console.error("Error preparing invoice email:", emailErr);
          }
        } catch (error) {
          console.error("Error saving order:", error);
          setOrderStatus("failed");
        }
      },
      modal: {
        ondismiss: function () {
          setOrderStatus("failed");
        },
      },
      prefill: {
        name: customerDetails.name,
        email: customerDetails.email,
        contact: `${customerDetails.phoneCode}${customerDetails.phone}`,
      },
      theme: {
        color: "#D2693F",
      },
    };

    try {
      if (!window.Razorpay) {
        console.error("Razorpay script not loaded or window.Razorpay is undefined");
        alert("Payment system failed to load. Please refresh the page and try again.");
        setOrderStatus("failed");
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response);
        setOrderStatus("failed");
      });
      rzp.open();
    } catch (error) {
      console.error("Error opening Razorpay:", error);
      setOrderStatus("failed");
    }
  };

  if (loading || loadingItems) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F9F6F0" }}>
        <div className="text-center">
          <div className="animate-spin h-10 w-10 mx-auto mb-4" style={{ border: "3px solid #E0D0B8", borderTopColor: "#D2693F", borderRadius: "50%" }} />
          <p className="text-sm" style={{ color: "#9A6E50" }}>Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (orderStatus === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "#F9F6F0" }}>
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center rounded-full" style={{ backgroundColor: "#F3EDE4", border: "2px solid #D2693F" }}>
            <svg className="w-8 h-8" style={{ color: "#D2693F" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "Tenor Sans, serif" }}>Order Confirmed!</h1>
          <p className="text-sm mb-6" style={{ color: "#9A6E50" }}>Thank you for shopping with Kria</p>

          <div className="rounded-xl px-5 py-4 mb-4" style={{ backgroundColor: "#fff", border: "1px solid #E0D0B8" }}>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#9A6E50" }}>Order ID</p>
            <p className="text-sm font-bold" style={{ color: "#2D2D2D" }}>#{orderDetails?.orderId}</p>
          </div>

          {orderDetails?.estimatedDelivery && (
            <p className="text-sm mb-3" style={{ color: "#9A6E50" }}>
              Estimated delivery: <span className="font-semibold" style={{ color: "#2D2D2D" }}>{orderDetails.estimatedDelivery} business days</span>
            </p>
          )}

          {orderDetails?.country && orderDetails.country !== "India" && (
            <p className="text-sm mb-4" style={{ color: "#9A6E50" }}>
              Shipping to: <span className="font-semibold" style={{ color: "#2D2D2D" }}>{orderDetails.country}</span>
            </p>
          )}

          <p className="text-sm mb-6" style={{ color: "#9A6E50" }}>A confirmation has been sent to your email.</p>

          <div className="rounded-xl px-5 py-4 mb-6" style={{ backgroundColor: "#fff", border: "1px solid #E0D0B8" }}>
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#9A6E50" }}>Need Help?</p>
            <a href="https://wa.me/919894414445" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "#D2693F" }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat on WhatsApp
            </a>
          </div>

          <button onClick={() => router.push("/")} className="w-full py-3 text-sm font-bold tracking-wide rounded-xl transition-all" style={{ backgroundColor: "#D2693F", color: "#fff" }}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (orderStatus === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "#F9F6F0" }}>
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center rounded-full" style={{ backgroundColor: "#F3EDE4", border: "2px solid #D2693F" }}>
            <svg className="w-8 h-8" style={{ color: "#D2693F" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "Tenor Sans, serif" }}>Payment Unsuccessful</h1>
          <p className="text-sm mb-8" style={{ color: "#9A6E50" }}>Your payment could not be processed. Please try again.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => setOrderStatus("checkout")} className="py-3 text-sm font-bold tracking-wide rounded-xl" style={{ backgroundColor: "#D2693F", color: "#fff" }}>
              Try Again
            </button>
            <button onClick={() => router.push("/")} className="py-3 text-sm font-bold tracking-wide rounded-xl" style={{ backgroundColor: "#F3EDE4", color: "#2D2D2D", border: "1px solid #E0D0B8" }}>
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "#F9F6F0" }}>
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 mx-auto mb-5 flex items-center justify-center rounded-full" style={{ backgroundColor: "#F3EDE4", border: "1px solid #E0D0B8" }}>
            <svg className="w-10 h-10" style={{ color: "#9A6E50" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "Tenor Sans, serif" }}>Your Cart is Empty</h1>
          <p className="text-sm mb-8 max-w-xs mx-auto" style={{ color: "#9A6E50" }}>
            Looks like you haven't added any items yet. Start shopping to see your items here.
          </p>
          <button onClick={() => router.push("/")} className="py-3 px-8 text-sm font-bold tracking-wide rounded-xl" style={{ backgroundColor: "#D2693F", color: "#fff" }}>
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9F6F0", color: "#2D2D2D" }}>
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b" style={{ backgroundColor: "#F9F6F0", borderColor: "#E0D0B8" }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <button onClick={() => { sessionStorage.setItem("openCartAfterNav", "1"); router.push("/"); }} className="flex items-center gap-2">
            <svg className="w-5 h-5" style={{ color: "#D2693F" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="text-sm font-semibold tracking-wide" style={{ fontFamily: "Tenor Sans, serif" }}>Back to Cart</span>
          </button>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: "#9A6E50" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span className="text-xs" style={{ color: "#9A6E50" }}>Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center gap-3 max-w-lg">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full" style={{ backgroundColor: "#D2693F", color: "#fff" }}>1</span>
            <span className="text-sm font-semibold" style={{ color: "#D2693F" }}>Shipping</span>
          </div>
          <div className="flex-1 h-px" style={{ backgroundColor: "#E0D0B8" }} />
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full" style={{ backgroundColor: "#E0D0B8", color: "#9A6E50" }}>2</span>
            <span className="text-sm" style={{ color: "#9A6E50" }}>Payment</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pb-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column — Form */}
          <div className="flex-1 min-w-0">
            <form
              onSubmit={(e) => e.preventDefault()}
              autoComplete="on"
              className="mb-6"
            >
              <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "Tenor Sans, serif" }}>Shipping Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9A6E50" }}>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={customerDetails.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
                    style={{ border: "1px solid #E0D0B8", backgroundColor: "#fff", color: "#2D2D2D" }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#D2693F"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#E0D0B8"}
                    placeholder="John Doe"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9A6E50" }}>Email</label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={customerDetails.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
                    style={{ border: "1px solid #E0D0B8", backgroundColor: "#fff", color: "#2D2D2D" }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#D2693F"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#E0D0B8"}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9A6E50" }}>Phone</label>
                  <div className="flex items-center">
                    <span
                      className="px-3 py-3 text-sm select-none rounded-l-lg shrink-0"
                      style={{ border: "1px solid #E0D0B8", borderRight: "none", backgroundColor: "#F3EDE4", color: "#9A6E50" }}
                    >
                      {customerDetails.phoneCode}
                    </span>
                    <input
                      type="tel"
                      name="tel"
                      autoComplete="tel-national"
                      value={customerDetails.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-r-lg outline-none transition-colors"
                      style={{ border: "1px solid #E0D0B8", backgroundColor: "#fff", color: "#2D2D2D" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "#D2693F"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "#E0D0B8"}
                      placeholder="Phone number"
                      maxLength={customerDetails.country === "India" ? 10 : 15}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9A6E50" }}>Country</label>
                  <select
                    value={customerDetails.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
                    style={{ border: "1px solid #E0D0B8", backgroundColor: "#fff", color: "#2D2D2D" }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#D2693F"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#E0D0B8"}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9A6E50" }}>Address</label>
                  <textarea
                    name="address"
                    autoComplete="street-address"
                    value={customerDetails.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors resize-none"
                    style={{ border: "1px solid #E0D0B8", backgroundColor: "#fff", color: "#2D2D2D" }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#D2693F"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#E0D0B8"}
                    rows={2}
                    placeholder="Flat / House No., Building, Street, Area"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9A6E50" }}>PIN Code</label>
                  <input
                    type="text"
                    name="postal-code"
                    autoComplete="postal-code"
                    value={customerDetails.pinCode}
                    onChange={(e) => handleInputChange("pinCode", e.target.value)}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#E0D0B8"; lookupPincodeAuto(customerDetails.pinCode); }}
                    className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
                    style={{ border: "1px solid #E0D0B8", backgroundColor: "#fff", color: "#2D2D2D" }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#D2693F"}
                    placeholder={customerDetails.country === "India" ? "411033" : "Postal Code"}
                    maxLength={customerDetails.country === "India" ? 6 : 20}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9A6E50" }}>
                    {customerDetails.country === "India" ? "State / City" : "City / Region"}
                  </label>
                  <input
                    type="text"
                    name="address-level2"
                    autoComplete="address-level2"
                    value={customerDetails.stateCity}
                    onChange={(e) => handleInputChange("stateCity", e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
                    style={{ border: "1px solid #E0D0B8", backgroundColor: customerDetails.country !== "India" ? "#F9F6F0" : "#fff", color: "#2D2D2D" }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#D2693F"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#E0D0B8"}
                    placeholder={customerDetails.country === "India" ? "Auto-filled from PIN" : "Enter city/region"}
                    readOnly={customerDetails.country !== "India" ? false : undefined}
                  />
                  {customerDetails.country !== "India" && (
                    <p className="text-[10px] mt-1" style={{ color: "#9A6E50" }}>Enter your city and region</p>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Right Column — Order Summary (sticky on desktop) */}
          <div className="w-full lg:w-[380px] lg:shrink-0">
            <div className="lg:sticky lg:top-20">
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E0D0B8", backgroundColor: "#fff" }}>
                <div className="px-5 py-4" style={{ borderBottom: "1px solid #E0D0B8" }}>
                  <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#9A6E50" }}>
                    Order Summary · {items.length} item{items.length === 1 ? "" : "s"}
                  </h2>
                </div>

                <div className="px-5 py-3 max-h-64 overflow-y-auto">
                  <ul className="space-y-3">
                    {items.map((item) => {
                      const key = String(item.ID);
                      const prod = inventoryMap[key];
                      const basePrice = resolvePricing({
                        Price: prod?.Price,
                        OriginalPrice: prod?.OriginalPrice,
                        DiscountPercent: prod?.DiscountPercent,
                      }).selling;
                      const customPrice = item.isCustomized && item.customPrice ? Number(item.customPrice) : 0;
                      const linePrice = (basePrice + customPrice) * Number(item.Quantity || 0);

                      return (
                        <li key={String(item.docId ?? item.ID)} className="flex items-start gap-3">
                          <div className="w-12 h-12 border border-[#E0D0B8] overflow-hidden flex-shrink-0 bg-white">
                            <ProductImage
                              src={prod?.ImageUrl1 || "/placeholder.png"}
                              srcMedium={prod?.ImageUrl1Medium}
                              srcThumb={prod?.ImageUrl1Thumb}
                              size="thumb"
                              alt={prod?.ProductName ?? prod?.Description ?? ""}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "#2D2D2D" }}>
                              {prod?.ProductName ?? prod?.Description ?? `Item ${item.ID}`}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "#9A6E50" }}>
                              {item.Color && <>{item.Color}{item.Size ? " / " : ""}</>}
                              {item.Size && <>Size: {item.Size}</>}
                              {!item.Color && !item.Size && <>Qty: {item.Quantity}</>}
                              {item.Quantity > 1 && <> · Qty: {item.Quantity}</>}
                            </p>
                            {item.ItemNotes && (
                              <p className="text-[11px] italic mt-0.5" style={{ color: "#9A6E50" }}>
                                {item.ItemNotes}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-medium shrink-0" style={{ color: "#2D2D2D" }}>
                            <PriceText amount={linePrice} />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="px-5 py-4 space-y-2" style={{ borderTop: "1px solid #E0D0B8" }}>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "#9A6E50" }}>Subtotal</span>
                    <span className="font-medium"><PriceText amount={grandTotal} /></span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: "#9A6E50" }}>Discount ({discountPercent}%)</span>
                      <span className="font-medium" style={{ color: "#D2693F" }}>- <PriceText amount={discountAmount} /></span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "#9A6E50" }}>Shipping</span>
                    <span className="font-medium" style={{ color: "#2D2D2D" }}>
                    {pincodeChecked && (customerDetails.country !== "India"
                        ? customerDetails.pinCode.length >= 3
                        : customerDetails.pinCode.length === 6
                      )
                      ? shippingInfo.charge === 0
                        ? <span style={{ color: "#2D2D2D" }}>Free</span>
                        : <PriceText amount={shippingInfo.charge} />
                      : "—"}
                    </span>
                  </div>
                  {pincodeChecked && (customerDetails.country !== "India"
                    ? customerDetails.pinCode.length >= 3
                    : customerDetails.pinCode.length === 6
                  ) && (
                    <p className="text-[11px]" style={{ color: "#9A6E50" }}>
                      {shippingInfo.estimatedDays} business days via {shippingInfo.courierPartner}
                      {shippingInfo.zone && <span className="ml-1">· {shippingInfo.zone}</span>}
                      {customerDetails.country !== "India" && <span className="ml-1">· International</span>}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 mt-2" style={{ borderTop: "1px solid #E0D0B8" }}>
                    <span className="text-base font-bold">Total</span>
                    <span className="text-lg font-bold"><PriceText amount={finalTotal} /></span>
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={!isFormValid() || orderStatus === "processing" || !razorpayLoaded}
                className="w-full mt-4 py-3.5 text-sm font-bold tracking-wide rounded-xl transition-all"
                style={{
                  backgroundColor: isFormValid() && razorpayLoaded && orderStatus !== "processing" ? "#D2693F" : "#E0D0B8",
                  color: isFormValid() && razorpayLoaded && orderStatus !== "processing" ? "#fff" : "#9A6E50",
                  cursor: isFormValid() && razorpayLoaded && orderStatus !== "processing" ? "pointer" : "not-allowed",
                }}
              >
                {orderStatus === "processing"
                  ? "Processing..."
                  : `Pay Rs.${formatCurrency(finalTotal)}`}
              </button>

              {!razorpayLoaded && (
                <p className="text-[11px] mt-2 text-center" style={{ color: "#9A6E50" }}>
                  Initializing secure payment...
                </p>
              )}

              <div className="flex items-center justify-center gap-2 mt-3">
                <svg className="w-3.5 h-3.5" style={{ color: "#9A6E50" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span className="text-[11px]" style={{ color: "#9A6E50" }}>Payments via Razorpay · 256-bit SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#F9F6F0", color: "#2D2D2D" }}
        >
          Loading...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
