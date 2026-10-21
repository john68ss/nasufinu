import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Autentificare" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "";

  return (
    <main className="pt-safe pb-safe mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Image src="/logo.png" alt="" width={72} height={72} unoptimized priority className="size-[72px] rounded-full object-cover ring-4 ring-cyan/20" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Nasu și cu Finu</h1>
          <p className="mt-1 text-sm text-muted">Acces privat. Autentifică-te pentru a continua.</p>
        </div>
      </div>
      <LoginForm next={next} />
    </main>
  );
}
