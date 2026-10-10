
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

type CategoryCount = {
  category: string;
  total: number;
};

type DashboardAnalyticsResponse = {
  monthlyActivity: MonthlyActivity[];
  exchangeStatus: StatusCount[];
  reportStatus: StatusCount[];
  postsByCategory?: CategoryCount[];
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

  if (
    status === "สำเร็จ" ||
    status === "ดำเนินการแล้ว" ||
    normalized === "completed" ||
    normalized === "accepted"
  ) {
    return "bg-emerald-500";
  }

  if (
    status.includes("ยกเลิก") ||
    status.includes("ไม่สำเร็จ") ||
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "failed"
  ) {
    return "bg-rose-500";
  }

  if (
    status.includes("รอ") ||
    normalized === "pending"
  ) {
    return "bg-amber-500";
  }

  return "bg-primary";
}

function exchangeColor(status: string): string {
  const normalized = status.toLowerCase();

  if (
    status.includes("สำเร็จ") ||
    status.includes("เสร็จสิ้น") ||
    normalized === "completed" ||
    normalized === "accepted"
  ) {
    return "#10b981";
  }

  if (
    status.includes("ยกเลิก") ||
    status.includes("ไม่สำเร็จ") ||
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "failed"
  ) {
    return "#f43f5e";
  }

  if (
    status.includes("รอ") ||
    normalized === "pending"
  ) {
    return "#f59e0b";
  }

  return "#64748b";
}

