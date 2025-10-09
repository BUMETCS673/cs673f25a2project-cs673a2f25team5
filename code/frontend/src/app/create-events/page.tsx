import { redirect } from "next/navigation";
import { CreateEventForm } from "@/component/events/CreateEventForm";
export default async function CreateEventsPage() {
  const cookie = { value: "test@test.com" };

  if (!cookie) {
    console.log("No cookie found, redirecting to home");
    redirect("/?error=unauthorized");
  }

  const organizerEmail = cookie.value ?? "";
  console.log(cookie);


  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-50/70 px-4 py-20 sm:px-6 lg:px-16 dark:bg-neutral-950">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-amber-200/40 via-transparent to-purple-200/35 blur-3xl dark:from-amber-400/10 dark:to-purple-500/15" />
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-500 dark:text-amber-300/80">
            Plan your next experience
          </p>
          <h1 className="mt-4 text-4xl font-bold text-neutral-900 sm:text-5xl dark:text-neutral-50">
            Create an event
          </h1>
          <p className="mt-3 text-base text-neutral-600 dark:text-neutral-400">
            Capture the essentials that will delight your guests—from when the
            doors open to how they should prepare. Once you are ready, wire this
            form up to your backend so Kickaas can publish the event to your
            audience.
          </p>
        </header>
        <CreateEventForm organizerEmail={organizerEmail} />
      </div>
    </main>
  );
}
