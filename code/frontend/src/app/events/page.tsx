import { getLoginCookie } from "../../actions/auth";
import { redirect } from "next/navigation";

export default async function EventsPage() {
  const cookie = await getLoginCookie();
  console.log(cookie);
  if (!cookie) {
    redirect("/");
  }

  return <div>{cookie?.value}</div>;
}
