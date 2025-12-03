import Link from "next/link";

type PaymentSuccessPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const resolvedSearchParams = await searchParams;
  const paymentIdParam = resolvedSearchParams?.payment_id;
  const paymentId = typeof paymentIdParam === "string" ? paymentIdParam : null;

  return (
    <main className="min-h-[60vh] h-screen bg-neutral-50 px-4 py-16 dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-100/70 bg-white/90 p-8 shadow-lg shadow-emerald-100/50 dark:border-emerald-500/20 dark:bg-neutral-900/80 dark:shadow-emerald-500/10">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
          Payment received
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
          Thanks for completing checkout.
        </h1>
        <p className="mt-3 text-neutral-700 dark:text-neutral-300">
          Your RSVP is being confirmed. We{"'"}ll update your event status as
          soon as Stripe notifies us.
        </p>
        {paymentId ? (
          <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
            Reference: <span className="font-mono">{paymentId}</span>
          </p>
        ) : null}
        <div className="mt-6 flex gap-3">
          <Link
            href="/events"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 dark:bg-emerald-500 dark:hover:bg-emerald-400"
          >
            Back to events
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-200/70 bg-white/80 px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 dark:border-white/10 dark:bg-neutral-800/70 dark:text-neutral-200 dark:hover:border-neutral-500"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
