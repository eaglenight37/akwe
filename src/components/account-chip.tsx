import { useState } from "react";
import { signOut } from "@/lib/auth/client";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";

export function AccountChip() {
  const { isPending } = useCurrentUserState();
  const user = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);

  if (isPending) {
    return <div className="size-8 shrink-0 animate-pulse rounded-full bg-surface-2" />;
  }
  if (!user) return null;

  const label = user.displayName ?? user.primaryEmail ?? "Compte";

  return (
    <div className="flex min-w-0 items-center gap-2">
      {user.profileImageUrl ? (
        <img
          src={user.profileImageUrl}
          alt=""
          className="size-8 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cover/10 text-xs font-medium text-cover">
          {label.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="hidden max-w-[9rem] truncate text-xs font-medium sm:inline">
        {label}
      </span>
      <button
        type="button"
        disabled={signingOut}
        onClick={() => {
          setSigningOut(true);
          void signOut().catch(() => setSigningOut(false));
        }}
        className="shrink-0 text-xs text-muted underline-offset-4 hover:underline disabled:cursor-wait"
      >
        {signingOut ? "…" : "Sortir"}
      </button>
    </div>
  );
}
