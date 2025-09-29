"use client";
import { deleteLoginCookie } from "@/actions/auth";

export function Signout() {
  const handleSignout = async () => {
    await deleteLoginCookie();
    window.location.reload();
  };
  return (
    <button
      onClick={handleSignout}
      className="uppercase rounded-full text-black backdrop-blur-sm bg-transparent px-6 py-3 z-50 text-sm font-semibold hover:scale-105 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-purple-300"
    >
      Sign out
    </button>
  );
}
