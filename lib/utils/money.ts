import type { DisplayCurrency, Money } from "@/types/dashboard";
import { formatMoney } from "./format";

export function pickMoney(money: Money, currency: DisplayCurrency): number | null {
  return currency === "USD" ? money.usd : currency === "EUR" ? money.eur : money.ron;
}

export function formatMoneyIn(money: Money, currency: DisplayCurrency, digits?: number): string {
  return formatMoney(pickMoney(money, currency), currency, digits);
}

export const CURRENCIES: DisplayCurrency[] = ["RON", "EUR", "USD"];
