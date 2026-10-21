"use client";

import { useActionState } from "react";
import { Loader2, Lock } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const INITIAL: LoginState = { error: null };

const inputClass =
  "mt-1.5 block min-h-12 w-full rounded-xl border border-line-strong bg-surface-2 px-3.5 text-base text-foreground " +
  "placeholder:text-subtle focus:border-accent focus:outline-2 focus:outline-accent/40";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL);

  return (
    <Card className="p-5">
      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="username" className="text-sm font-medium text-muted">
            Utilizator
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            maxLength={128}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium text-muted">
            Parolă
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={256}
            className={inputClass}
          />
        </div>
        <div role="alert" aria-live="polite" className="min-h-5 text-sm text-danger">
          {state.error}
        </div>
        <Button type="submit" variant="primary" disabled={pending} className="w-full min-h-12">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
          {pending ? "Se autentifică…" : "Autentificare"}
        </Button>
      </form>
    </Card>
  );
}
