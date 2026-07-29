"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebase";

export type ContactInfo = {
  phone: string;
  email: string;
  address: string;
  hours: string;
  instagramJewellery: string;
  instagramHomeDecor: string;
  facebookJewellery: string;
  facebookHomeDecor: string;
  gstin: string;
  legalName: string;
  tradeName: string;
};

const DEFAULTS: ContactInfo = {
  phone: "+91 98944 14445",
  email: "Kriastore@gmail.com",
  address: "No 8, Thiruvalluvar Nagar main road,\nV.G.Rao nagar A sector,\nKatpadi, Vellore,\nTamilnadu -632007,\nIndia",
  hours: "10:00 AM – 7:00 PM IST",
  instagramJewellery: "https://www.instagram.com/kria_terracotta_jewellery",
  instagramHomeDecor: "https://www.instagram.com/kria_homedecor",
  facebookJewellery: "https://www.facebook.com/Kriastore/",
  facebookHomeDecor: "https://facebook.com/kriacrafts",
  gstin: "33ATPPK2643B1ZZ",
  legalName: "Vittlraj Krithika",
  tradeName: "KRIA",
};

const DOC_ID = "contactInfo";

export function useContactInfo() {
  const [info, setInfo] = useState<ContactInfo>(DEFAULTS);
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
          setInfo({ ...DEFAULTS, ...snap.data() } as ContactInfo);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const saveContactInfo = async (data: ContactInfo) => {
    if (!db) return;
    await setDoc(doc(db!, "settings", DOC_ID), data);
  };

  return { info, loading, saveContactInfo };
}
