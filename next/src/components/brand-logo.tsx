import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  alt = "HealthyTech Atlântico",
  className,
  imageClassName,
  priority = false,
  sizes = "120px",
}: {
  alt?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Image
        src="/logo-icon.png"
        alt={alt}
        fill
        sizes={sizes}
        className={cn("object-contain", imageClassName)}
        priority={priority}
      />
    </div>
  );
}
