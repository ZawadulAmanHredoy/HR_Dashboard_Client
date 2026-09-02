import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Round avatar image that degrades to initials when the picture is missing or
 * fails to load (e.g. an old avatar_url pointing at a host the browser refuses).
 */
export function Avatar({
  src,
  initials,
  name,
  className,
  imgClassName,
  ...imgProps
}: {
  src?: string | null;
  initials?: string | null;
  name?: string;
  className?: string;
  imgClassName?: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src">) {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(src) && !failed;
  const fallback = (initials ?? name ?? "?").slice(0, 2).toUpperCase();

  return (
    <span
      className={cn(
        "overflow-hidden rounded-full bg-brand-100 text-brand-600",
        className,
      )}
    >
      {showImg ? (
        <img
          src={src!}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-cover", imgClassName)}
          {...imgProps}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[0.7em] font-semibold leading-none">
          {fallback}
        </span>
      )}
    </span>
  );
}