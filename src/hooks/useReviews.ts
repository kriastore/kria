import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebase";

export type Review = {
  name: string;
  text: string;
  image?: string;
  imageThumb?: string;
};

const DEFAULT_REVIEWS: Review[] = [
  {
    name: "Priya S.",
    text: "The terracotta earrings are absolutely stunning. Lightweight, beautiful craftsmanship, and arrived beautifully packaged.",
  },
  {
    name: "Ananya M.",
    text: "I ordered a customised necklace set and they turned out exactly how I envisioned. The attention to detail is remarkable.",
  },
  {
    name: "Meera R.",
    text: "The home decor pieces have added such warmth to my living room. Truly artisanal quality.",
  },
  {
    name: "Kavitha L.",
    text: "Every piece tells a story. Love supporting handmade Indian craft. Will definitely order again!",
  },
  {
    name: "Shreya P.",
    text: "The silk saree painting is a work of art. Premium quality and the colours are so vibrant.",
  },
  {
    name: "Deepa N.",
    text: "Kria has the most elegant handcrafted collection. It feels special to wear something made with such care.",
  },
];

const DOC_ID = "reviews";

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>(DEFAULT_REVIEWS);
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
          if (Array.isArray(data.reviews)) {
            setReviews(data.reviews);
          }
        }
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, []);

  const saveReviews = async (newReviews: Review[]) => {
    if (!db) return;
    await setDoc(doc(db!, "settings", DOC_ID), { reviews: newReviews });
  };

  return { reviews, loading, saveReviews };
}
