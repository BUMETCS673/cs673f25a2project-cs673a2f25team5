import Link from "next/link";

type PaymentCancelPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaymentCancelPage({
  searchParams,
}: PaymentCancelPageProps) {
  const resolvedSearchParams = await searchParams;
  const paymentIdParam = resolvedSearchParams?.payment_id;
  const paymentId = typeof paymentIdParam === "string" ? paymentIdParam : null;

  return (
    <main className="min-h-[60vh] h-screen bg-neutral-50 px-4 py-16 dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl rounded-3xl border border-amber-100/70 bg-white/90 p-8 shadow-lg shadow-amber-100/50 dark:border-amber-400/20 dark:bg-neutral-900/80 dark:shadow-amber-500/10">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">
          Checkout canceled
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
          Your RSVP isn{"'"}t finalized yet.
        </h1>
        <p className="mt-3 text-neutral-700 dark:text-neutral-300">
          You can reopen checkout anytime to finish payment and secure your
          spot.
        </p>
        {paymentId ? (
          <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
            Reference: <span className="font-mono">{paymentId}</span>
          </p>
        ) : null}
        <div className="mt-6 flex gap-3">
          <Link
            href="/events"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-200/70 bg-white/80 px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 dark:border-white/10 dark:bg-neutral-800/70 dark:text-neutral-200 dark:hover:border-amber-300/70"
          >
            Back to events
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 dark:bg-amber-400 dark:text-neutral-900 dark:hover:bg-amber-300"
          >
            Try again
          </Link>
        </div>
      </div>
    </main>
  );
}
