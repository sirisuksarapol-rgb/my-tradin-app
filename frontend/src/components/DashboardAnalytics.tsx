import { useEffect, useMemo, useState } from "react";

type MonthlyActivity = {
  month: string;
  users: number;
  posts: number;
};

type StatusCount = {
  status: string;
  total: number;
};

type DashboardAnalyticsResponse = {
  monthlyActivity: MonthlyActivity[];
  exchangeStatus: StatusCount[];
  reportStatus: StatusCount[];
};

const ANALYTICS_URL = `http://${window.location.hostname}:5000/api/admin/analytics`;

function monthLabel(value: string): string {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;

  return new Intl.DateTimeFormat("th-TH", {
    month: "short",
    year: "2-digit",
  }).format(new Date(year, month - 1, 1));
}

function statusColor(status: string): string {
  const normalized = status.toLowerCase();
  if (status === "สำเร็จ" || status === "ดำเนินการแล้ว" || normalized === "completed") {
    return "bg-emerald-500";
  }
  if (
    status.includes("ยกเลิก") ||
    status.includes("ไม่สำเร็จ") ||
    normalized === "cancelled" ||
    normalized === "failed"
  ) {
    return "bg-rose-500";
  }
  if (status === "รอตรวจสอบ" || normalized === "pending") {
    return "bg-amber-500";
  }
  return "bg-primary";
}

function StatusBars({
  title,
  description,
  rows,
  emptyText,
}: {
  title: string;
  description: string;
  rows: StatusCount[];
  emptyText: string;
}) {
  const maxTotal = Math.max(1, ...rows.map((row) => row.total));

  return (
    <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="space-y-5">
          {rows.map((row) => (
            <div key={row.status}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-muted-foreground">{row.status}</span>
                <span className="shrink-0 font-semibold tabular-nums text-foreground">
                  {row.total.toLocaleString("th-TH")}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${statusColor(row.status)}`}
                  style={{ width: `${(row.total / maxTotal) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function DashboardAnalytics() {
  const [analytics, setAnalytics] = useState<DashboardAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAnalytics() {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch(ANALYTICS_URL, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`โหลดข้อมูลกราฟไม่สำเร็จ (${response.status})`);
        }

        const result: DashboardAnalyticsResponse = await response.json();
        setAnalytics(result);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "ไม่สามารถเชื่อมต่อข้อมูลกราฟได้"
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadAnalytics();
    return () => controller.abort();
  }, []);

  const chartGeometry = useMemo(() => {
    const rows = analytics?.monthlyActivity ?? [];
    const maxValue = Math.max(1, ...rows.flatMap((row) => [row.users, row.posts]));
    const width = 640;
    const height = 220;
    const left = 32;
    const right = 16;
    const top = 18;
    const bottom = 28;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const x = (index: number) =>
      rows.length <= 1
        ? left + plotWidth / 2
        : left + (index / (rows.length - 1)) * plotWidth;
    const y = (value: number) => top + plotHeight - (value / maxValue) * plotHeight;

    return {
      rows,
      width,
      height,
      left,
      right,
      top,
      bottom,
      plotWidth,
      plotHeight,
      maxValue,
      userPoints: rows.map((row, index) => `${x(index)},${y(row.users)}`).join(" "),
      postPoints: rows.map((row, index) => `${x(index)},${y(row.posts)}`).join(" "),
      userCoordinates: rows.map((row, index) => ({ x: x(index), y: y(row.users), key: row.month })),
      postCoordinates: rows.map((row, index) => ({ x: x(index), y: y(row.posts), key: row.month })),
    };
  }, [analytics]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-52 rounded bg-muted" />
          <div className="h-56 rounded-xl bg-muted/60" />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">กำลังโหลดข้อมูลกราฟ...</p>
      </section>
    );
  }

  if (errorMessage || !analytics) {
    return (
      <section className="rounded-2xl border border-amber-500/30 bg-card p-5 shadow-sm">
        <h3 className="font-semibold text-foreground">ข้อมูลวิเคราะห์ระบบ</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {errorMessage || "ไม่พบข้อมูลกราฟ"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          ส่วนสถิติและเมนูอื่นของ Dashboard ยังคงทำงานตามปกติ
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5" aria-label="ข้อมูลวิเคราะห์ Dashboard">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">สถิติการใช้งานระบบ</h2>
        </div>
        <span className="text-xs text-muted-foreground">ข้อมูล 6 เดือนล่าสุดและสถานะปัจจุบัน</span>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-semibold text-foreground">แนวโน้มสมาชิกใหม่และโพสต์ใหม่</h3>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> สมาชิกใหม่
            </span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> โพสต์ใหม่
            </span>
          </div>
        </div>

        {chartGeometry.rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">ไม่มีข้อมูลในช่วงเวลานี้</p>
        ) : (
          <>
            <div className="w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
                role="img"
                aria-label="กราฟเส้นแสดงจำนวนสมาชิกใหม่และโพสต์ใหม่รายเดือน"
                className="h-auto w-full"
              >
                {[0, 1, 2, 3, 4].map((step) => {
                  const y = chartGeometry.top + (chartGeometry.plotHeight / 4) * step;
                  return (
                    <line
                      key={step}
                      x1={chartGeometry.left}
                      x2={chartGeometry.width - chartGeometry.right}
                      y1={y}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.10"
                      strokeDasharray="4 5"
                    />
                  );
                })}
                <polyline
                  points={chartGeometry.userPoints}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points={chartGeometry.postPoints}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {chartGeometry.userCoordinates.map((point) => (
                  <circle key={`user-${point.key}`} cx={point.x} cy={point.y} r="4" fill="#10b981" />
                ))}
                {chartGeometry.postCoordinates.map((point) => (
                  <circle key={`post-${point.key}`} cx={point.x} cy={point.y} r="4" fill="#3b82f6" />
                ))}
              </svg>
            </div>
            <div
              className="mt-2 grid gap-1 text-center text-[10px] text-muted-foreground sm:text-xs"
              style={{ gridTemplateColumns: `repeat(${chartGeometry.rows.length}, minmax(0, 1fr))` }}
            >
              {chartGeometry.rows.map((row) => (
                <span key={row.month} className="truncate">{monthLabel(row.month)}</span>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-500/5 p-3">
                <p className="text-xs text-muted-foreground">สมาชิกใหม่ในช่วงที่แสดง</p>
                <p className="mt-1 text-xl font-bold text-emerald-600">
                  {chartGeometry.rows.reduce((sum, row) => sum + row.users, 0).toLocaleString("th-TH")}
                </p>
              </div>
              <div className="rounded-xl bg-blue-500/5 p-3">
                <p className="text-xs text-muted-foreground">โพสต์ใหม่ในช่วงที่แสดง</p>
                <p className="mt-1 text-xl font-bold text-blue-600">
                  {chartGeometry.rows.reduce((sum, row) => sum + row.posts, 0).toLocaleString("th-TH")}
                </p>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <StatusBars
          title="ผลการแลกเปลี่ยน"
          description="นับตามสถานะที่บันทึกในฐานข้อมูล"
          rows={analytics.exchangeStatus}
          emptyText="ยังไม่มีข้อมูลการแลกเปลี่ยน"
        />
        <StatusBars
          title="สถานะรายงานปัญหา"
          description="ใช้ติดตามงานที่รอตรวจสอบและดำเนินการแล้ว"
          rows={analytics.reportStatus}
          emptyText="ยังไม่มีรายงานปัญหา"
        />
      </div>
    </section>
  );
}
