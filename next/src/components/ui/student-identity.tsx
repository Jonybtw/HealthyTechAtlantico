"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, getStudentSwatch } from "@/components/ui/student-picker";
import { cn } from "@/lib/utils";

type StudentIdentityInput = {
  id: string;
  name: string;
};

interface StudentIdentityProps {
  student: StudentIdentityInput;
  subtitle?: React.ReactNode;
  className?: string;
  nameClassName?: string;
  subtitleClassName?: string;
  size?: "sm" | "md";
}

export function StudentIdentity({
  student,
  subtitle,
  className,
  nameClassName,
  subtitleClassName,
  size = "md",
}: StudentIdentityProps) {
  const avatarSizeClass = size === "sm" ? "size-7" : "size-9";
  const initialsSizeClass = size === "sm" ? "text-tiny" : "text-micro";
  const nameSizeClass = size === "sm" ? "text-sm" : "text-sm";

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Avatar className={cn(avatarSizeClass, "shrink-0")}>
        <AvatarFallback
          className={cn(
            "rounded-full border-2 border-white font-bold shadow-sm",
            initialsSizeClass,
          )}
          style={getStudentSwatch(student)}
        >
          {getInitials(student.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0">
        <p
          className={cn(
            "truncate font-bold leading-tight text-navy-800 transition-colors group-hover:text-gold-600 dark:text-foreground dark:group-hover:text-gold-300",
            nameSizeClass,
            nameClassName,
          )}
        >
          {student.name}
        </p>
        {subtitle ? (
          <div
            className={cn(
              "truncate text-xs text-muted-foreground",
              subtitleClassName,
            )}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}
