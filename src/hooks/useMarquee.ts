import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebase";

const DEFAULT_ITEMS = [
  "Worldwide shipping available",
  "Free Shipping on all orders above Rs.1000 within India",
  "Handcrafted with love by Indian artisans",
];

const DOC_ID = "marquee";

export function useMarquee() {
  const [items, setItems] = useState<string[]>(DEFAULT_ITEMS);
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
          if (Array.isArray(data.items) && data.items.length > 0) {
            setItems(data.items);
          }
        }
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, []);

  const saveItems = async (newItems: string[]) => {
    if (!db) return;
    await setDoc(doc(db!, "settings", DOC_ID), { items: newItems });
  };

  return { items, loading, saveItems };
}
