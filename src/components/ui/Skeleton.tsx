import React from "react";
import { cn } from "@/src/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-white/5", className)}
      {...props}
    />
  );
};

export const CardSkeleton = () => (
  <div className="glass relative rounded-2xl border border-white/5 p-6 h-[240px] flex flex-col justify-between">
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
      <div className="flex -space-x-2">
        <Skeleton className="h-8 w-8 rounded-full border-2 border-dark-bg" />
        <Skeleton className="h-8 w-8 rounded-full border-2 border-dark-bg" />
        <Skeleton className="h-8 w-8 rounded-full border-2 border-dark-bg" />
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  </div>
);

export const ListSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24 opacity-50" />
          </div>
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    ))}
  </div>
);
