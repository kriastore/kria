import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { User } from "firebase/auth";

export function useAdmin(user: User | null) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setIsAdmin(false);
      return;
    }
    setLoading(true);
    const checkAdmin = async () => {
      try {
        const userRef = doc(db!, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().role === "admin") {
          setIsAdmin(true);
        } else if (user.email === "admin@gmail.com") {
          await setDoc(userRef, { role: "admin" }, { merge: true });
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        if (user.email === "admin@gmail.com") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, [user]);

  return { isAdmin, loading };
}
