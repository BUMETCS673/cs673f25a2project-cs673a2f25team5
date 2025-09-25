import Landing from "@/component/landing/Landing";
import { LoginForm } from "@/component/auth/LoginForm";
import { getLoginCookie } from "../actions/auth";
import { Signout } from "@/component/auth/Signout";

export default async function Page() {
  const cookie = await getLoginCookie();
  return (
    <div>
      {cookie ? <Signout /> : <LoginForm />}
      <Landing cookie={cookie?.value || ""} />
    </div>
  );
}
