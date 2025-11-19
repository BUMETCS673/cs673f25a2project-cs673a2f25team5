import type { ComponentPropsWithoutRef } from "react";

type EventCardSkeletonProps = {
  className?: string;
} & ComponentPropsWithoutRef<"div">;

const skeletonLineClasses =
  "h-3 rounded-full bg-neutral-200/80 dark:bg-neutral-800/80";

export function EventCardSkeleton({
  className = "",
  ...rest
}: EventCardSkeletonProps) {
  return (
    <div
      className={`h-full animate-pulse rounded-3xl border border-neutral-200/60 bg-white/60 shadow-inner shadow-amber-50/60 dark:border-white/10 dark:bg-neutral-900/60 dark:shadow-none ${className}`}
      {...rest}
    >
      <article className="flex h-full flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="h-6 w-32 rounded-full bg-neutral-200/90 dark:bg-neutral-800/90" />
          <span className="h-5 w-24 rounded-full bg-amber-100/80 dark:bg-amber-900/40" />
        </div>
        <p className="h-4 w-40 rounded-full bg-neutral-200/80 dark:bg-neutral-800/80" />
        <div className="space-y-2">
          <p className={`${skeletonLineClasses} w-full`} />
          <p className={`${skeletonLineClasses} w-11/12`} />
          <p className={`${skeletonLineClasses} w-3/4`} />
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full bg-neutral-200/80 dark:bg-neutral-800/80" />
            <span className={`${skeletonLineClasses} w-32`} />
          </span>
          <span className={`${skeletonLineClasses} w-20`} />
        </div>
      </article>
    </div>
  );
}
