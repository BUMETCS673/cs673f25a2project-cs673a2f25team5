import { CardContent, CardHeader } from "@/component/ui/card";

export function ProfileHeaderSkeleton() {
  return (
    <>
      <CardHeader className="h-60 !rounded-lg overflow-hidden">
        <div className="shimmer h-full w-full rounded-lg" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="shimmer size-[60px] rounded-full" />
            <div className="space-y-2">
              <div className="h-5 w-40 rounded-full bg-neutral-200/80 dark:bg-neutral-800/70" />
              <div className="h-4 w-48 rounded-full bg-neutral-200/70 dark:bg-neutral-800/60" />
            </div>
          </div>
          <div className="space-y-2 text-right">
            <div className="h-4 w-36 rounded-full bg-neutral-200/70 dark:bg-neutral-800/60" />
            <div className="h-4 w-28 rounded-full bg-neutral-200/70 dark:bg-neutral-800/60" />
          </div>
        </div>
      </CardContent>
    </>
  );
}
