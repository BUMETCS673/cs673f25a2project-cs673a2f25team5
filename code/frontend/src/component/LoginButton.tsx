"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaGoogle, FaSpinner, FaTimes } from "react-icons/fa";

export default function LoginButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!email) {
      return;
    }
    setIsLoading(true);
    try {
      //   await setLoginCookie(email);
      router.refresh();
      console.log("Login", email);
      setIsOpen(false);
    } catch (error) {
      console.error("Error logging in", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        Login
      </button>
      {isOpen && (
        <div className="fixed z-50 bg-transparent inset-0 h-screen w-screen flex items-center justify-center backdrop-blur-sm bg-opacity-50">
          <div className="group z-50 relative flex w-full max-w-md flex-col gap-6 overflow-hidden rounded-3xl border border-neutral-200/70 bg-white/95 p-8 text-neutral-900 shadow-2xl shadow-amber-500/10 backdrop-blur dark:border-white/10 dark:bg-neutral-900/70 dark:text-neutral-100">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-0 right-0 m-5 hover:scale-110 transition hover:text-red-400 hover:border border-red-400 rounded-md"
            >
              <FaTimes />
            </button>
            <span className="pointer-events-none absolute -top-24 right-0 h-40 w-40 rounded-full bg-amber-300/45 blur-3xl dark:bg-amber-400/30" />
            <span className="pointer-events-none absolute -bottom-28 left-6 h-44 w-44 rounded-full bg-purple-300/35 blur-3xl dark:bg-purple-500/25" />
            <h1 className="font-atkinson-hyperlegible-next text-4xl font-bold text-neutral-900 dark:text-white">
              Login
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Login to your account to continue
            </p>
            <div className="flex flex-col gap-2"></div>
            <button
              disabled={isLoading}
              className="relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-amber-300 via-purple-400 to-amber-300 px-6 py-3 text-sm font-semibold text-neutral-900 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaGoogle />
              )}
              {isLoading ? "Signing in…" : "Sign in with Google"}
            </button>
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
              or continue with
              <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
            </div>

            <input
              placeholder="Email"
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 dark:border-white/20 dark:text-neutral-200 dark:hover:bg-white/10"
            ></input>

            <button
              type="button"
              className="rounded-full border hover:scale-105 focus:scale-95 duration-300 border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 dark:border-white/20 dark:text-neutral-200 dark:hover:bg-white/10"
              onClick={() => {
                handleLogin();
              }}
              disabled={isLoading}
            >
              {isLoading ? "Logging in…" : "Login"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
