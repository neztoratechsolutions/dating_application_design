import { createFileRoute } from "@tanstack/react-router";
import { TRANSACTIONS } from "@/lib/mock-data";
import { PageHeader } from "@/components/ui-kit";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

export const Route = createFileRoute("/app/wallet/transactions")({ component: Tx });

function Tx() {
  return (
    <div>
      <PageHeader title="Transactions" subtitle="All your wallet activity" />
      <div className="space-y-2">
        {TRANSACTIONS.map((t) => (
          <div key={t.id} className="glass rounded-xl p-3 flex items-center gap-3">
            <div className={`rounded-full p-2 ${t.coins > 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
              {t.coins > 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium capitalize">{t.note || t.type}</p>
              <p className="text-[10px] text-muted-foreground">{t.date} · {t.status}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${t.coins > 0 ? "text-success" : ""}`}>{t.coins > 0 ? "+" : ""}{t.coins}</p>
              {t.amount > 0 && <p className="text-[10px] text-muted-foreground">₹{t.amount}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
