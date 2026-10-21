"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Plug, Trash2, Wallet } from "lucide-react";
import {
  connectHiveosAction,
  disconnectHiveosAction,
  removeWalletAction,
  saveWalletAction,
  selectHiveosWorkerAction,
  type FormState,
} from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { IntegrationSummary } from "@/lib/settings/summary";

const IDLE: FormState = { error: null, message: null, farms: null };

const inputClass =
  "mt-1.5 block min-h-12 w-full rounded-xl border border-line-strong bg-surface-2 px-3.5 text-base text-foreground " +
  "placeholder:text-subtle focus:border-accent focus:outline-2 focus:outline-accent/40 disabled:opacity-50";

function Feedback({ state }: { state: FormState }) {
  return (
    <div role="status" aria-live="polite" className="min-h-5 text-sm">
      {state.error ? <span className="text-danger">{state.error}</span> : null}
      {!state.error && state.message ? (
        <span className="inline-flex items-center gap-1.5 text-ok">
          <CheckCircle2 className="size-4" />
          {state.message}
        </span>
      ) : null}
    </div>
  );
}

function WalletCard({ summary }: { summary: IntegrationSummary }) {
  const [saveState, save, saving] = useActionState(saveWalletAction, IDLE);
  const [removeState, remove, removing] = useActionState(removeWalletAction, IDLE);
  const disabled = summary.persistence === "none";
  const k = summary.kryptex;

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Wallet className="size-5 text-cyan" />
        <h2 className="font-semibold">Portofel PEARL (Kryptex)</h2>
      </div>
      <p className="text-sm text-muted">
        Câștigurile și soldul sunt citite din API-ul public al pool-ului Kryptex folosind această adresă. Nu este nevoie de cheie sau secret.
        {k.fromEnv ? " Momentan este luată dintr-o variabilă de mediu; salvarea aici o suprascrie." : ""}
      </p>
      <form action={save} key={k.address} className="space-y-3" noValidate>
        <div>
          <label htmlFor="address" className="text-sm font-medium text-muted">
            Adresa portofelului
          </label>
          <input
            id="address"
            name="address"
            defaultValue={k.address}
            required
            maxLength={160}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={disabled}
            className={`${inputClass} font-mono text-sm`}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="coin" className="text-sm font-medium text-muted">
              Moneda pool-ului
            </label>
            <input id="coin" name="coin" defaultValue={k.coin} maxLength={24} disabled={disabled} className={inputClass} />
          </div>
          <div>
            <label htmlFor="workerName" className="text-sm font-medium text-muted">
              Worker (opțional)
            </label>
            <input
              id="workerName"
              name="workerName"
              defaultValue={k.workerName ?? ""}
              maxLength={64}
              placeholder="toți workerii"
              disabled={disabled}
              className={inputClass}
            />
          </div>
        </div>
        <Feedback state={saveState} />
        <Button type="submit" variant="primary" disabled={saving || disabled} className="w-full">
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Salvează portofelul
        </Button>
      </form>
      {k.saved ? (
        <form action={remove}>
          <Button type="submit" variant="ghost" disabled={removing} className="w-full text-danger hover:text-danger">
            <Trash2 className="size-4" />
            Șterge portofelul salvat
          </Button>
          <Feedback state={removeState} />
        </form>
      ) : null}
    </Card>
  );
}

function HiveosCard({ summary }: { summary: IntegrationSummary }) {
  const [connectState, connect, connecting] = useActionState(connectHiveosAction, IDLE);
  const [selectState, select, selecting] = useActionState(selectHiveosWorkerAction, IDLE);
  const [disconnectState, disconnect, disconnecting] = useActionState(disconnectHiveosAction, IDLE);
  const disabled = summary.persistence === "none";
  const h = summary.hiveos;
  const farms = selectState.farms ?? connectState.farms;
  const workerCount = farms?.reduce((n, f) => n + f.workers.length, 0) ?? 0;

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Plug className="size-5 text-cyan" />
        <h2 className="font-semibold">Cont HiveOS</h2>
      </div>
      <p className="text-sm text-muted">
        HiveOS nu permite autentificarea Google pentru acces API. În HiveOS deschide <span className="text-foreground">Account → Authentication</span>,
        creează un <span className="text-foreground">Personal API token</span> și lipește-l aici. Este verificat, apoi salvat criptat pe server și nu mai este afișat niciodată.
      </p>

      {h.selected ? (
        <div className="rounded-xl border border-ok/30 bg-ok/10 px-3.5 py-3 text-sm">
          <div className="font-medium text-ok">Conectat</div>
          <div className="text-muted">
            {h.farmName} · {h.workerName}
          </div>
        </div>
      ) : h.fromEnv ? (
        <div className="rounded-xl border border-line-strong bg-surface-2 px-3.5 py-3 text-sm text-muted">
          Se folosesc tokenul și workerul din variabilele de mediu. Conectarea aici le suprascrie.
        </div>
      ) : null}

      <form action={connect} className="space-y-3" noValidate>
        <div>
          <label htmlFor="token" className="text-sm font-medium text-muted">
            Personal API token
          </label>
          <input
            id="token"
            name="token"
            type="password"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={4096}
            placeholder={h.hasToken ? "Token salvat — lasă gol pentru a-l refolosi" : "Lipește tokenul"}
            disabled={disabled}
            className={`${inputClass} font-mono text-sm`}
          />
        </div>
        <Feedback state={connectState} />
        <Button type="submit" variant="primary" disabled={connecting || disabled} className="w-full">
          {connecting ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />}
          {h.hasToken ? "Verifică / încarcă workerii" : "Conectează HiveOS"}
        </Button>
      </form>

      {farms && workerCount > 0 ? (
        <form action={select} className="space-y-3 border-t border-line pt-4">
          <label htmlFor="worker" className="text-sm font-medium text-muted">
            Rig de monitorizat
          </label>
          <select id="worker" name="worker" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Alege un worker…
            </option>
            {farms.map((farm) => (
              <optgroup key={farm.id} label={farm.name}>
                {farm.workers.map((w) => (
                  <option key={w.id} value={`${farm.id}:${w.id}`}>
                    {w.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <Feedback state={selectState} />
          <Button type="submit" variant="primary" disabled={selecting} className="w-full">
            {selecting ? <Loader2 className="size-4 animate-spin" /> : null}
            Folosește acest worker
          </Button>
        </form>
      ) : null}

      {h.hasToken ? (
        <form action={disconnect}>
          <Button type="submit" variant="ghost" disabled={disconnecting} className="w-full text-danger hover:text-danger">
            <Trash2 className="size-4" />
            Deconectează HiveOS
          </Button>
          <Feedback state={disconnectState} />
        </form>
      ) : null}
    </Card>
  );
}

export function IntegrationsPanel({ summary }: { summary: IntegrationSummary }) {
  return (
    <div className="space-y-4">
      {summary.persistence === "none" ? (
        <div role="alert" className="rounded-xl border border-warn/40 bg-warn/10 px-3.5 py-3 text-sm text-warn">
          Salvarea nu este disponibilă: acest deployment nu are bază de date. Adaugă integrarea Upstash Redis în Vercel (Storage →
          Marketplace), fă redeploy, apoi revino aici.
        </div>
      ) : null}
      <WalletCard summary={summary} />
      <HiveosCard summary={summary} />
    </div>
  );
}
