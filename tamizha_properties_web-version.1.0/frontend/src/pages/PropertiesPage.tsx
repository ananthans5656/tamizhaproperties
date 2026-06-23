import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { I } from '../components/Icons';
import { propertiesApi, Property } from '../api/properties.api';
import ConfirmModal from '../components/ConfirmModal';

interface PropCardProps {
  id: string;
  img: string; tag: string; tagTone: string; title: string;
  location: string; price: string; sqft: string; ground: string; status?: string;
  images?: string[];
  onClick?: () => void;
}
function PropCard({ id, img, tag, tagTone, title, location, price, sqft, ground, status, images, onClick }: PropCardProps) {
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const appLink = `tamizha://property/${id}`;
  const webLink = `${window.location.origin}/p/${id}`;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShare(false);
      }
    };
    if (showShare) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showShare]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(webLink);
    setCopied(true);
    setTimeout(() => { setCopied(false); setShowShare(false); }, 1500);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://wa.me/?text=${encodeURIComponent(webLink)}`, '_blank');
    setShowShare(false);
  };

  const handleGoogleChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://chat.google.com/`, '_blank');
    navigator.clipboard.writeText(webLink);
    setShowShare(false);
  };

  const handleTelegram = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://t.me/share/url?url=${encodeURIComponent(webLink)}&text=${encodeURIComponent(`🏡 ${title} | ${location} | ${price}`)}`, '_blank');
    setShowShare(false);
  };

  return (
    <div className="tp-card" style={{ overflow: 'hidden', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div
        className={`tp-img ${img}`}
        style={{
          height: 180,
          borderRadius: 0,
          position: 'relative',
          backgroundImage: images && images.length > 0 ? `url(${images[0]})` : undefined
        }}
      >
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
          <span className={`tp-tag ${tagTone}`}>{tag}</span>
        </div>
        <div style={{ position: 'absolute', top: 12, right: 12 }} ref={shareRef}>
          <button
            className="tp-act"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => { e.stopPropagation(); setShowShare(s => !s); }}
          >
            {I.more}
          </button>
          {showShare && (
            <div style={{
              position: 'absolute', top: 38, right: 0, zIndex: 999,
              background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0', padding: '6px 0', minWidth: 180,
            }}>
              <div style={{ padding: '8px 14px 6px', fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase' }}>
                Share Property
              </div>
              <button onClick={handleWhatsApp} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#1E293B', fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <span style={{ fontSize: 18 }}>💬</span> WhatsApp
              </button>
              <button onClick={handleTelegram} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#1E293B', fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <span style={{ fontSize: 18 }}>✈️</span> Telegram
              </button>
              <button onClick={handleGoogleChat} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#1E293B', fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <span style={{ fontSize: 18 }}>💼</span> Google Chat
              </button>
              <div style={{ height: 1, background: '#E2E8F0', margin: '4px 0' }} />
              <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: copied ? '#16a34a' : '#1E293B', fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <span style={{ fontSize: 18 }}>{copied ? '✅' : '🔗'}</span> {copied ? 'Copied!' : 'Copy App Link'}
              </button>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: 18 }}>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontWeight: 600, letterSpacing: '-0.2px', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          {I.pin} {location}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 14, borderTop: '1px solid var(--border-2)' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--text-3)', fontWeight: 600 }}>Price</div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.3px', color: 'var(--ink)' }}>{price}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>{sqft} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>sq.ft</span></div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{ground} Ground</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function statusPill(status?: string) {
  const norm = (status || '').toLowerCase();
  if (norm === 'for sale') return 'tp-pill tp-pill-success';
  if (norm === 'sold') return 'tp-pill tp-pill-danger';
  if (norm === 'new launch') return 'tp-pill tp-pill-info';
  if (norm === 'premium') return 'tp-pill tp-pill-gold';
  return 'tp-pill tp-pill-neutral';
}

export default function PropertiesPage() {
  const navigate = useNavigate();

  // Navigation, togglers & list views
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [properties, setProperties] = useState<Property[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [dbStats, setDbStats] = useState<any>(null);
  const [deleteConfirmProperty, setDeleteConfirmProperty] = useState<{ id: string; title: string } | null>(null);

  // Filtering & Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPropertiesCount, setTotalPropertiesCount] = useState(0);
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  const [isDistrictOpen, setIsDistrictOpen] = useState(false);

  // Mobile-sync: Budget and Size filters
  const [budgetFilter, setBudgetFilter] = useState(0);
  const [sizeFilter, setSizeFilter] = useState(0);

  const BUDGET_OPTIONS = [
    { label: 'All Budgets', value: 0 },
    { label: '≤30 Lakh', value: 30 },
    { label: '≤50 Lakh', value: 50 },
    { label: '≤1 Crore', value: 100 },
    { label: '≤3 Crore', value: 300 },
    { label: '≤5 Crore', value: 500 },
    { label: 'Above 5 Cr', value: 501 },
  ];
  const SIZE_OPTIONS = [
    { label: 'Any Size', value: 0 },
    { label: '1/4 Ground', value: 600 },
    { label: '1/2 Ground', value: 1200 },
    { label: '1 Ground', value: 2400 },
    { label: '2 Ground+', value: 4356 },
  ];

  // Fetch properties dynamically based on page and filters
  const fetchProperties = async () => {
    setLoading(true);
    try {
      let minPrice: number | undefined;
      let maxPrice: number | undefined;
      if (budgetFilter > 0) {
        if (budgetFilter === 30) maxPrice = 3000000;
        else if (budgetFilter === 50) maxPrice = 5000000;
        else if (budgetFilter === 100) maxPrice = 10000000;
        else if (budgetFilter === 300) maxPrice = 30000000;
        else if (budgetFilter === 500) maxPrice = 50000000;
        else if (budgetFilter === 501) minPrice = 50000000;
      }

      let minGround: number | undefined;
      let maxGround: number | undefined;
      if (sizeFilter > 0) {
        if (sizeFilter === 600) maxGround = 0.35;
        else if (sizeFilter === 1200) {
          minGround = 0.35;
          maxGround = 0.75;
        } else if (sizeFilter === 2400) {
          minGround = 0.75;
          maxGround = 1.8;
        } else if (sizeFilter === 4356) {
          minGround = 1.8;
        }
      }

      const data = await propertiesApi.getAll({
        page,
        limit: 6,
        district: selectedDistrict === 'All' ? undefined : selectedDistrict,
        status: selectedStatus === 'All' ? undefined : selectedStatus,
        minPrice,
        maxPrice,
        minGround,
        maxGround,
      });

      setProperties(data.data);
      setTotalPages(data.totalPages);
      setTotalPropertiesCount(data.total);
    } catch (err) {
      console.error('Failed to fetch properties from database:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats and featured listings once on mount
  const fetchInitialData = async () => {
    try {
      const [featData, statsData] = await Promise.all([
        propertiesApi.getFeatured(),
        propertiesApi.getStats()
      ]);
      setFeaturedProperties(featData); // Show all featured properties
      setDbStats(statsData);
    } catch (err) {
      console.error('Failed to fetch initial page stats:', err);
    }
  };

  // Fetch stats dynamically based on active filters
  const fetchDynamicStats = async () => {
    try {
      const statsData = await propertiesApi.getStats({
        district: selectedDistrict === 'All' ? undefined : selectedDistrict,
        status: selectedStatus === 'All' ? undefined : selectedStatus,
      });
      setDbStats(statsData);
    } catch (err) {
      console.error('Failed to fetch dynamic stats:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchProperties();
    fetchDynamicStats();
  }, [page, selectedDistrict, selectedStatus, budgetFilter, sizeFilter]);

  // Handle active property deletion
  const handleDelete = (id: string, title: string) => {
    setDeleteConfirmProperty({ id, title });
  };

  const executeDeleteProperty = async () => {
    if (!deleteConfirmProperty) return;
    try {
      await propertiesApi.remove(deleteConfirmProperty.id);
      fetchProperties();
      fetchInitialData();
    } catch (err) {
      console.error('Failed to delete property:', err);
      alert('Failed to delete property. Please try again.');
    } finally {
      setDeleteConfirmProperty(null);
    }
  };

  // Helper to extract stats counters
  const getDistrictCount = (dist: string) => {
    if (!dbStats) return 0;
    if (dist === 'All') return dbStats.total;
    const stat = dbStats.districtStats?.find((s: any) => s.district === dist);
    return stat ? stat.count : 0;
  };

  const getStatusCount = (stat: string) => {
    if (!dbStats) return 0;
    if (stat === 'All') return dbStats.total;
    const item = dbStats.statusStats?.find((s: any) => s.status === stat);
    return item ? item.count : 0;
  };

  // Filter featured properties dynamically based on selectedDistrict, selectedStatus, budgetFilter, and sizeFilter
  const displayedFeatured = featuredProperties.filter(p => {
    const matchesDistrict = selectedDistrict === 'All' || p.district === selectedDistrict;
    const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
    
    // Budget filter
    let matchesBudget = true;
    if (budgetFilter > 0) {
      const priceNum = typeof p.price === 'number' ? p.price / 100000 : parseFloat(String(p.price)) / 100000;
      if (budgetFilter === 30) matchesBudget = priceNum <= 30;
      else if (budgetFilter === 50) matchesBudget = priceNum <= 50;
      else if (budgetFilter === 100) matchesBudget = priceNum <= 100;
      else if (budgetFilter === 300) matchesBudget = priceNum <= 300;
      else if (budgetFilter === 500) matchesBudget = priceNum <= 500;
      else if (budgetFilter === 501) matchesBudget = priceNum > 500;
    }

    // Size filter
    let matchesSize = true;
    if (sizeFilter > 0) {
      const ground = p.ground || (p.sqft ? p.sqft / 2400 : 0);
      if (sizeFilter === 600) matchesSize = ground <= 0.35;
      else if (sizeFilter === 1200) matchesSize = ground > 0.35 && ground <= 0.75;
      else if (sizeFilter === 2400) matchesSize = ground > 0.75 && ground <= 1.8;
      else if (sizeFilter === 4356) matchesSize = ground > 1.8;
    }

    return matchesDistrict && matchesStatus && matchesBudget && matchesSize;
  });

  // View All button: reset filters and scroll smoothly down to Full Registry section
  const handleViewAll = () => {
    setSelectedDistrict('All');
    setSelectedStatus('All');
    setPage(1);
    document.getElementById('full-registry-card')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="tp-layout">
      <Sidebar />
      <div className="tp-main">
        <Topbar searchPlaceholder="Search properties by title, district or status…" />
        <div className="tp-content">

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <span className="tp-eyebrow">Asset Registry</span>
              <h1 className="tp-h1">Property <em>Management</em></h1>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <button className="tp-btn tp-btn-gold" onClick={() => navigate('/properties/add')}>{I.plus} Add Property</button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="tp-card" style={{ padding: '14px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' as const }}>
              <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, fontWeight: 700, color: 'var(--text-3)', paddingRight: 10, borderRight: '1px solid var(--border-2)', flexShrink: 0, whiteSpace: 'nowrap' as const }}>Location</span>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  onClick={() => setIsDistrictOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: selectedDistrict !== 'All' ? 'linear-gradient(135deg, var(--gold), var(--gold-deep))' : 'var(--surface-2)',
                    color: selectedDistrict !== 'All' ? '#fff' : 'var(--ink)',
                    border: selectedDistrict !== 'All' ? '1px solid var(--gold)' : '1px solid var(--border-2)',
                    borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600,
                    fontFamily: 'var(--f-body)', cursor: 'pointer', outline: 'none', minWidth: 180,
                    boxShadow: selectedDistrict !== 'All' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                  }}
                >
                  <span style={{ flex: 1, textAlign: 'left' }}>
                    {selectedDistrict === 'All' ? `All Districts (${getDistrictCount('All')})` : selectedDistrict}
                  </span>
                  <span style={{ fontSize: 10 }}>▼</span>
                </button>
                {isDistrictOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setIsDistrictOpen(false)} />
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      minWidth: 200, maxHeight: 320, overflowY: 'auto',
                    }}>
                      {[
                        { label: null, options: [{ value: 'All', label: `All Districts (${getDistrictCount('All')})` }] },
                        { label: 'Tamil Nadu', options: ['Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri','Dindigul','Erode','Kallakurichi','Kancheepuram','Kanniyakumari','Karur','Krishnagiri','Madurai','Mayiladuthurai','Nagapattinam','Namakkal','Nilgiris','Perambalur','Pudukkottai','Ramanathapuram','Ranipet','Salem','Sivaganga','Tenkasi','Thanjavur','Theni','Thoothukudi','Tiruchirappalli','Tirunelveli','Tirupattur','Tiruvallur','Tiruvannamalai','Tiruvarur','Vellore','Viluppuram','Virudhunagar'].map(v => ({ value: v, label: v })) },
                        { label: 'Other', options: [{ value: 'Nagercoil', label: 'Nagercoil' }, { value: 'Malaysia', label: 'Malaysia' }] },
                      ].map((group, gi) => (
                        <div key={gi}>
                          {group.label && (
                            <div style={{ padding: '6px 12px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', borderTop: gi > 0 ? '1px solid var(--border-2)' : 'none' }}>
                              {group.label}
                            </div>
                          )}
                          {group.options.map(opt => (
                            <div
                              key={opt.value}
                              onClick={() => { setSelectedDistrict(opt.value); setPage(1); setIsDistrictOpen(false); }}
                              style={{
                                padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontWeight: selectedDistrict === opt.value ? 700 : 400,
                                color: selectedDistrict === opt.value ? 'var(--gold-deep)' : 'var(--ink)',
                                background: 'var(--surface)',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
                            >
                              {opt.label}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {selectedDistrict !== 'All' && (
                <button
                  className="tp-chip active"
                  style={{ fontSize: 12, padding: '4px 10px', gap: 4 }}
                  onClick={() => { setSelectedDistrict('All'); setPage(1); }}
                >
                  {selectedDistrict} ✕
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
              <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, fontWeight: 700, color: 'var(--text-3)', paddingRight: 10, borderRight: '1px solid var(--border-2)', flexShrink: 0, whiteSpace: 'nowrap' as const }}>Status</span>
              {['All', 'For Sale', 'Sold', 'Premium', 'New Launch', 'Draft'].map(stat => (
                <button
                  key={stat}
                  className={`tp-chip${selectedStatus === stat ? ' active' : ''}`}
                  onClick={() => {
                    setSelectedStatus(stat);
                    setPage(1); // Reset page on filter
                  }}
                >
                  {stat} {getStatusCount(stat) > 0 && <span className="tp-chip-count">{getStatusCount(stat)}</span>}
                </button>
              ))}
              <button className="tp-icon-btn" style={{ width: 32, height: 32, marginLeft: 'auto', flexShrink: 0 }} onClick={() => { setSelectedDistrict('All'); setSelectedStatus('All'); setBudgetFilter(0); setSizeFilter(0); setPage(1); }}>{I.filter}</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const, borderTop: '1px solid var(--border-2)', paddingTop: 10, marginTop: 6 }}>
              <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, fontWeight: 700, color: 'var(--text-3)', paddingRight: 10, borderRight: '1px solid var(--border-2)', flexShrink: 0, whiteSpace: 'nowrap' as const }}>Budget</span>
              {BUDGET_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`tp-chip${budgetFilter === opt.value ? ' active' : ''}`}
                  onClick={() => { setBudgetFilter(opt.value); setPage(1); }}
                >{opt.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const, borderTop: '1px solid var(--border-2)', paddingTop: 10, marginTop: 6 }}>
              <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, fontWeight: 700, color: 'var(--text-3)', paddingRight: 10, borderRight: '1px solid var(--border-2)', flexShrink: 0, whiteSpace: 'nowrap' as const }}>Size</span>
              {SIZE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`tp-chip${sizeFilter === opt.value ? ' active' : ''}`}
                  onClick={() => { setSizeFilter(opt.value); setPage(1); }}
                >{opt.label}</button>
              ))}
            </div>
          </div>

          {/* Featured Cards */}
          {displayedFeatured.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 600 }}>Featured this week</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Curated for NRI investors · high engagement</div>
                </div>
                {(selectedDistrict !== 'All' || selectedStatus !== 'All') ? (
                  <button className="tp-btn tp-btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={handleViewAll}>
                    Reset Filters ↺
                  </button>
                ) : (
                  <button className="tp-btn tp-btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={handleViewAll}>
                    View all {totalPropertiesCount} →
                  </button>
                )}
              </div>
              <div style={{ 
                display: 'flex', 
                gap: 16, 
                overflowX: 'auto', 
                paddingBottom: 12, 
                marginBottom: 28,
                scrollbarWidth: 'thin',
              }}>
                {displayedFeatured.map((p) => (
                  <div key={p.id} style={{ flex: '0 0 300px' }}>
                    <PropCard
                      id={p.id}
                      img={p.imgType || 'villa'}
                      images={p.images}
                      tag={(p.status || 'DRAFT').toUpperCase()}
                      tagTone={
                        p.status === 'New Launch' ? 'tp-tag-new' :
                        p.status === 'For Sale' ? 'tp-tag-sale' :
                        p.status === 'Premium' ? 'tp-tag-premium' :
                        'tp-tag-neutral'
                      }
                      title={p.title}
                      location={p.location}
                      price={p.priceLabel || `₹${p.price}`}
                      sqft={p.sqft ? p.sqft.toLocaleString() : '0'}
                      ground={p.ground ? p.ground.toString() : '0'}
                      status={p.isReraVerified ? 'verified' : undefined}
                      onClick={() => navigate(`/properties/${p.id}`)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Full Registry Table/Grid */}
          <div className="tp-card" id="full-registry-card">
            <div className="tp-card-head">
              <div>
                <div className="tp-card-title">Full Registry</div>
                <div className="tp-card-sub">Real-time database feed · fully active</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  className={`tp-chip${viewMode === 'grid' ? ' active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  Grid
                </button>
                <button
                  className={`tp-chip${viewMode === 'table' ? ' active' : ''}`}
                  onClick={() => setViewMode('table')}
                >
                  Table
                </button>
                <button className="tp-btn tp-btn-gold" style={{ padding: '7px 16px', fontSize: 13, marginLeft: 4 }} onClick={() => navigate('/properties/add')}>{I.plus} Add Property</button>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'grid', placeItems: 'center', height: 200, color: 'var(--text-3)', fontSize: 14 }}>
                <span className="tp-spinner" style={{ width: 28, height: 28, marginBottom: 12 }} />
                Loading registry entries from database...
              </div>
            ) : properties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '65px 20px', background: 'var(--surface)', borderTop: '1px solid var(--border-2)', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>🔍</div>
                <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>No properties matching filters</h3>
                <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  We couldn't find any properties matching location <strong style={{ color: 'var(--ink)' }}>"{selectedDistrict}"</strong> with listing status <strong style={{ color: 'var(--ink)' }}>"{selectedStatus}"</strong>. Try resetting filters or adding a new property listing.
                </p>
                <button className="tp-btn tp-btn-gold" style={{ fontSize: 12, padding: '7px 16px', margin: '0 auto' }} onClick={handleViewAll}>
                  Reset Active Filters ↺
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid Layout view mode */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, padding: 24 }}>
                {properties.map(p => (
                  <PropCard
                    key={p.id}
                    id={p.id}
                    img={p.imgType || 'villa'}
                    images={p.images}
                    tag={(p.status || 'DRAFT').toUpperCase()}
                    tagTone={
                      p.status === 'New Launch' ? 'tp-tag-new' :
                      p.status === 'For Sale' ? 'tp-tag-sale' :
                      p.status === 'Premium' ? 'tp-tag-premium' :
                      'tp-tag-neutral'
                    }
                    title={p.title}
                    location={p.location}
                    price={p.priceLabel || `₹${p.price}`}
                    sqft={p.sqft ? p.sqft.toLocaleString() : '0'}
                    ground={p.ground ? p.ground.toString() : '0'}
                    status={p.isReraVerified ? 'verified' : undefined}
                    onClick={() => navigate(`/properties/${p.id}`)}
                  />
                ))}
              </div>
            ) : (
              /* Table Layout view mode */
              <table className="tp-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>District</th>
                    <th>Price</th>
                    <th>Sqft</th>
                    <th>Ground</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div 
                            className={`tp-img ${r.imgType || 'villa'}`} 
                            style={{ 
                              width: 56, 
                              height: 44, 
                              padding: 0, 
                              fontSize: 0, 
                              borderRadius: 8,
                              backgroundImage: r.images && r.images.length > 0 ? `url(${r.images[0]})` : undefined
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>{I.pin} {r.location}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{r.district}</td>
                      <td style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 14 }}>{r.priceLabel || `₹${r.price}`}</td>
                      <td style={{ fontFamily: 'var(--f-mono)', fontSize: 12 }}>{r.sqft ? r.sqft.toLocaleString() : '0'}</td>
                      <td style={{ fontFamily: 'var(--f-mono)', fontSize: 12 }}>{r.ground ? r.ground.toString() : '0'}</td>
                      <td><span className={statusPill(r.status)}>{r.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button className="tp-act" onClick={() => navigate(`/properties/${r.id}`)}>{I.eye}</button>
                          <button className="tp-act gold" onClick={() => navigate(`/properties/edit/${r.id}`)}>{I.edit}</button>
                          <button className="tp-act danger" onClick={() => handleDelete(r.id, r.title)}>{I.trash}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderTop: '1px solid var(--border-2)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                Showing {properties.length} of {totalPropertiesCount} listings (Page {page} of {totalPages})
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="tp-btn tp-btn-ghost"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                >
                  ← Prev
                </button>
                <button
                  className="tp-btn tp-btn-dark"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Property Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmProperty}
        title="Delete Property Listing"
        message={`Are you sure you want to delete "${deleteConfirmProperty?.title}" from the database? This will permanently delete the listing.`}
        confirmText="Delete Listing"
        cancelText="Cancel"
        onConfirm={executeDeleteProperty}
        onCancel={() => setDeleteConfirmProperty(null)}
      />
    </div>
  );
}