function StatusBars({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: StatusCount[];
  emptyText: string;
}) {
  const maxTotal = Math.max(1, ...rows.map((row) => row.total));

  return (
    <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <div className="space-y-5">
          {rows.map((row) => (
            <div key={row.status}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-muted-foreground">
                  {row.status}
                </span>

                <span className="shrink-0 font-semibold tabular-nums text-foreground">
                  {row.total.toLocaleString("th-TH")}
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${statusColor(
                    row.status
                  )}`}
                  style={{
                    width: `${Math.max(0, (row.total / maxTotal) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CategoryBars({
  rows,
}: {
  rows: CategoryCount[];
}) {
  const maxTotal = Math.max(1, ...rows.map((row) => row.total));

  return (
    <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-6">
        <h3 className="font-semibold text-foreground">
          โพสต์ตามหมวดหมู่
        </h3>
      </div>

      {rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          ยังไม่มีข้อมูลโพสต์ตามหมวดหมู่
        </p>
      ) : (
        <div className="space-y-5">
          {rows.map((row) => {
            const percentage = Math.max(
              0,
              (row.total / maxTotal) * 100
            );

            return (
              <div key={row.category}>
                <div className="mb-2 flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0 break-words text-muted-foreground">
                    {row.category}
                  </span>

                  <span className="shrink-0 font-semibold tabular-nums text-foreground">
                    {row.total.toLocaleString("th-TH")}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-6 border-t border-border/60 pt-4">
          <p className="text-xs text-muted-foreground">
            จำนวนโพสต์ทั้งหมดในหมวดหมู่ที่แสดง
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {rows
              .reduce((sum, row) => sum + row.total, 0)
              .toLocaleString("th-TH")}
          </p>
        </div>
      )}
    </section>
  );
}

function ExchangeDonut({
  rows,
}: {
  rows: StatusCount[];
}) {
  const total = rows.reduce(
    (sum, row) => sum + Math.max(0, row.total),
    0
  );

  const circumference = 2 * Math.PI * 58;

  let accumulated = 0;

  const segments = rows
    .filter((row) => row.total > 0)
    .map((row) => {
      const length = (row.total / Math.max(1, total)) * circumference;

      const segment = {
        ...row,
        color: exchangeColor(row.status),
        length,
        offset: accumulated,
      };

      accumulated += length;

      return segment;
    });

  return (
    <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h3 className="font-semibold text-foreground">
          ผลการแลกเปลี่ยน
        </h3>
      </div>

      {rows.length === 0 || total === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          ยังไม่มีข้อมูลการแลกเปลี่ยน
        </p>
      ) : (
        <>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
            <div className="relative w-full max-w-[220px] shrink-0">
              <svg
                viewBox="0 0 160 160"
                role="img"
                aria-label={`กราฟโดนัทผลการแลกเปลี่ยนทั้งหมด ${total} รายการ`}
                className="h-auto w-full"
              >
                <circle
                  cx="80"
                  cy="80"
                  r="58"
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeWidth="19"
                />

                {segments.map((segment) => (
                  <circle
                    key={segment.status}
                    cx="80"
                    cy="80"
                    r="58"
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="19"
                    strokeDasharray={`${segment.length} ${
                      circumference - segment.length
                    }`}
                    strokeDashoffset={-segment.offset}
                    strokeLinecap="butt"
                    transform="rotate(-90 80 80)"
                  />
                ))}
              </svg>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground">
                  ทั้งหมด
                </span>
                <span className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                  {total.toLocaleString("th-TH")}
                </span>
                <span className="text-xs text-muted-foreground">
                  รายการ
                </span>
              </div>
            </div>

            <div className="w-full min-w-0 space-y-4">
              {rows.map((row) => {
                const percentage =
                  total > 0 ? (row.total / total) * 100 : 0;

                return (
                  <div
                    key={row.status}
                    className="flex items-start gap-3"
                  >
                    <span
                      className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: exchangeColor(row.status),
                      }}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="break-words text-sm text-muted-foreground">
                          {row.status}
                        </span>

                        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                          {row.total.toLocaleString("th-TH")}
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        {percentage.toLocaleString("th-TH", {
                          maximumFractionDigits: 1,
                        })}
                        %
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default function DashboardAnalytics() {
  const [analytics, setAnalytics] =
    useState<DashboardAnalyticsResponse | null>(null);

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
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `โหลดข้อมูลกราฟไม่สำเร็จ (${response.status})`
          );
        }

        const result: DashboardAnalyticsResponse =
          await response.json();

        setAnalytics(result);
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "ไม่สามารถเชื่อมต่อข้อมูลกราฟได้"
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadAnalytics();

    return () => controller.abort();
  }, []);

  const chartGeometry = useMemo(() => {
    const rows = analytics?.monthlyActivity ?? [];

    const maxValue = Math.max(
      1,
      ...rows.flatMap((row) => [
        row.users,
        row.posts,
      ])
    );

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

    const y = (value: number) =>
      top + plotHeight - (value / maxValue) * plotHeight;

    return {
      rows,
      width,
      height,
      left,
      right,
      top,
      plotHeight,
      maxValue,
      userPoints: rows
        .map((row, index) => `${x(index)},${y(row.users)}`)
        .join(" "),
      postPoints: rows
        .map((row, index) => `${x(index)},${y(row.posts)}`)
        .join(" "),
      userCoordinates: rows.map((row, index) => ({
        x: x(index),
        y: y(row.users),
        key: row.month,
        value: row.users,
      })),
      postCoordinates: rows.map((row, index) => ({
        x: x(index),
        y: y(row.posts),
        key: row.month,
        value: row.posts,
      })),
    };
  }, [analytics]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-52 rounded bg-muted" />
          <div className="h-56 rounded-xl bg-muted/60" />
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          กำลังโหลดข้อมูลกราฟ...
        </p>
      </section>
    );
  }

  if (errorMessage || !analytics) {
    return (
      <section className="rounded-2xl border border-amber-500/30 bg-card p-5 shadow-sm">
        <h3 className="font-semibold text-foreground">
          ข้อมูลวิเคราะห์ระบบ
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          {errorMessage || "ไม่พบข้อมูลกราฟ"}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          ส่วนสถิติและเมนูอื่นของ Dashboard ยังคงทำงานตามปกติ
        </p>
      </section>
    );
  }

  const categoryRows = analytics.postsByCategory ?? [];

  return (
    <section
      className="space-y-5"
      aria-label="ข้อมูลวิเคราะห์ Dashboard"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            สถิติการใช้งานระบบ
          </h2>
        </div>

        <span className="text-xs text-muted-foreground">
          ข้อมูล 6 เดือนล่าสุดและสถานะปัจจุบัน
        </span>
      </div>

      {/* กราฟเส้น: สมาชิกใหม่และโพสต์ใหม่ */}
      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-semibold text-foreground">
              แนวโน้มสมาชิกใหม่และโพสต์ใหม่
            </h3>
          </div>

          <div className="flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              สมาชิกใหม่
            </span>

            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              โพสต์ใหม่
            </span>
          </div>
        </div>

        {chartGeometry.rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            ไม่มีข้อมูลในช่วงเวลานี้
          </p>
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
                  const y =
                    chartGeometry.top +
                    (chartGeometry.plotHeight / 4) * step;

                  const value = Math.round(
                    chartGeometry.maxValue * (1 - step / 4)
                  );

                  return (
                    <g key={step}>
                      <line
                        x1={chartGeometry.left}
                        x2={chartGeometry.width - chartGeometry.right}
                        y1={y}
                        y2={y}
                        stroke="currentColor"
                        strokeOpacity="0.10"
                        strokeDasharray="4 5"
                      />

                      <text
                        x={chartGeometry.left - 6}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="currentColor"
                        opacity="0.6"
                      >
                        {value}
                      </text>
                    </g>
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
                  <g key={`user-${point.key}`}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#10b981"
                    />
                    <title>
                      {`สมาชิกใหม่ ${monthLabel(point.key)}: ${point.value}`}
                    </title>
                  </g>
                ))}

                {chartGeometry.postCoordinates.map((point) => (
                  <g key={`post-${point.key}`}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#3b82f6"
                    />
                    <title>
                      {`โพสต์ใหม่ ${monthLabel(point.key)}: ${point.value}`}
                    </title>
                  </g>
                ))}
              </svg>
            </div>

            <div
              className="mt-2 grid gap-1 text-center text-[10px] text-muted-foreground sm:text-xs"
              style={{
                gridTemplateColumns: `repeat(${chartGeometry.rows.length}, minmax(0, 1fr))`,
              }}
            >
              {chartGeometry.rows.map((row) => (
                <span key={row.month} className="truncate">
                  {monthLabel(row.month)}
                </span>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-500/5 p-3">
                <p className="text-xs text-muted-foreground">
                  สมาชิกใหม่ในช่วงที่แสดง
                </p>

                <p className="mt-1 text-xl font-bold text-emerald-600">
                  {chartGeometry.rows
                    .reduce((sum, row) => sum + row.users, 0)
                    .toLocaleString("th-TH")}
                </p>
              </div>

              <div className="rounded-xl bg-blue-500/5 p-3">
                <p className="text-xs text-muted-foreground">
                  โพสต์ใหม่ในช่วงที่แสดง
                </p>

                <p className="mt-1 text-xl font-bold text-blue-600">
                  {chartGeometry.rows
                    .reduce((sum, row) => sum + row.posts, 0)
                    .toLocaleString("th-TH")}
                </p>
              </div>
            </div>
          </>
        )}
      </section>

      {/* กราฟแท่ง: โพสต์ตามหมวดหมู่ */}
      <CategoryBars rows={analytics.postsByCategory ?? []} />

      {/* กราฟโดนัท: ผลการแลกเปลี่ยน และแถบสถานะรายงาน */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ExchangeDonut rows={analytics.exchangeStatus} />

        <StatusBars
          title="สถานะรายงานปัญหา"
          rows={analytics.reportStatus}
          emptyText="ยังไม่มีรายงานปัญหา"
        />
      </div>
    </section>
  );
}
