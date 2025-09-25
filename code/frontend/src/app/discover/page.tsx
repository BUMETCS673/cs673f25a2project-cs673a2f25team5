"use client";
import { redirect } from "next/navigation";
import { toast } from "sonner";

export default function DiscoverPage({ cookie }: { cookie: string }) {
  if (!cookie) {
    console.log("No cookie found, redirecting to home");
    toast.error("Please login to view this page");
    redirect("/");
  }

  return <div>Discover</div>;
}
