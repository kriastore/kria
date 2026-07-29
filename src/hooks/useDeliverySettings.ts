import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebase";

export type ZoneDef = {
  rate: number;
  perItem: number;
  days: string;
  label: string;
};

export type DeliverySettings = {
  freeDeliveryThreshold: number;
  zones: Record<string, ZoneDef>;
};

const DEFAULT_ZONES: Record<string, ZoneDef> = {
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

const DEFAULT_SETTINGS: DeliverySettings = {
  freeDeliveryThreshold: 1000,
  zones: DEFAULT_ZONES,
};

const DOC_ID = "delivery";

export function useDeliverySettings() {
  const [settings, setSettings] = useState<DeliverySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const ref = doc(db!, "settings", DOC_ID);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSettings({
            freeDeliveryThreshold:
              typeof data.freeDeliveryThreshold === "number"
                ? data.freeDeliveryThreshold
                : DEFAULT_SETTINGS.freeDeliveryThreshold,
            zones:
              data.zones && typeof data.zones === "object"
                ? { ...DEFAULT_SETTINGS.zones, ...data.zones }
                : DEFAULT_SETTINGS.zones,
          });
        }
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, []);

  const saveSettings = async (newSettings: DeliverySettings) => {
    if (!db) return;
    await setDoc(doc(db!, "settings", DOC_ID), {
      freeDeliveryThreshold: newSettings.freeDeliveryThreshold,
      zones: newSettings.zones,
    });
  };

  return { settings, loading, saveSettings };
}
