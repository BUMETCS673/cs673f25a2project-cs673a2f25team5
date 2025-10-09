"use client";

export default function Heading() {
  return (
    <div className="h-screen w-full relative rounded-2xl pointer-events-auto overflow-hidden">
      <div className="absolute inset-0 -z-10"></div>

      {/* Only text fades */}
      <main className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-2xl text-neutral-900 dark:text-neutral-100">
        <h1 className="z-50 font-atkinson-hyperlegible-next font-bold text-7xl text-neutral-900 dark:text-neutral-100">
          Kickaas
        </h1>
        <h2 className={`font-bold font-sanchez`}>Your Event Manager</h2>
        <p className={`max-w-2xl text-center`}>
          Plan, Manage, and Experience Events — All in One Place
        </p>
        <div className="flex gap-4">
          <a
            href="/create-events"
            className="rounded-md bg-amber-400 px-4 py-2 font-medium text-black transition hover:bg-amber-300"
          >
            Create an Event
          </a>
        </div>
      </main>
    </div>
  );
}
