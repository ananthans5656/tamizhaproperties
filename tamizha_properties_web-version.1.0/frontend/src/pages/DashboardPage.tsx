import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { I } from '../components/Icons';
import { leadsApi } from '../api/leads.api';
import { propertiesApi } from '../api/properties.api';


interface KPIBigProps {
  eyebrow: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaTone?: 'up' | 'down';
  sub?: string;
  accent?: boolean;
  icon?: React.ReactNode;
  large?: boolean;
}

function KPIBig({ eyebrow, value, unit, delta, deltaTone = 'up', sub, accent, icon, large }: KPIBigProps) {
  return (
    <div className="tp-card" style={{
      padding: large ? 26 : 20,
      background: accent ? '#0E1117' : 'var(--surface)',
      color: accent ? '#fff' : 'var(--text)',
      border: accent ? '1px solid #1F2433' : '1px solid var(--border)',
      overflow: 'hidden',
      minWidth: 0,
    }}>
      {accent && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(600px 200px at 100% 0%, rgba(226,195,109,0.18), transparent 70%)',
          pointerEvents: 'none'
        }}/>
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{
            fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
            color: accent ? 'rgba(255,255,255,0.55)' : 'var(--text-3)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%'
          }}>
            {eyebrow}
          </span>
          <div style={{
            width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', flexShrink: 0,
            background: accent ? 'rgba(226,195,109,0.15)' : 'var(--bg)',
            color: accent ? 'var(--gold)' : 'var(--text-2)'
          }}>{icon}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--f-display)',
            fontSize: large ? 40 : 30,
            fontWeight: 500,
            letterSpacing: '-1px',
            lineHeight: 1,
            color: accent ? '#fff' : 'var(--ink)'
          }}>{value}</span>
          {unit && <span style={{ fontSize: 13, fontWeight: 500, color: accent ? 'rgba(255,255,255,0.6)' : 'var(--text-3)' }}>{unit}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {delta && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 700,
              color: deltaTone === 'up' ? '#16A34A' : '#DC2626',
              background: deltaTone === 'up' ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)',
              padding: '2px 7px', borderRadius: 6, whiteSpace: 'nowrap'
            }}>
              {deltaTone === 'up' ? I.trendUp : I.trendDown}
              {delta}
            </span>
          )}
          <span style={{ fontSize: 11, color: accent ? 'rgba(255,255,255,0.5)' : 'var(--text-3)', whiteSpace: 'nowrap' }}>{sub}</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();


  // Real-time Firestore state
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, propsRes] = await Promise.all([
          leadsApi.getAll({ limit: 500 }),
          propertiesApi.getAll({ limit: 500 }),
        ]);
        const docs = (leadsRes.data || []).map((l: any) => ({
          ...l,
          _ts: new Date(l.created_at || l.createdAt || 0).getTime(),
        })).sort((a: any, b: any) => b._ts - a._ts);
        setAllLeads(docs);
        setAllProperties(propsRes.data || []);
      } catch (err) {
        console.error('Dashboard fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute stats from real-time data
  const crmLeads = allLeads.filter((l: any) => l.source !== 'User App Chat');
  const totalLeads = crmLeads.length;
  const totalProperties = allProperties.length;
  const hotLeadsCount = crmLeads.filter((l: any) => String(l.status).toUpperCase() === 'HOT').length;
  const closedLeadsCount = crmLeads.filter((l: any) => String(l.status).toUpperCase() === 'CLOSED').length;
  const recentLeads = crmLeads.slice(0, 5);

  const propsDelta = { text: `${totalProperties} total`, up: true };
  const leadsDelta = { text: `${totalLeads} total`, up: true };

  return (
    <div className="tp-layout">
      <Sidebar />
      <div className="tp-main">
        <Topbar />
        <div className="tp-content">

          {/* Hero */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="tp-eyebrow">Real Estate Insights</span>
              <h1 className="tp-h1">Master <em>Dashboard</em></h1>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <button className="tp-btn tp-btn-gold" onClick={() => navigate('/properties/add')}>{I.plus} New Properties</button>
            </div>
          </div>

          {/* KPI Row — all real DB values */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <KPIBig eyebrow="Active Properties" value={loading ? '—' : totalProperties.toString()}
              delta={propsDelta.text} deltaTone="up"
              sub="listings in DB" icon={I.building}/>
            <KPIBig eyebrow="Total Leads" value={loading ? '—' : totalLeads.toString()}
              delta={leadsDelta.text} deltaTone="up"
              sub={`${closedLeadsCount} closed · ${hotLeadsCount} hot`} icon={I.leads}/>
          </div>


          {/* Activity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <div className="tp-card">
              <div className="tp-card-head">
                <div>
                  <div className="tp-card-title">Recent Activity</div>
                  <div className="tp-card-sub">Live across all desks</div>
                </div>
                <button className="tp-btn tp-btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => navigate('/leads')}>View all</button>
              </div>
              <div style={{ padding: 6 }}>
                {loading ? (
                  <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Connecting to Firestore...</div>
                ) : recentLeads.length === 0 ? (
                  <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No recent activities found in the registry.</div>
                ) : (
                  recentLeads.map((l, i) => {
                    return (
                      <div key={l.id || i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14,
                        padding: '14px 18px',
                        borderBottom: i < recentLeads.length - 1 ? '1px solid var(--border-2)' : 'none'
                      }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 999, flexShrink: 0,
                          display: 'grid', placeItems: 'center',
                          background: l.status === 'HOT' ? 'rgba(220,38,38,0.12)' : l.status === 'WARM' ? 'rgba(217,119,6,0.12)' : 'rgba(59,130,246,0.12)',
                          color: l.status === 'HOT' ? '#DC2626' : l.status === 'WARM' ? '#D97706' : '#3B82F6'
                        }}>
                          {l.status === 'HOT' ? I.fire : l.status === 'WARM' ? I.bolt : I.leads}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                            <strong style={{ fontWeight: 700 }}>{l.clientName || l.name || 'Unknown'}</strong>
                            <span style={{ color: 'var(--text-3)' }}> enquired about </span>
                            <span style={{ fontWeight: 600 }}>{l.propertyName || l.propertyInterest || 'unspecified asset'}</span>
                            <span style={{ color: 'var(--text-3)' }}> from </span>
                            <span style={{ fontWeight: 600 }}>{l.clientCity || l.city || 'Tamil Nadu'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
