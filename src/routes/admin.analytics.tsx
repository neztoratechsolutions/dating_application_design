import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin-shared";
import { GlassCard } from "@/components/ui-kit";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from "recharts";
import { EARNINGS_DATA } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/analytics")({
  component: () => (
    <AdminPlaceholder title="Analytics" subtitle="Platform performance">
      <GlassCard>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={EARNINGS_DATA}>
              <XAxis dataKey="day" stroke="#888" fontSize={11} />
              <Tooltip contentStyle={{ background: "rgba(20,15,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
              <Line type="monotone" dataKey="earnings" stroke="oklch(0.7 0.22 350)" strokeWidth={3} dot={{ fill: "oklch(0.7 0.22 350)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </AdminPlaceholder>
  ),
});
