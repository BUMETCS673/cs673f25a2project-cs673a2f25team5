"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Lifted from "@/component/text/Lifted";
import { FaGoogle, FaTimes } from "react-icons/fa";
import { setLoginCookie } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
// import { cookies } from "next/headers";

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const router = useRouter();
  const handleOpenModal = () => {
    setOpenModal(true);
    disableScroll();
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    enableScroll();
  };

  const handleLogin = async () => {
    if (!email) {
      return;
    }
    setLoading(true);
    let loadingToast: string | number | undefined;
    try {
      loadingToast = toast.loading("Logging in...");
      await setLoginCookie(email);
      toast.dismiss(loadingToast);
      toast.success("Logged in");
      router.refresh();
      console.log("Login", email);
      handleCloseModal();
    } catch (error) {
      toast.error("Error logging in");
      console.error("Error logging in", error);
    } finally {
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      setLoading(false);
    }

    // const cookieStore = await cookies();
    // cookieStore.set("email", email);
  };

  const [email, setEmail] = useState("");
  return (
    <>
      <button
        onClick={handleOpenModal}
        className=" uppercase  rounded-full text-black bg-blur-sm bg-transparent px-6 py-3 z-50 text-sm font-semibold hover:scale-105 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-purple-300"
      >
        Login
      </button>
      {openModal && (
        <div className="fixed z-50 bg-transparent inset-0 h-screen w-screen flex items-center justify-center backdrop-blur-sm bg-opacity-50">
          <motion.div
            className="group z-50 relative flex w-full max-w-md flex-col gap-6 overflow-hidden rounded-3xl border border-neutral-200/70 bg-white/95 p-8 text-neutral-900 shadow-2xl shadow-amber-500/10 backdrop-blur dark:border-white/10 dark:bg-neutral-900/70 dark:text-neutral-100"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
          >
            <button
              onClick={handleCloseModal}
              className="absolute top-0 right-0 m-5 hover:scale-110 transition hover:text-red-400 hover:border border-red-400 rounded-md"
            >
              <FaTimes />
            </button>
            <motion.span
              aria-hidden
              className="pointer-events-none absolute -top-24 right-0 h-40 w-40 rounded-full bg-amber-300/45 blur-3xl dark:bg-amber-400/30"
              animate={{ y: [0, 18, -12, 0], scale: [1, 0.96, 1.08, 1] }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.span
              aria-hidden
              className="pointer-events-none absolute -bottom-28 left-6 h-44 w-44 rounded-full bg-purple-300/35 blur-3xl dark:bg-purple-500/25"
              animate={{ y: [0, -16, 10, 0], scale: [1, 1.12, 0.94, 1] }}
              transition={{
                duration: 22,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.1,
              }}
            />
            <Lifted
              title="Welcome"
              className="font-atkinson-hyperlegible-next text-4xl font-bold text-neutral-900 dark:text-white"
              underline={false}
            />
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Sign in to create events, sell tickets, and keep guests in the
              loop.
            </p>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02, rotate: -0.4 }}
              whileTap={{ scale: 0.97 }}
              className="relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-amber-300 via-purple-400 to-amber-300 px-6 py-3 text-sm font-semibold text-neutral-900 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_60%)] opacity-0 transition duration-500 group-hover:opacity-100" />
              <FaGoogle />
              {loading ? "Signing in…" : "Sign in with Google"}
            </motion.button>

            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
              or continue with
              <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
            </div>

            <motion.input
              placeholder="Email"
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 dark:border-white/20 dark:text-neutral-200 dark:hover:bg-white/10"
            ></motion.input>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02, rotate: 0.4 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 dark:border-white/20 dark:text-neutral-200 dark:hover:bg-white/10"
              onClick={() => {
                handleLogin();
              }}
            >
              Login
            </motion.button>
          </motion.div>
        </div>
      )}
    </>
  );
}
function disableScroll() {
  document.body.style.overflow = "hidden";
}

function enableScroll() {
  document.body.style.overflow = "auto";
}
