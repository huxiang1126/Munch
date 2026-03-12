import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CreditTransactionItem } from "@/types/api";

interface CreditHistoryProps {
  items: CreditTransactionItem[];
}

export function CreditHistory({ items }: CreditHistoryProps) {
  return (
    <Card className="surface-panel">
      <CardHeader>
        <CardTitle>最近流水</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-border/70 bg-black/10 px-4 py-3"
            >
              <div>
                <p className="text-sm text-text-primary">{item.description}</p>
                <p className="text-xs text-text-tertiary">{item.createdAt}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm text-text-primary">
                  {item.amount > 0 ? `+${item.amount}` : item.amount}
                </span>
                <p className="text-xs text-text-tertiary">余额 {item.balanceAfter}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-text-secondary">
            暂无积分流水
          </div>
        )}
      </CardContent>
    </Card>
  );
}
