import { redirect } from "next/navigation";
import { getLoginCookie } from "@/actions/auth";

export default async function EventsPage() {
  const cookie = await getLoginCookie();
  if (!cookie) {
    console.log("No cookie found, redirecting to home");
    redirect("/?error=unauthorized");
  }

  return <div>{cookie?.value}</div>;
}
