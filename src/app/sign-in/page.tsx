"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  fetchSignInMethodsForEmail,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";

type Step = "email" | "password" | "signup";

export default function SignInPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePostAuthRedirect = () => {
    const raw = sessionStorage.getItem("postAuthAction");
    if (!raw) {
      router.replace("/");
      return;
    }
    const action = JSON.parse(raw);
    router.replace(action.redirectTo || "/");
  };

  const addUserToFirestore = async (userId: string, userEmail: string, displayName?: string) => {
    if (!db) return;
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: userEmail,
        displayName: displayName || email.split("@")[0],
        role: userEmail === "admin@gmail.com" ? "admin" : "user",
        createdAt: new Date().toISOString(),
      });
    } else if (userEmail === "admin@gmail.com" && userSnap.data().role !== "admin") {
      const { updateDoc } = await import("firebase/firestore");
      await updateDoc(userRef, { role: "admin" });
    }
  };

  // Step 1: Check if email exists
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!auth) throw new Error("Auth not initialized");
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        setStep("password");
      } else {
        setStep("signup");
      }
    } catch (err: any) {
      // Firebase returns "auth/user-not-found" for unknown emails in some configs,
      // but fetchSignInMethodsForEmail may throw — treat as new user
      if (err?.code === "auth/user-not-found" || err?.code === "auth/invalid-email") {
        setStep("signup");
      } else {
        setError(err.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2a: Sign in existing user
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!auth) throw new Error("Auth not initialized");
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await addUserToFirestore(cred.user.uid, email);
      handlePostAuthRedirect();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  // Step 2b: Create new account
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      if (!auth) throw new Error("Auth not initialized");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await addUserToFirestore(cred.user.uid, email, name || undefined);
      handlePostAuthRedirect();
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      if (!auth) throw new Error("Auth not initialized");
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await addUserToFirestore(cred.user.uid, cred.user.email || "", cred.user.displayName || undefined);
      handlePostAuthRedirect();
    } catch (err: any) {
      setError(err.message || "Failed to continue with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-10 md:py-14 font-light text-black flex justify-center">
      <div className="max-w-md w-full space-y-6 bg-white border border-gray-200 p-6 md:p-8 shadow-lg">
        <div>
          <h2 className="text-center text-3xl md:text-4xl font-semibold">
            {step === "email" && "Welcome to Kria"}
            {step === "password" && "Welcome back"}
            {step === "signup" && "Create your account"}
          </h2>
          <p className="mt-2 text-center text-gray-500 font-light text-sm">
            {step === "email" && "Sign in or create an account to continue"}
            {step === "password" && `Signing in as ${email}`}
            {step === "signup" && `Creating account for ${email}`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E0D0B8] focus:border-amber-400 transition"
                placeholder="your@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D2693F] text-white py-3 font-semibold hover:bg-[#B85A34] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Checking..." : "Continue"}
            </button>
          </form>
        )}

        {/* Step 2a: Password (existing user) */}
        {step === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E0D0B8] focus:border-amber-400 transition"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D2693F] text-white py-3 font-semibold hover:bg-[#B85A34] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setPassword(""); setError(""); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
            >
              ← Use a different email
            </button>
          </form>
        )}

        {/* Step 2b: Sign up (new user) */}
        {step === "signup" && (
          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold mb-2">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E0D0B8] focus:border-amber-400 transition"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E0D0B8] focus:border-amber-400 transition"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E0D0B8] focus:border-amber-400 transition"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D2693F] text-white py-3 font-semibold hover:bg-[#B85A34] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setPassword(""); setConfirmPassword(""); setName(""); setError(""); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
            >
              ← Use a different email
            </button>
          </form>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-400">or</span>
          </div>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 text-black bg-white py-3 font-semibold hover:bg-gray-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
