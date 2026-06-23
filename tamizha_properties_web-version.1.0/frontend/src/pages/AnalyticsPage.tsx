import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { I } from '../components/Icons';
import { reportsApi, DashboardStats, DistrictPerf } from '../api/reports.api';

const PRICE_INDEX = [
  { district: 'Chennai ECR',    pricePerSqft: 12400, change: +18.2, demand: 'fire',   absorption: 28, inventory: 42 },
  { district: 'Coimbatore',     pricePerSqft: 7800,  change: +12.4, demand: 'fire',   absorption: 32, inventory: 38 },
  { district: 'Tirunelveli',    pricePerSqft: 8750,  change: +23.5, demand: 'warm',   absorption: 42, inventory: 28 },
  { district: 'Malaysia KL',    pricePerSqft: 15200, change: +9.8,  demand: 'warm',   absorption: 22, inventory: 12 },
  { district: 'Tenkasi',        pricePerSqft: 4200,  change: +6.1,  demand: 'ok',     absorption: 64, inventory: 14 },
  { district: 'Nagercoil',      pricePerSqft: 5600,  change: +4.2,  demand: 'low',    absorption: 70, inventory: 12 },
];

const NRI_COUNTRIES = [
  { flag: '🇸🇬', country: 'Singapore', leads: 84, pct: 36, value: '₹24.8 Cr' },
  { flag: '🇲🇾', country: 'Malaysia',  leads: 62, pct: 27, value: '₹18.4 Cr' },
  { flag: '🇦🇪', country: 'UAE',        leads: 48, pct: 21, value: '₹14.2 Cr' },
  { flag: '🇬🇧', country: 'UK',         leads: 22, pct: 10, value: '₹6.8 Cr' },
  { flag: '🇺🇸', country: 'USA',        leads: 14, pct: 6,  value: '₹4.1 Cr' },
];

const INVENTORY_AGING = [
  { range: '0–30 days',  count: 42, pct: 100 },
  { range: '31–60 days', count: 28, pct: 67 },
  { range: '61–90 days', count: 18, pct: 43 },
  { range: '90+ days',   count: 11, pct: 26 },
];

const MARKET_VELOCITY = [
  { district: 'Chennai ECR',   days: 28, trend: 'up' },
  { district: 'Coimbatore',    days: 32, trend: 'up' },
  { district: 'Tirunelveli',   days: 42, trend: 'neutral' },
  { district: 'Malaysia KL',   days: 22, trend: 'up' },
  { district: 'Tenkasi',       days: 64, trend: 'down' },
  { district: 'Nagercoil',     days: 70, trend: 'down' },
];

const MONTHLY_PRICE = [
  { month: 'Jan', cbe: 7.1, chn: 11.2, tvl: 7.2 },
  { month: 'Feb', cbe: 7.2, chn: 11.4, tvl: 7.5 },
  { month: 'Mar', cbe: 7.2, chn: 11.6, tvl: 7.8 },
  { month: 'Apr', cbe: 7.4, chn: 11.8, tvl: 8.0 },
  { month: 'May', cbe: 7.5, chn: 12.0, tvl: 8.2 },
  { month: 'Jun', cbe: 7.6, chn: 12.1, tvl: 8.4 },
  { month: 'Jul', cbe: 7.7, chn: 12.2, tvl: 8.5 },
  { month: 'Aug', cbe: 7.7, chn: 12.3, tvl: 8.6 },
  { month: 'Sep', cbe: 7.8, chn: 12.4, tvl: 8.7 },
  { month: 'Oct', cbe: 7.8, chn: 12.4, tvl: 8.7 },
  { month: 'Nov', cbe: 7.8, chn: 12.4, tvl: 8.7 },
  { month: 'Dec', cbe: 7.8, chn: 12.4, tvl: 8.75 },
];

