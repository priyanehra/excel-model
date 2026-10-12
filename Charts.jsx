import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { formatINR, compactINR, truncate } from '../format.js';

const ACCENT = '#4f46e5';
const NAVY = '#1e293b';
const MUTED = '#94a3b8';
const NEGATIVE = '#cbd5e1';
const PALETTE = ['#4f46e5', '#818cf8', '#1e293b', '#a5b4fc', '#475569', '#c7d2fe', '#94a3b8', '#64748b', '#e0e7ff'];
const GRID = '#e5e7eb';
const TICK = { fontSize: 12, fill: '#64748b' };

function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip">
      {label !== undefined && <div className="tooltip-title">{label}</div>}
      {payload.map((p) => (
        <div key={p.name} className="tooltip-row">
          <span className="dot" style={{ background: p.color || p.payload?.fill }} />
          {p.name}: <strong>{formatINR(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function ShareTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="tooltip">
      <div className="tooltip-title">{d.category}</div>
      <div className="tooltip-row"><strong>{d.count}</strong> transactions · <strong>{d.percent}%</strong></div>
    </div>
  );
}

function ChartCard({ title, subtitle, empty, children }) {
  return (
    <div className="card chart-card">
      <div className="chart-head">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {empty ? <div className="chart-empty">No data to display</div> : <div className="chart-body">{children}</div>}
    </div>
  );
}

const H = 300;

export default function Charts({ data }) {
  const { categoryTotals, categoryShare, monthlyTrend, incomeExpense, timeline, topCategories } = data;
  const donutColors = [ACCENT, MUTED];
  const donutEmpty = incomeExpense.income + incomeExpense.expenses === 0;

  return (
    <section className="chart-grid" id="charts">
      <ChartCard title="Total Amount by Category" subtitle="Net of income and expenses" empty={!categoryTotals.length}>
        <ResponsiveContainer width="100%" height={H}>
          <BarChart data={categoryTotals} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="category" tick={TICK} interval={0} angle={-30} textAnchor="end" height={64} tickFormatter={(v) => truncate(v)} />
            <YAxis tick={TICK} width={64} tickFormatter={compactINR} />
            <Tooltip content={<MoneyTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="total" name="Total" radius={[6, 6, 0, 0]}>
              {categoryTotals.map((c) => <Cell key={c.category} fill={c.total >= 0 ? ACCENT : NAVY} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Transactions by Category" subtitle="Share of transaction count" empty={!categoryShare.length}>
        <ResponsiveContainer width="100%" height={H}>
          <PieChart>
            <Pie data={categoryShare} dataKey="count" nameKey="category" outerRadius={95} label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {categoryShare.map((c, i) => <Cell key={c.category} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip content={<ShareTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Monthly Transaction Trend" subtitle="Income vs expenses per month" empty={!monthlyTrend.length}>
        <ResponsiveContainer width="100%" height={H}>
          <LineChart data={monthlyTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={TICK} />
            <YAxis tick={TICK} width={64} tickFormatter={compactINR} />
            <Tooltip content={<MoneyTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="income" name="Income" stroke={ACCENT} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="expenses" name="Expenses" stroke={NAVY} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Income vs Expenses" subtitle="Positive amounts vs absolute negative amounts" empty={donutEmpty}>
        <ResponsiveContainer width="100%" height={H}>
          <PieChart>
            <Pie data={incomeExpense.chart} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={2}>
              {incomeExpense.chart.map((_, i) => <Cell key={i} fill={donutColors[i]} />)}
            </Pie>
            <Tooltip content={<MoneyTooltip />} />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => `${value}: ${formatINR(incomeExpense.chart.find((c) => c.name === value)?.value)}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Balance Over Time" subtitle="Cumulative net amount by date" empty={!timeline.length}>
        <ResponsiveContainer width="100%" height={H}>
          <AreaChart data={timeline} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={TICK} minTickGap={40} />
            <YAxis tick={TICK} width={64} tickFormatter={compactINR} />
            <Tooltip content={<MoneyTooltip />} />
            <Area type="monotone" dataKey="balance" name="Balance" stroke={ACCENT} strokeWidth={2.5} fill="url(#areaFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top 5 Categories" subtitle="By total absolute transaction amount" empty={!topCategories.length}>
        <ResponsiveContainer width="100%" height={H}>
          <BarChart data={topCategories} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" tick={TICK} tickFormatter={compactINR} />
            <YAxis type="category" dataKey="category" tick={TICK} width={104} tickFormatter={(v) => truncate(v, 14)} />
            <Tooltip content={<MoneyTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="total" name="Total" fill={ACCENT} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}
