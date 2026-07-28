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

export type Subcategory = {
  name: string;
  order: number;
};

export type Category = {
  id: string;
  name: string;
  image?: string;
  order: number;
  subcategories: Subcategory[];
};

const DEFAULT_CATEGORIES: { name: string; image: string; subcategories: Subcategory[] }[] = [
  {
    name: "Terracotta Jewellery",
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=600&fit=crop",
    subcategories: [
      { name: "Studs", order: 0 },
      { name: "Jumuka", order: 1 },
      { name: "Danglers", order: 2 },
      { name: "Neck Sets", order: 3 },
    ],
  },
  {
    name: "Accessories",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=600&fit=crop",
    subcategories: [
      { name: "Hairclips", order: 0 },
      { name: "Catcher Clips", order: 1 },
      { name: "Saree Pins", order: 2 },
      { name: "Bangles", order: 3 },
    ],
  },
  {
    name: "Home Decor",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=600&fit=crop",
    subcategories: [
      { name: "Handpainted Wall Plates", order: 0 },
      { name: "Wooden Steps", order: 1 },
      { name: "Paintings", order: 2 },
    ],
  },
  {
    name: "Sarees & Salwars",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=600&fit=crop",
    subcategories: [
      { name: "Saree", order: 0 },
      { name: "Salwar", order: 1 },
      { name: "Handpainted Saree", order: 2 },
    ],
  },
  {
    name: "Return Gifts",
    image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=600&fit=crop",
    subcategories: [
      { name: "Handpainted Silk Purses", order: 0 },
      { name: "Hair Accessories", order: 1 },
      { name: "Fridge Magnets", order: 2 },
      { name: "Pooja Gifts", order: 3 },
    ],
  },
  {
    name: "Wholesale",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=600&fit=crop",
    subcategories: [],
  },
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
            batch.set(ref, {
              name: cat.name,
              image: cat.image,
              order: i,
              subcategories: cat.subcategories,
            });
          });
          await batch.commit();
          return;
        }
        setCategories(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
            subcategories: (d.data() as any).subcategories || [],
          }))
        );
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, []);

  const addCategory = async (name: string, image?: string, subcategories?: Subcategory[]) => {
    if (!db) return;
    const maxOrder = categories.length ? Math.max(...categories.map((c) => c.order)) : 0;
    await addDoc(collection(db!, "categories"), {
      name: name.trim(),
      image: image || "",
      order: maxOrder + 1,
      subcategories: subcategories || [],
    });
  };

  const removeCategory = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db!, "categories", id));
  };

  const updateCategory = async (id: string, updates: Partial<Pick<Category, "name" | "image" | "order" | "subcategories">>) => {
    if (!db) return;
    const ref = doc(db!, "categories", id);
    await updateDoc(ref, updates);
  };

  const addSubcategory = async (categoryId: string, name: string) => {
    if (!db) return;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const subs = [...(cat.subcategories || [])];
    subs.push({ name: name.trim(), order: subs.length });
    await updateCategory(categoryId, { subcategories: subs });
  };

  const removeSubcategory = async (categoryId: string, subIndex: number) => {
    if (!db) return;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const subs = (cat.subcategories || []).filter((_, i) => i !== subIndex);
    subs.forEach((s, i) => (s.order = i));
    await updateCategory(categoryId, { subcategories: subs });
  };

  const updateSubcategory = async (categoryId: string, subIndex: number, name: string) => {
    if (!db) return;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const subs = [...(cat.subcategories || [])];
    if (subs[subIndex]) {
      subs[subIndex] = { ...subs[subIndex], name: name.trim() };
    }
    await updateCategory(categoryId, { subcategories: subs });
  };

  const getSubcategoriesForCategory = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return (cat?.subcategories || []).sort((a, b) => a.order - b.order);
  };

  return {
    categories,
    loading,
    addCategory,
    removeCategory,
    updateCategory,
    addSubcategory,
    removeSubcategory,
    updateSubcategory,
    getSubcategoriesForCategory,
  };
}