function MultiLineChart() {
  const w = 680, h = 200, pad = 24;
  const series = [
    { key: 'cbe', label: 'Coimbatore', color: '#E2C36D' },
    { key: 'chn', label: 'Chennai ECR', color: '#0E1117' },
    { key: 'tvl', label: 'Tirunelveli', color: '#3B82F6' },
  ] as const;
  const allVals = MONTHLY_PRICE.flatMap(d => [d.cbe, d.chn, d.tvl]);
  const minV = 6.5, maxV = 13;
  const step = (w - pad * 2) / (MONTHLY_PRICE.length - 1);

  const pts = (key: 'cbe' | 'chn' | 'tvl') =>
    MONTHLY_PRICE.map((d, i) => [
      pad + i * step,
      h - pad - ((d[key] - minV) / (maxV - minV)) * (h - pad * 2)
    ]);

  const pathFor = (key: 'cbe' | 'chn' | 'tvl') => {
    const p = pts(key);
    return p.map((pt, i) => (i === 0 ? `M${pt[0]},${pt[1]}` : `L${pt[0]},${pt[1]}`)).join(' ');
  };

  return (
    <div>
      <svg width="100%" height={h + 28} viewBox={`0 0 ${w} ${h + 28}`} preserveAspectRatio="none">
        {[0,1,2,3,4].map(i => (
          <line key={i} x1={pad} x2={w - pad}
            y1={pad + i * ((h - pad * 2) / 4)}
            y2={pad + i * ((h - pad * 2) / 4)}
            stroke="#EFF0F4" strokeWidth="1" strokeDasharray="4 4"/>
        ))}
        {series.map(s => (
          <path key={s.key} d={pathFor(s.key)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        ))}
        {MONTHLY_PRICE.map((d, i) => (
          <text key={d.month} x={pad + i * step} y={h + 20}
            fontSize="9" fill="#6B7280" textAnchor="middle" fontWeight="500">{d.month}</text>
        ))}
        {/* Y-axis labels */}
        {[0,1,2,3,4].map(i => {
          const val = maxV - i * ((maxV - minV) / 4);
          return (
            <text key={i} x={pad - 4} y={pad + i * ((h - pad * 2) / 4) + 3}
              fontSize="8" fill="#9CA3B5" textAnchor="end" fontWeight="600">
              ₹{val.toFixed(0)}k
            </text>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 20, paddingTop: 4 }}>
        {series.map(s => (
          <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)' }}>
            <span style={{ width: 14, height: 3, background: s.color, borderRadius: 2, display: 'inline-block' }}/>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function DemandLabel({ score }: { score: string }) {
  if (score === 'fire') return <span className="tp-demand-score hot">🔥 High</span>;
  if (score === 'warm') return <span className="tp-demand-score warm">📈 Growing</span>;
  if (score === 'ok') return <span className="tp-demand-score good">✅ Steady</span>;
  return <span className="tp-demand-score low">📉 Low</span>;
}

function VelocityBadge({ trend }: { trend: string }) {
  if (trend === 'up') return <span className="tp-velocity up">↗ Faster</span>;
  if (trend === 'down') return <span className="tp-velocity down">↘ Slower</span>;
  return <span className="tp-velocity neutral">→ Steady</span>;
}

function AbsorptionChart() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {INVENTORY_AGING.map(r => (
        <div key={r.range}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
            <span style={{ fontWeight: 600 }}>{r.range}</span>
            <span style={{ fontFamily: 'var(--f-mono)', color: 'var(--text-3)', fontSize: 11 }}>{r.count} properties · {r.pct}%</span>
          </div>
          <div style={{ height: 20, background: 'var(--bg)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${r.pct}%`,
              background: r.pct === 100
                ? 'linear-gradient(90deg, #0E1117, #1F2433)'
                : r.pct > 60
                ? 'linear-gradient(90deg, #E2C36D, #C5A44E)'
                : 'linear-gradient(90deg, rgba(226,195,109,0.5), rgba(226,195,109,0.25))',
              borderRadius: 6, transition: 'width 0.5s ease'
            }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [districts, setDistricts] = useState<DistrictPerf[]>([]);

  useEffect(() => {
    reportsApi.getDashboard().then(setDashStats).catch(() => {});
    reportsApi.getDistricts().then(setDistricts).catch(() => {});
  }, []);

  const districtIndex = PRICE_INDEX.map(row => {
    const live = districts.find(d => d.district.toLowerCase().includes(row.district.toLowerCase().split(' ')[0]));
    return { ...row, inventory: live?.listed ?? row.inventory };
  });

  return (
    <div className="tp-layout">
      <Sidebar />
      <div className="tp-main">
        <Topbar searchPlaceholder="Search market data, district or metric…" />
        <div className="tp-content tp-fadein">

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="tp-eyebrow">Market Intelligence</span>
              <h1 className="tp-h1">Analytics &amp; <em>Insights</em></h1>
              <p className="tp-subtitle">Real-time price indices, NRI investment flows, demand scores and inventory absorption rates across all markets.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <div style={{ display: 'inline-flex', padding: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <button className="tp-chip" style={{ background: 'transparent', border: 'none', padding: '6px 12px', fontSize: 12 }}>Monthly</button>
                <button className="tp-chip active" style={{ padding: '6px 12px', fontSize: 12 }}>Quarterly</button>
                <button className="tp-chip" style={{ background: 'transparent', border: 'none', padding: '6px 12px', fontSize: 12 }}>YTD</button>
              </div>
            </div>
          </div>

          {/* KPI rail */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Avg Price/Sqft', val: '₹9,280', delta: '+14.2%', up: true },
              { label: 'Total Inventory', val: dashStats ? String(dashStats.totalProperties) : '—', delta: '+12 this month', up: true },
              { label: 'Sold this Quarter', val: districts.length ? String(districts.reduce((s, d) => s + d.sold, 0)) : '—', delta: '+22%', up: true },
              { label: 'Avg Days on Market', val: '42', delta: '-6 days', up: true },
              { label: 'Total Leads', val: dashStats ? String(dashStats.totalLeads) : '—', delta: '+31%', up: true },
            ].map((k, i) => (
              <div key={i} className="tp-mini-stat">
                <div className="tp-mini-stat-label" style={{ marginBottom: 8 }}>{k.label}</div>
                <div className="tp-mini-stat-val">{k.val}</div>
                <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: k.up ? '#15803D' : '#B91C1C', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {k.up ? I.trendUp : I.trendDown} {k.delta}
                </div>
              </div>
            ))}
          </div>

          {/* Price index chart + NRI breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Multi-line price chart */}
            <div className="tp-card">
              <div className="tp-card-head">
                <div>
                  <div className="tp-card-title">Price per Sqft Trend</div>
                  <div className="tp-card-sub">₹/sqft by district · Jan – Dec 2025</div>
                </div>
                <button className="tp-act gold">{I.more}</button>
              </div>
              <div style={{ padding: '16px 20px 20px' }}>
                <MultiLineChart/>
              </div>
            </div>

            {/* NRI breakdown */}
            <div className="tp-card">
              <div className="tp-card-head">
                <div>
                  <div className="tp-card-title">NRI Investor Origins</div>
                  <div className="tp-card-sub">Top 5 countries · Q4 2025</div>
                </div>
                <span className="tp-pill tp-pill-gold">{I.globe} 230 total</span>
              </div>
              <div style={{ padding: '18px 20px' }}>
                {NRI_COUNTRIES.map((c, i) => (
                  <div key={i} className="tp-nri-row">
                    <span className="tp-nri-flag">{c.flag}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12, fontWeight: 600 }}>
                        <span>{c.country}</span>
                        <span style={{ color: 'var(--text-3)', fontFamily: 'var(--f-mono)', fontSize: 11 }}>{c.leads} leads · {c.pct}%</span>
                      </div>
                      <div className="tp-nri-bar">
                        <div className="tp-nri-bar-fill" style={{ width: `${c.pct}%` }}/>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 13, fontWeight: 600, color: 'var(--gold-deep)', width: 72, textAlign: 'right', flexShrink: 0 }}>{c.value}</div>
                  </div>
                ))}

                <div style={{ marginTop: 16, padding: '12px 14px', background: '#0E1117', borderRadius: 10, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(400px 150px at 80% 0%, rgba(226,195,109,0.15), transparent)', pointerEvents: 'none' }}/>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>✈️</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 2 }}>NRI Desk Active</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Dedicated RM for Singapore, MY & UAE. WhatsApp: +91 98765 00001</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price index table + inventory aging */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* District price index */}
            <div className="tp-card">
              <div className="tp-card-head">
                <div>
                  <div className="tp-card-title">District Price Index</div>
                  <div className="tp-card-sub">Price/sqft · absorption · demand · YTD change</div>
                </div>
              </div>
              <div style={{ padding: '0 0 4px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 80px 80px 80px', gap: 12, padding: '10px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border-2)' }}>
                  {['District', 'Demand Score', '₹/sqft', 'Inventory', 'YTD ↑'].map(h => (
                    <div key={h} style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>{h}</div>
                  ))}
                </div>
                {districtIndex.map((r, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 80px 80px 80px', gap: 12, padding: '14px 20px', borderBottom: i < districtIndex.length - 1 ? '1px solid var(--border-2)' : 'none', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.district}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="tp-demand-bar" style={{ flex: 1 }}>
                        <div className="tp-demand-bar-fill" style={{ width: `${(r.absorption / 70) * 100}%` }}/>
                      </div>
                      <DemandLabel score={r.demand}/>
                    </div>
                    <div style={{ fontFamily: 'var(--f-mono)', fontSize: 12, fontWeight: 600 }}>₹{r.pricePerSqft.toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{r.inventory} units</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#15803D' }}>+{r.change}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inventory aging */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="tp-card tp-card-pad">
                <div className="tp-card-title" style={{ marginBottom: 4 }}>Inventory Aging</div>
                <div className="tp-card-sub" style={{ marginBottom: 18 }}>Properties by days on market</div>
                <AbsorptionChart/>
              </div>

              <div className="tp-card tp-card-pad">
                <div className="tp-card-title" style={{ marginBottom: 4 }}>Market Velocity</div>
                <div className="tp-card-sub" style={{ marginBottom: 14 }}>Avg. days to sell by district</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {MARKET_VELOCITY.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
                      <span style={{ width: 110, fontWeight: 600, fontSize: 12 }}>{m.district}</span>
                      <div style={{ flex: 1, height: 6, background: 'var(--bg)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${100 - m.days}%`, background: 'linear-gradient(90deg, #16A34A, #86EFAC)', borderRadius: 999 }}/>
                      </div>
                      <span style={{ fontFamily: 'var(--f-mono)', fontWeight: 700, width: 40, textAlign: 'right' }}>{m.days}d</span>
                      <VelocityBadge trend={m.trend}/>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Market signals banner */}
          <div className="tp-card" style={{ background: '#0E1117', color: '#fff', border: '1px solid #1F2433', overflow: 'hidden', padding: 0 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(700px 200px at 0% 50%, rgba(226,195,109,0.12), transparent 60%)', pointerEvents: 'none' }}/>
            <div style={{ padding: '22px 26px', position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 0 }}>
              {[
                { emoji: '📊', label: 'Market Signal', val: 'BULL RUN', sub: 'All districts trending up' },
                { emoji: '🏆', label: 'Hottest District', val: 'Chennai ECR', sub: '₹12,400/sqft · +18.2% YTD' },
                { emoji: '💰', label: 'Best ROI District', val: 'Tirunelveli', sub: '+23.5% in 7 months' },
                { emoji: '🌏', label: 'Top NRI Source', val: 'Singapore', sub: '36% of all NRI leads' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '0 24px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{s.emoji}</div>
                  <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 600, color: '#E2C36D', letterSpacing: '-0.2px', marginBottom: 4 }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
