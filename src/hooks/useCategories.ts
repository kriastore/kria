import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  writeBatch,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase";

export type Category = {
  id: string;
  name: string;
  image?: string;
  order: number;
};

const DEFAULT_CATEGORIES = [
  { name: "Terracotta Jewellery", image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=600&fit=crop" },
  { name: "Home Decor", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=600&fit=crop" },
  { name: "Hand-painted Silk Sarees", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=600&fit=crop" },
];

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const q = query(collection(db!, "categories"), orderBy("order", "asc"));
    const unsub = onSnapshot(
      q,
      async (snap) => {
        if (snap.empty) {
          const batch = writeBatch(db!);
          DEFAULT_CATEGORIES.forEach((cat, i) => {
            const ref = doc(collection(db!, "categories"));
            batch.set(ref, { name: cat.name, image: cat.image, order: i });
          });
          await batch.commit();
          return;
        }
        setCategories(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        );
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, []);

  const addCategory = async (name: string, image?: string) => {
    if (!db) return;
    const maxOrder = categories.length ? Math.max(...categories.map((c) => c.order)) : 0;
    await addDoc(collection(db!, "categories"), {
      name: name.trim(),
      image: image || "",
      order: maxOrder + 1,
    });
  };

  const removeCategory = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db!, "categories", id));
  };

  const updateCategory = async (id: string, updates: Partial<Pick<Category, "name" | "image" | "order">>) => {
    if (!db) return;
    const ref = doc(db!, "categories", id);
    await updateDoc(ref, updates);
  };

  return { categories, loading, addCategory, removeCategory, updateCategory };
}
