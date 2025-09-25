"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Landing from "@/component/landing/Landing";
import { getLoginCookie } from "@/actions/auth";

export default function Page() {
  const [cookie, setCookie] = useState<string>();
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  useEffect(() => {
    if (error === "unauthorized") {
      toast.error("You are not authorized to access this page");
    }
  }, [error]);

  useEffect(() => {
    async function readCookie() {
      const nextCookie = await getLoginCookie();
      setCookie(nextCookie?.value);
    }
    readCookie();
  }, []);

  return <Landing cookie={cookie ?? ""} />;
}
