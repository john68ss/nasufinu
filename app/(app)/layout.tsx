import Image from "next/image";
import Link from "next/link";
import { Settings } from "lucide-react";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <nav
        aria-label="Principal"
        className="pt-safe sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70"
      >
        <div className="flex min-h-11 items-center justify-between gap-3 px-3 sm:px-5">
          <Link href="/" className="flex items-center gap-2 rounded-lg py-1.5           text-base font-semibold tracking-tight">
                      <Image src="/logo.png" alt="" width={51} height={40} unoptimized className="h-10 w-auto object-contain" />
                      NAȘU ȘI FINU
          </Link>
          <div className="flex items-center">
            <Link
              href="/settings"
              aria-label="Setări"
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <Settings className="size-4" />
            </Link>
          </div>
        </div>
      </nav>
      <main className="pb-safe space-y-4 px-3 py-3 sm:px-5 sm:py-4">{children}</main>
    </div>
  );
}
