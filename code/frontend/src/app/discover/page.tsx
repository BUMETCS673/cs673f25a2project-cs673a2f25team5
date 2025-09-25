import { getLoginCookie } from "@/actions/auth";

export default async function DiscoverPage() {
  const cookie = await getLoginCookie();
  if (!cookie) {
    console.log("No cookie found, redirecting to home");
  }

  return <div>Discover</div>;
}
