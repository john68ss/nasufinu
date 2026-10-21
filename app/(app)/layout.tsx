import Image from "next/image";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { requireSession } from "@/lib/auth/guard";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireSession();

  return (
    <div className="mx-auto w-full max-w-7xl">
      <nav
        aria-label="Principal"
        className="pt-safe sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70"
      >
        <div className="flex min-h-11 items-center justify-between gap-3 px-3 sm:px-5">
          <Link href="/" className="flex items-center gap-2 rounded-lg py-1.5 text-sm font-semibold tracking-tight">
            <Image src="/logo.png" alt="" width={28} height={28} unoptimized className="size-7 rounded-full object-cover" />
            Nasu și cu Finu
          </Link>
          <div className="flex items-center">
            <Link
              href="/settings"
              aria-label="Setări"
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <Settings className="size-4" />
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                aria-label="Deconectare"
                className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-danger"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="pb-safe space-y-4 px-3 py-3 sm:px-5 sm:py-4">{children}</main>
    </div>
  );
}
