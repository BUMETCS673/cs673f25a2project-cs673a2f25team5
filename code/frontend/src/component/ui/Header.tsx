import Link from "next/link";
import { LoginForm } from "../auth/LoginForm";
import { Signout } from "../auth/Signout";
import Lifted from "../text/Lifted";

export default function Header({ cookie }: { cookie: string }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm bg-opacity-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/">
          <Lifted title="Kickaas" />
        </Link>
        <div className="flex items-center gap-4 justify-end">
          <Link href="/discover">
            <Lifted title="Discover" />
          </Link>
          <Link href="/create-events">
            <Lifted title="Create Event" />
          </Link>
          {cookie ? <Signout /> : <LoginForm />}
        </div>
      </div>
    </header>
  );
}
