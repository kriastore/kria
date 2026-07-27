"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    if (!raw) { router.replace("/"); return; }
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
        setStep("password");
      }
    } catch (err: any) {
      setStep("password");
    } finally {
      setLoading(false);
    }
  };

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

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
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

  const INPUT_CLS = "w-full px-4 py-3 text-sm outline-none transition-colors duration-200";
  const INPUT_STYLE: React.CSSProperties = { border: "1px solid #E0D0B8", backgroundColor: "#F9F6F0", color: "#2D2D2D" };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F9F6F0", color: "#2D2D2D" }}>
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ backgroundColor: "#2D2D2D" }}>
        <img
          src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=1200&fit=crop"
          alt="Handcrafted artisanal jewellery"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <Link href="/" className="mb-6">
            <h1
              className="text-5xl lg:text-6xl text-white tracking-wide"
              style={{ fontFamily: "'Tenor Sans', sans-serif", fontWeight: 600, letterSpacing: "0.08em" }}
            >
              KRIA
            </h1>
          </Link>
          <p className="text-sm text-white/60 tracking-[0.3em] uppercase text-center">
            Premium Handcrafted Artistry
          </p>
          <div className="mt-12 max-w-xs text-center">
            <p className="text-white/50 text-sm leading-relaxed" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>
              Every piece tells a story of tradition, patience, and the skilled hands of Indian artisans.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Form Panel */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile brand header */}
        <div className="lg:hidden flex flex-col items-center pt-10 pb-6 px-6">
          <Link href="/">
            <h1
              className="text-3xl tracking-wide"
              style={{ fontFamily: "'Tenor Sans', sans-serif", fontWeight: 600, letterSpacing: "0.08em" }}
            >
              KRIA
            </h1>
          </Link>
          <p className="text-xs text-[#9A6E50] tracking-[0.25em] uppercase mt-1.5">
            Premium Handcrafted Artistry
          </p>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            {/* Heading */}
            <div className="mb-8">
              <h2
                className="text-2xl sm:text-3xl font-semibold mb-1.5"
                style={{ fontFamily: "'Tenor Sans', sans-serif" }}
              >
                {step === "email" && "Welcome"}
                {step === "password" && "Welcome Back"}
                {step === "signup" && "Create Account"}
              </h2>
              <p className="text-sm" style={{ color: "#9A6E50" }}>
                {step === "email" && "Enter your email to get started"}
                {step === "password" && (
                  <>Signing in as <span className="font-medium" style={{ color: "#2D2D2D" }}>{email}</span></>
                )}
                {step === "signup" && (
                  <>New account for <span className="font-medium" style={{ color: "#2D2D2D" }}>{email}</span></>
                )}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 px-4 py-3 text-sm" style={{ backgroundColor: "#F3EDE4", border: "1px solid #E0D0B8", color: "#9A6E50" }}>
                {error}
              </div>
            )}

            {/* Step 1: Email */}
            {step === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9A6E50" }}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus className={INPUT_CLS} style={INPUT_STYLE} placeholder="your@email.com" />
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: loading ? "#E0D0B8" : "#D2693F", color: "#fff" }}>
                  {loading ? "Checking..." : "Continue"}
                </button>
              </form>
            )}

            {/* Step 2a: Password (existing user) */}
            {step === "password" && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9A6E50" }}>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus className={INPUT_CLS} style={INPUT_STYLE} placeholder="Enter your password" />
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: loading ? "#E0D0B8" : "#D2693F", color: "#fff" }}>
                  {loading ? "Signing in..." : "Sign In"}
                </button>
                <button type="button" onClick={() => { setStep("email"); setPassword(""); setError(""); }} className="w-full text-xs font-medium transition-colors" style={{ color: "#9A6E50" }} onMouseOver={(e) => (e.currentTarget.style.color = "#2D2D2D")} onMouseOut={(e) => (e.currentTarget.style.color = "#9A6E50")}>
                  Use a different email
                </button>
                <button type="button" onClick={() => { setStep("signup"); setPassword(""); setError(""); }} className="w-full text-xs font-medium transition-colors" style={{ color: "#D2693F" }} onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")} onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}>
                  Don&apos;t have an account? Create one
                </button>
              </form>
            )}

            {/* Step 2b: Sign up (new user) */}
            {step === "signup" && (
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9A6E50" }}>Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus className={INPUT_CLS} style={INPUT_STYLE} placeholder="Your name (optional)" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9A6E50" }}>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={INPUT_CLS} style={INPUT_STYLE} placeholder="Min 6 characters" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9A6E50" }}>Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={INPUT_CLS} style={INPUT_STYLE} placeholder="Re-enter password" />
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: loading ? "#E0D0B8" : "#D2693F", color: "#fff" }}>
                  {loading ? "Creating account..." : "Create Account"}
                </button>
                <button type="button" onClick={() => { setStep("email"); setPassword(""); setConfirmPassword(""); setName(""); setError(""); }} className="w-full text-xs font-medium transition-colors" style={{ color: "#9A6E50" }} onMouseOver={(e) => (e.currentTarget.style.color = "#2D2D2D")} onMouseOut={(e) => (e.currentTarget.style.color = "#9A6E50")}>
                  Use a different email
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1" style={{ borderTop: "1px solid #E0D0B8" }} />
              <span className="text-xs uppercase tracking-wider" style={{ color: "#9A6E50" }}>or</span>
              <div className="flex-1" style={{ borderTop: "1px solid #E0D0B8" }} />
            </div>

            {/* Google */}
            <button onClick={handleGoogle} disabled={loading} className="w-full flex items-center justify-center gap-3 py-3 text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" style={{ border: "1px solid #E0D0B8", backgroundColor: "#fff", color: "#2D2D2D" }} onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#F3EDE4")} onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#fff")}>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            {/* Back to shop */}
            <div className="mt-8 text-center">
              <Link href="/" className="text-xs font-medium transition-colors" style={{ color: "#9A6E50" }} onMouseOver={(e) => (e.currentTarget.style.color = "#2D2D2D")} onMouseOut={(e) => (e.currentTarget.style.color = "#9A6E50")}>
                ← Back to Kria
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
