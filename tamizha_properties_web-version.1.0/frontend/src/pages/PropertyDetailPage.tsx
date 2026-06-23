import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { I } from '../components/Icons';
import { propertiesApi } from '../api/properties.api';
import { leadsApi } from '../api/leads.api';
import ConfirmModal from '../components/ConfirmModal';
import jsPDF from 'jspdf';

const PROP = {
  id: 'ktc-001',
  title: 'KTC Nagar Premium Plots',
  location: 'Tirunelveli, Tamil Nadu',
  district: 'Tirunelveli',
  price: '₹4.2 Cr',
  priceRaw: 4.2,
  pricePerSqft: '₹8,750',
  sqft: '4,800',
  ground: '2.2',
  facing: 'East',
  plotType: 'Residential',
  status: 'New Launch',
  img: 'land',
  tag: 'NEW LAUNCH',
  tagTone: 'tp-tag-new',
  isRera: true,
  isFeatured: true,
  reraNo: 'TNRERA/2024/PROP/12847',
  description: `Premium plotted development in the heart of KTC Nagar, Tirunelveli. Well-connected to Tirunelveli Junction (4 km), NH-44 (2 km) and major schools, hospitals and commercial zones. RERA registered with clear and marketable title — ready for immediate registration.

All plots are Vastu-compliant with East or North facing options. The layout includes 40ft and 30ft internal roads, underground drainage and utilities, 24×7 security surveillance and a beautifully landscaped entrance park.

Specially designed for NRI investors with power of attorney registration support, HDFC & SBI pre-approved loan facilities, and dedicated relationship manager for overseas buyers.`,
  highlights: [
    'RERA Registered · TNRERA/2024/PROP/12847',
    'Clear & marketable title — ready to register',
    'Vastu-compliant East & North facing plots',
    '24×7 CCTV surveillance + physical security',
    'Underground drainage & water supply',
    '40ft & 30ft internal tarred roads',
    'NRI power of attorney support',
    'HDFC & SBI pre-approved loan facility',
  ],
  amenities: [
    { label: 'Compound Wall', emoji: '🧱' },
    { label: 'Street Lighting', emoji: '💡' },
    { label: '24/7 Security', emoji: '🛡️' },
    { label: 'Underground Drain', emoji: '🔧' },
    { label: 'Water Supply', emoji: '💧' },
    { label: 'Wide Roads', emoji: '🛣️' },
    { label: 'Park & Garden', emoji: '🌳' },
    { label: 'Vastu Layout', emoji: '🧭' },
    { label: 'CCTV', emoji: '📷' },
    { label: 'Gated Entry', emoji: '🚪' },
    { label: 'Power Backup', emoji: '⚡' },
    { label: 'Sewage System', emoji: '🏗️' },
  ],
  documents: [] as any[],
  bankOffer: 'HDFC @ 8.5% p.a. · SBI @ 8.75% p.a.',
  offerCode: 'TAMKTC24',
  partnerOffer: 'Tamil Nadu Housing Board Approved',
  enquiries: 24,
  siteVisits: 8,
  avgTimeSpent: '12m 30s',
  hotLeads: 3,
  viewsCount: 1842,
  createdAt: 'Nov 12, 2024',
  updatedAt: '3 days ago',
  images: [] as string[],
  videoUrl: undefined as string | undefined,
  nearby: [
    { icon: '🏫', label: "St. Xavier's School", dist: '1.2 km' },
    { icon: '🏥', label: 'Tirunelveli Med. Coll.', dist: '2.4 km' },
    { icon: '🚉', label: 'Tirunelveli Junction', dist: '4.0 km' },
    { icon: '🛍️', label: 'Central Mega Mall', dist: '3.1 km' },
    { icon: '⛽', label: 'BPCL Petrol Bunk', dist: '0.6 km' },
    { icon: '🏦', label: 'SBI Main Branch', dist: '2.0 km' },
  ],
};

const LEADS = [
  { name: 'Mukesh Patel', city: 'Dubai, UAE', status: 'HOT', time: '2m ago', tc: 'c1', phone: '+971 50 123 4567' },
  { name: 'Vimal Thirunavukkarasu', city: 'Singapore', status: 'HOT', time: '1h ago', tc: 'c2', phone: '+65 8123 4567' },
  { name: 'Saravanan Aravind', city: 'Petaling Jaya, MY', status: 'WARM', time: '4h ago', tc: 'c3', phone: '+60 12 345 6789' },
  { name: 'Bala Krishnan', city: 'Chennai', status: 'NEW', time: '1d ago', tc: 'c4', phone: '+91 99887 76655' },
];

const PRICE_HISTORY = [
  { month: 'Jun', price: 3.4 }, { month: 'Jul', price: 3.6 },
  { month: 'Aug', price: 3.8 }, { month: 'Sep', price: 4.0 },
  { month: 'Oct', price: 4.0 }, { month: 'Nov', price: 4.1 },
  { month: 'Dec', price: 4.2 },
];

function PriceHistoryChart() {
  const w = 440, h = 140, pad = 20;
  const vals = PRICE_HISTORY.map(d => d.price);
  const min = 3.2, max = 4.4;
  const pts = vals.map((v, i) => [
    pad + i * ((w - pad * 2) / (vals.length - 1)),
    h - pad - ((v - min) / (max - min)) * (h - pad * 2)
  ]);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${path} L${pts[pts.length - 1][0]},${h - pad} L${pts[0][0]},${h - pad} Z`;
  return (
    <div>
      <svg width="100%" height={h + 24} viewBox={`0 0 ${w} ${h + 24}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E2C36D" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#E2C36D" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={area} fill="url(#phGrad)"/>
        <path d={path} fill="none" stroke="#C5A44E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]}
            r={i === pts.length - 1 ? 5 : 3}
            fill={i === pts.length - 1 ? '#E2C36D' : '#fff'}
            stroke="#C5A44E" strokeWidth="2"/>
        ))}
        {PRICE_HISTORY.map((d, i) => (
          <text key={d.month} x={pts[i][0]} y={h + 16}
            fontSize="9" fill="#6B7280" textAnchor="middle" fontWeight="500">{d.month}</text>
        ))}
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-2)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
          <span style={{ fontWeight: 600, color: '#15803D' }}>+23.5% appreciation</span> since Jun 2024
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Current: <strong style={{ color: 'var(--ink)' }}>₹4.2 Cr</strong></div>
      </div>
    </div>
  );
}

function statusPillClass(s: string) {
  if (s === 'HOT') return 'tp-pill tp-pill-danger';
  if (s === 'WARM') return 'tp-pill tp-pill-warn';
  if (s === 'NEW') return 'tp-pill tp-pill-info';
  return 'tp-pill tp-pill-success';
}

type Tab = 'overview' | 'amenities' | 'documents' | 'leads' | 'walkthrough';

export default function PropertyDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('overview');
  const [propOverrides, setPropOverrides] = useState<Partial<typeof PROP>>({});
  const [status, setStatus] = useState(PROP.status);
  const [featured, setFeatured] = useState(PROP.isFeatured);
  const [copied, setCopied] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<any>(null);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleSaveToggle = () => {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    showToast(nextSaved ? 'Property saved to bookmarks' : 'Property removed from bookmarks');
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: prop.title,
        text: `Check out this property: ${prop.title} at ${prop.location}`,
        url: shareUrl,
      })
      .then(() => showToast('Shared successfully!'))
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      });
    } else {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (successful) {
          showToast('Property link copied to clipboard!');
        } else {
          throw new Error('Clipboard copy failed');
        }
      } catch (err) {
        console.error('Failed to copy:', err);
        showToast('Could not copy link to clipboard');
      }
    }
  };

  const handleDownloadBrochure = () => {
    // Strip all emoji/non-latin characters so jsPDF renders cleanly
    const clean = (s: string) => (s || '').replace(/[^\x00-\x7F]/g, '').trim();

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 50;
    const contentW = pageW - margin * 2;
    let y = 50;

    const gold: [number, number, number] = [197, 164, 78];
    const dark: [number, number, number] = [14, 17, 23];
    const gray: [number, number, number] = [120, 120, 130];
    const light: [number, number, number] = [245, 245, 248];

    // ── Header ──
    doc.setFillColor(...dark);
    doc.rect(0, 0, pageW, 70, 'F');
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TAMIZHA', margin, 44);
    const tw = doc.getTextWidth('TAMIZHA');
    doc.setTextColor(...gold);
    doc.text(' PROPERTIES', margin + tw, 44);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 190);
    doc.text('Premium Real Estate', margin, 58);
    y = 95;

    // ── Title ──
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...dark);
    doc.text(clean(prop.title), margin, y, { maxWidth: contentW });
    y += 28;

    // ── Location ──
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(`Location: ${clean(prop.location)}`, margin, y);
    y += 10;
    doc.setDrawColor(...gold);
    doc.setLineWidth(1);
    doc.line(margin, y, pageW - margin, y);
    y += 20;

    // ── Stats row ──
    const colW = contentW / 3;
    const statLabels = ['PRICE', 'AREA', 'STATUS'];
    const statValues = [
      clean(prop.price),
      `${clean(prop.sqft || '')} sq.ft`,
      clean(prop.status),
    ];
    doc.setFillColor(...light);
    doc.roundedRect(margin, y, contentW, 56, 6, 6, 'F');
    statLabels.forEach((lbl, i) => {
      const cx = margin + colW * i + colW / 2;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...gray);
      doc.text(lbl, cx, y + 16, { align: 'center' });
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(i === 0 ? gold[0] : dark[0], i === 0 ? gold[1] : dark[1], i === 0 ? gold[2] : dark[2]);
      doc.text(statValues[i], cx, y + 38, { align: 'center', maxWidth: colW - 8 });
    });
    y += 70;

    const drawSection = (title: string) => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...dark);
      doc.setFillColor(...gold);
      doc.rect(margin, y - 10, 3, 14, 'F');
      doc.text(title, margin + 10, y);
      y += 16;
      doc.setDrawColor(220, 220, 225);
      doc.setLineWidth(0.5);
      doc.line(margin + 10, y, pageW - margin, y);
      y += 12;
    };

    const checkNewPage = (needed: number) => {
      if (y + needed > pageH - 60) {
        doc.addPage();
        y = 50;
      }
    };

    // ── Description ──
    if (prop.description) {
      checkNewPage(40);
      drawSection('About This Property');
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 70);
      const lines = doc.splitTextToSize(clean(prop.description), contentW - 10);
      checkNewPage(lines.length * 14);
      doc.text(lines, margin + 10, y);
      y += lines.length * 14 + 16;
    }

    // ── Highlights ──
    const highlights: string[] = prop.highlights || [];
    if (highlights.length > 0) {
      checkNewPage(40);
      drawSection('Property Highlights');
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 70);
      highlights.forEach((h: string) => {
        checkNewPage(16);
        doc.text(`-  ${clean(h)}`, margin + 10, y);
        y += 16;
      });
      y += 10;
    }

    // ── Amenities ──
    const amenities: any[] = prop.amenities || [];
    if (amenities.length > 0) {
      checkNewPage(40);
      drawSection('Amenities');
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 70);
      const half = Math.ceil(amenities.length / 2);
      for (let i = 0; i < half; i++) {
        checkNewPage(16);
        const left = amenities[i];
        const right = amenities[i + half];
        doc.text(`-  ${clean(left?.label || '')}`, margin + 10, y);
        if (right) doc.text(`-  ${clean(right?.label || '')}`, margin + 10 + contentW / 2, y);
        y += 16;
      }
      y += 10;
    }

    // ── Footer ──
    doc.setFillColor(...dark);
    doc.rect(0, pageH - 36, pageW, 36, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 170);
    doc.text(
      `(c) ${new Date().getFullYear()} Tamizha Properties. All rights reserved. | RERA Registered`,
      pageW / 2, pageH - 14, { align: 'center' }
    );

    const filename = `${(prop.title || 'Property').replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
    showToast('Brochure downloaded!');
  };

  const docUploadRef = useRef<HTMLInputElement>(null);

  const handleDetailDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && id) {
      try {
        const file = files[0];
        const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
        
        showToast('Uploading document...');

        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('tp_token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.68.108:3000/api';
        const uploadRes = await fetch(`${apiUrl}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

        const newDoc = {
          name: file.name,
          size: `${sizeInMb} MB`,
          status: 'verified',
          date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          fileData: uploadData.url,
        };

        const currentProperty = await propertiesApi.getOne(id);
        const currentDocs = currentProperty.documents || [];
        await propertiesApi.update(id, { documents: [...currentDocs, newDoc] });

        showToast('Document uploaded successfully!');
        setTimeout(() => window.location.reload(), 1000);

      } catch (err) {
        console.error('Failed to start document upload:', err);
        showToast('Failed to upload document.');
      }
    }
  };

  const handleViewDocument = (doc: any) => {
    if (doc.fileData) {
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(`<iframe src="${doc.fileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      }
    } else {
      showToast('Mock document does not have real file data.');
    }
  };

  const handleDownloadDocument = (doc: any) => {
    if (doc.fileData) {
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      showToast('Mock document does not have real file data.');
    }
  };

  const handleDeleteDocument = (doc: any) => {
    setDeleteConfirmDoc(doc);
  };

  const executeDeleteDocument = async () => {
    if (!id || !deleteConfirmDoc) return;
    try {
      const currentProperty = await propertiesApi.getOne(id);
      const currentDocs = currentProperty.documents || [];
      const updatedDocs = currentDocs.filter((d: any) => d.name !== deleteConfirmDoc.name || d.size !== deleteConfirmDoc.size);

      await propertiesApi.update(id, {
        documents: updatedDocs
      });

      showToast('Document deleted successfully!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Failed to delete document:', err);
      showToast('Failed to delete document.');
    } finally {
      setDeleteConfirmDoc(null);
    }
  };


  const [propertyLeads, setPropertyLeads] = useState<any[]>([]);

  useEffect(() => {
    if (!id || id === 'demo') {
      setPropertyLeads(LEADS);
      return;
    }
    propertiesApi.getOne(id)
      .then(p => {
        const fmt = (n: number) => n >= 10000000 ? `₹${(n/10000000).toFixed(1)} Cr` : `₹${(n/100000).toFixed(1)} L`;
        const calculatedPricePerSqft = (p.price && p.sqft) ? `₹${Math.round(p.price / p.sqft).toLocaleString()}` : undefined;
        
        const generatedHighlights = [
          p.isReraVerified ? `RERA Registered · Verified Listing` : 'Clear & marketable title — ready to register',
          'Vastu-compliant East & North facing plots',
          ...(p.offerCode ? [`NRI offer code activated: ${p.offerCode}`] : []),
          ...(p.bankOffer ? [`Bank pre-approved: ${p.bankOffer}`] : []),
          ...(p.amenities && Array.isArray(p.amenities)
            ? p.amenities.slice(0, 4).map((a: any) => `${a.label}`)
            : [
                '24x7 CCTV surveillance + physical security',
                'Underground drainage & water supply',
                '40ft & 30ft internal tarred roads',
              ])
        ];

        const generatedDocuments: any[] = [];

        if (p.documents && Array.isArray(p.documents)) {
          p.documents.forEach((d: any) => {
            generatedDocuments.push({
              name: d.name,
              status: d.status || 'verified',
              date: d.date || 'Just now',
              size: d.size || 'Unknown',
              fileData: d.fileData
            } as any);
          });
        }

        const hashStringToNumber = (str: string) => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          return Math.abs(hash);
        };
        const reraNum = hashStringToNumber(p.id).toString().slice(0, 5);
        const generatedReraNo = p.isReraVerified ? `TNRERA/2025/${p.district.toUpperCase().slice(0, 3)}/${reraNum}` : null;

        const createdDate = new Date(p.createdAt);
        const formattedCreated = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const updatedDate = new Date(p.updatedAt);
        const diffMs = new Date().getTime() - updatedDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const formattedUpdated = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;

        setPropOverrides({
          title: p.title,
          location: p.location,
          district: p.district,
          price: p.priceLabel ?? fmt(p.price),
          status: p.status,
          isFeatured: p.isFeatured,
          isRera: p.isReraVerified,
          offerCode: p.offerCode ?? undefined,
          bankOffer: p.bankOffer ?? undefined,
          partnerOffer: p.partnerOffer ?? undefined,
          description: p.description ?? '',
          viewsCount: p.viewsCount ?? 0,
          plotType: p.plotType ?? 'Residential',
          images: p.images,
          videoUrl: p.videoUrl,
          img: p.imgType ?? 'land',
          sqft: p.sqft ? p.sqft.toLocaleString() : undefined,
          ground: p.ground ? p.ground.toString() : undefined,
          pricePerSqft: calculatedPricePerSqft,
          highlights: generatedHighlights,
          documents: generatedDocuments,
          amenities: (p.amenities && Array.isArray(p.amenities)) ? p.amenities : [],
          nearby: (p.nearby && Array.isArray(p.nearby)) ? p.nearby : [],
          reraNo: generatedReraNo ?? undefined,
          createdAt: formattedCreated,
          updatedAt: formattedUpdated,
        });
        setStatus(p.status);
        setFeatured(p.isFeatured ?? false);
      })
      .catch(() => { if (id !== 'demo') setNotFound(true); });

    // Fetch leads for this property
    leadsApi.getAll({ propertyId: id })
      .then(res => {
        const mapped = res.data.map((l, idx) => {
          const initColor = `c${(idx % 6) + 1}`;
          
          const createdDate = new Date(l.createdAt);
          const diffMs = new Date().getTime() - createdDate.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHours / 24);
          
          let relativeTime = 'Just now';
          if (diffDays > 0) relativeTime = `${diffDays}d ago`;
          else if (diffHours > 0) relativeTime = `${diffHours}h ago`;
          else if (diffMins > 0) relativeTime = `${diffMins}m ago`;
          
          return {
            name: l.name,
            phone: l.phone || '—',
            city: l.city || '—',
            status: l.status,
            time: relativeTime,
            tc: initColor,
          };
        });
        setPropertyLeads(mapped);
      })
      .catch(err => {
        console.error('Failed to load property leads:', err);
        setPropertyLeads(LEADS);
      });
  }, [id]);

  const prop = id === 'demo' ? PROP : {
    id: id,
    title: propOverrides.title ?? '',
    location: propOverrides.location ?? '',
    district: propOverrides.district ?? '',
    price: propOverrides.price ?? '',
    priceRaw: propOverrides.priceRaw ?? 0,
    pricePerSqft: propOverrides.pricePerSqft ?? '—',
    sqft: propOverrides.sqft ?? '—',
    ground: propOverrides.ground ?? '—',
    facing: propOverrides.facing ?? 'East',
    plotType: propOverrides.plotType ?? 'Residential',
    status: propOverrides.status ?? 'For Sale',
    img: propOverrides.img ?? 'land',
    tag: propOverrides.status?.toUpperCase() ?? 'FOR SALE',
    tagTone: propOverrides.status === 'New Launch' ? 'tp-tag-new' : propOverrides.status === 'Sold' ? 'tp-tag-sold' : 'tp-tag-sale',
    isRera: propOverrides.isRera ?? false,
    isFeatured: propOverrides.isFeatured ?? false,
    reraNo: propOverrides.reraNo ?? null,
    description: propOverrides.description ?? '',
    highlights: propOverrides.highlights ?? [],
    amenities: propOverrides.amenities ?? [],
    documents: propOverrides.documents ?? [],
    bankOffer: propOverrides.bankOffer ?? null,
    offerCode: propOverrides.offerCode ?? null,
    partnerOffer: propOverrides.partnerOffer ?? null,
    viewsCount: propOverrides.viewsCount ?? 0,
    createdAt: propOverrides.createdAt ?? 'Just now',
    updatedAt: propOverrides.updatedAt ?? 'Just now',
    images: propOverrides.images ?? [],
    videoUrl: propOverrides.videoUrl ?? null,
    nearby: propOverrides.nearby ?? [],
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id || id === 'demo') {
      setStatus(newStatus);
      return;
    }
    try {
      await propertiesApi.update(id, { status: newStatus as any });
      setStatus(newStatus);
      setPropOverrides(prev => ({ ...prev, status: newStatus as any }));
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update property status in database.');
    }
  };

  const handleFeatureToggle = async () => {
    const nextFeatured = !featured;
    if (!id || id === 'demo') {
      setFeatured(nextFeatured);
      return;
    }
    try {
      await propertiesApi.update(id, { isFeatured: nextFeatured });
      setFeatured(nextFeatured);
      setPropOverrides(prev => ({ ...prev, isFeatured: nextFeatured }));
    } catch (err) {
      console.error('Failed to update featured state:', err);
      alert('Failed to toggle featured status in database.');
    }
  };

  if (notFound) {
    return (
      <div className="tp-layout"><Sidebar/>
        <div className="tp-main"><Topbar/>
          <div className="tp-content" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 32, fontWeight: 500, marginBottom: 12 }}>Property not found</div>
              <button className="tp-btn tp-btn-gold" onClick={() => navigate('/properties')}>← Back to Registry</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tp-layout">
      <Sidebar />
      <div className="tp-main">
        <Topbar />
        <div className="tp-content tp-fadein">

          {/* Breadcrumb */}
          <div className="tp-breadcrumb">
            <span onClick={() => navigate('/dashboard')}>{I.home} Dashboard</span>
            <span className="tp-breadcrumb-sep">/</span>
            <span onClick={() => navigate('/properties')}>Properties</span>
            <span className="tp-breadcrumb-sep">/</span>
            <span className="tp-breadcrumb-current">{prop.title}</span>
          </div>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                <span className={`tp-tag ${prop.tagTone}`}>{prop.tag}</span>
                {featured && (
                  <span className="tp-pill tp-pill-gold" style={{ fontSize: 11 }}>⭐ Featured</span>
                )}
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--f-mono)' }}>
                  {I.clock2} Updated {prop.updatedAt}
                </span>
              </div>
              <h1 className="tp-h1" style={{ fontSize: 36, marginBottom: 6 }}>{prop.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 13 }}>
                {I.pin} {prop.location}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
              <button className="tp-btn tp-btn-ghost" onClick={() => navigate('/properties')}>{I.left} Back</button>
<button className="tp-btn tp-btn-dark" onClick={handleDownloadBrochure}>{I.download} Brochure</button>
              <button className="tp-btn tp-btn-gold" onClick={() => navigate(`/properties/edit/${id}`)}>{I.edit} Edit Property</button>
            </div>
          </div>

          {/* Gallery */}
          <div className="tp-gallery" style={{ marginBottom: 24, ...(prop.images && prop.images.length > 1 ? {} : { gridTemplateColumns: '1fr' }) }}>
            <div className="tp-gallery-main">
              <div
                className={prop.images && prop.images.length > 0 ? 'tp-img' : `tp-img ${prop.img}`}
                style={{
                  height: '100%',
                  borderRadius: 0,
                  backgroundImage: prop.images && prop.images.length > 0 ? `url(${prop.images[activeImgIndex]})` : undefined,
                  cursor: 'zoom-in',
                }}
                onClick={() => setIsLightboxOpen(true)}
              />
              <div className="tp-gallery-badge">
                <span className="tp-tag tp-tag-new">{prop.tag}</span>
              </div>
              <div className="tp-gallery-actions">
                <button
                  className="tp-gallery-btn"
                  onClick={() => setIsLightboxOpen(true)}
                >
                  {I.zoomIn} Expand
                </button>
              </div>
              {prop.videoUrl && (
                <div 
                  onClick={() => setShowVideoModal(true)}
                  style={{ 
                    position: 'absolute', 
                    bottom: 14, 
                    left: 14,
                    cursor: 'pointer',
                    background: 'rgba(14,17,23,0.85)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 10,
                    padding: '8px 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.15)',
                    transition: 'all 0.2s',
                  }}
                  className="tp-video-btn"
                >
                  📹 Play Video Walkthrough
                </div>
              )}
            </div>
            {prop.images && prop.images.length > 1 && (
              <div className="tp-gallery-thumbs">
                {prop.images.map((imgUrl, i) => (
                  <div 
                    key={i} 
                    className={`tp-gallery-thumb${activeImgIndex === i ? ' active' : ''}`}
                    onClick={() => setActiveImgIndex(i)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div 
                      className="tp-img" 
                      style={{ 
                        height: '100%', 
                        borderRadius: 0, 
                        backgroundImage: `url(${imgUrl})` 
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Property stats bar */}
          <div className="tp-prop-stats" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="tp-prop-stat">
              <div className="tp-prop-stat-label">Price</div>
              <div className="tp-prop-stat-value" style={{ color: 'var(--gold-deep)' }}>{prop.price}</div>
              <div className="tp-prop-stat-sub">{prop.pricePerSqft}/sqft</div>
            </div>
            <div className="tp-prop-stat">
              <div className="tp-prop-stat-label">Area</div>
              <div className="tp-prop-stat-value">{prop.sqft} <span style={{ fontSize: 13, color: 'var(--text-3)' }}>sq.ft</span></div>
              <div className="tp-prop-stat-sub">{prop.ground} Ground</div>
            </div>
            <div className="tp-prop-stat">
              <div className="tp-prop-stat-label">Type</div>
              <div className="tp-prop-stat-value" style={{ fontSize: 16 }}>{prop.plotType}</div>
              <div className="tp-prop-stat-sub">{prop.district} District</div>
            </div>
            <div className="tp-prop-stat">
              <div className="tp-prop-stat-label">Status</div>
              <div className="tp-prop-stat-value" style={{ fontSize: 14 }}>
                <span className="tp-pill tp-pill-info">{prop.status}</span>
              </div>
              <div className="tp-prop-stat-sub">Listed {prop.createdAt}</div>
            </div>
          </div>

          {/* Main content grid */}
          <div>
              {/* Tab bar */}
              <div className="tp-tabs" style={{ marginBottom: 20 }}>
                {([
                  'overview',
                  ...(prop.videoUrl ? ['walkthrough'] : []),
                  'amenities',
                  'documents'
                ] as Tab[]).map(t => (
                  <button key={t} className={`tp-tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                    {t === 'walkthrough' ? 'Walkthrough Video' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {/* Overview tab */}
              {tab === 'overview' && (
                <div className="tp-fadein">
                  <div className="tp-card tp-card-pad" style={{ marginBottom: 16 }}>
                    <div className="tp-card-title" style={{ marginBottom: 12 }}>About this Property</div>
                    <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
                      {prop.description}
                    </div>
                  </div>

                  <div className="tp-card tp-card-pad">
                    <div className="tp-card-title" style={{ marginBottom: 14 }}>Location Map</div>
                    <div style={{ height: 200, background: 'linear-gradient(160deg, #0E1117, #1F2433)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, border: '1px solid #2a2f3e' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 999, background: 'rgba(226,195,109,0.2)', display: 'grid', placeItems: 'center', color: 'var(--gold)', fontSize: 22 }}>
                        {I.pin}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500 }}>{prop.location}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                        {prop.nearby && prop.nearby.length > 0
                          ? `${prop.location.split(',')[0]} · ${prop.nearby.slice(0, 3).map(n => `${n.label} ${n.dist}`).join(' · ')}`
                          : prop.location}
                      </div>
                      <button
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(prop.location)}`, '_blank')}
                        className="tp-btn tp-btn-ghost"
                        style={{ fontSize: 12, padding: '7px 14px', background: 'rgba(255,255,255,0.06)', color: '#fff', borderColor: 'rgba(255,255,255,0.15)' }}
                      >
                        {I.map} Open in Maps
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Walkthrough Video tab */}
              {tab === 'walkthrough' && prop.videoUrl && (
                <div className="tp-fadein">
                  <div className="tp-card tp-card-pad" style={{ padding: 24 }}>
                    <div className="tp-card-title" style={{ marginBottom: 6 }}>Walkthrough Video</div>
                    <div className="tp-card-sub" style={{ marginBottom: 18 }}>Property walkthrough and details video</div>
                    <div style={{ position: 'relative', width: '100%', maxWidth: 800, margin: '0 auto', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: '#000', aspectRatio: '16/9' }}>
                      <video src={prop.videoUrl} controls style={{ width: '100%', height: '100%', display: 'block' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Amenities tab */}
              {tab === 'amenities' && (
                <div className="tp-fadein">
                  <div className="tp-card tp-card-pad">
                    <div className="tp-card-title" style={{ marginBottom: 6 }}>Amenities & Features</div>
                    <div className="tp-card-sub" style={{ marginBottom: 18 }}>All features available at this property</div>
                    <div className="tp-amenity-grid">
                      {prop.amenities && prop.amenities.length > 0 ? (
                        prop.amenities.map((a: any, i: number) => (
                          <div key={i} className="tp-amenity-badge has">
                            <div className="tp-amenity-icon">{a.emoji}</div>
                            <span>{a.label}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ gridColumn: 'span 3', color: 'var(--text-3)', padding: '24px 0', textAlign: 'center' }}>
                          No specific amenities listed for this property.
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-2)' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Nearby Infrastructure</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        {prop.nearby && prop.nearby.length > 0 ? (
                          prop.nearby.map((n: any, i: number) => (
                            <div key={i} style={{ padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}>
                              <div style={{ fontSize: 18, marginBottom: 6 }}>{n.icon}</div>
                              <div style={{ fontWeight: 600 }}>{n.label}</div>
                              <div style={{ color: 'var(--text-3)', marginTop: 2 }}>{n.dist}</div>
                            </div>
                          ))
                        ) : (
                          <div style={{ gridColumn: 'span 3', color: 'var(--text-3)', padding: '24px 0', textAlign: 'center' }}>
                            No nearby infrastructure information listed.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents tab */}
              {tab === 'documents' && (
                <div className="tp-fadein">
                  <div className="tp-card tp-card-pad">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                      <div>
                        <div className="tp-card-title">Legal Documents</div>
                        <div className="tp-card-sub">
                          {prop.documents ? prop.documents.filter((d: any) => d.status === 'verified').length : 0} of {prop.documents ? prop.documents.length : 0} documents verified
                        </div>
                      </div>
                      <input
                        type="file"
                        ref={docUploadRef}
                        onChange={handleDetailDocUpload}
                        style={{ display: 'none' }}
                        accept=".pdf,.doc,.docx,image/*"
                      />
                      <button className="tp-btn tp-btn-gold" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => docUploadRef.current?.click()}>
                        {I.upload} Upload Document
                      </button>
                    </div>
                    <div className="tp-doc-list">
                      {prop.documents && prop.documents.map((d, i) => (
                        <div key={i} className="tp-doc-item">
                          <div className={`tp-doc-icon ${d.status}`}>
                            {d.status === 'verified' ? '✅' : '⏳'}
                          </div>
                          <div>
                            <div className="tp-doc-name">{d.name}</div>
                            <div className="tp-doc-meta">
                              {d.status === 'verified' ? `Uploaded ${d.date}` : 'Pending upload'} · {d.size}
                            </div>
                          </div>
                          <div className="tp-doc-actions">
                            {d.status === 'verified' ? (
                              <>
                                <button className="tp-act gold" title="View" onClick={() => handleViewDocument(d)}>{I.eye}</button>
                                <button className="tp-act" title="Download" onClick={() => handleDownloadDocument(d)}>{I.download}</button>
                                <button className="tp-act" title="Delete" onClick={() => handleDeleteDocument(d)} style={{ color: '#EF4444' }}>{I.trash}</button>
                              </>
                            ) : (
                              <button className="tp-btn tp-btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => docUploadRef.current?.click()}>Upload</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}



          </div>
        </div>
      </div>

      {showVideoModal && prop.videoUrl && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(14,17,23,0.85)',
          backdropFilter: 'blur(16px)',
          zIndex: 100,
          display: 'grid',
          placeItems: 'center',
          padding: 32,
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setShowVideoModal(false)}>
          <div style={{
            background: 'var(--ink-2)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--r-lg)',
            width: '100%',
            maxWidth: 800,
            padding: 16,
            position: 'relative',
            boxShadow: 'var(--sh-elev)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--f-display)', color: '#fff', fontSize: 18, fontWeight: 600 }}>Property Video Walkthrough</h3>
              <button 
                className="tp-act" 
                onClick={() => setShowVideoModal(false)}
                style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }}
              >
                ✕
              </button>
            </div>
            <video src={prop.videoUrl} controls autoPlay style={{ width: '100%', borderRadius: 'var(--r-sm)', background: '#000' }} />
          </div>
        </div>
      )}

      {isLightboxOpen && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(10,13,20,0.96)',
            backdropFilter: 'blur(20px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', width: 36, height: 36, borderRadius: '50%',
              cursor: 'pointer', display: 'grid', placeItems: 'center',
              fontSize: 16, zIndex: 10,
            }}
          >✕</button>

          {/* Inner: main image + thumb strip */}
          <div
            style={{ display: 'flex', gap: 16, alignItems: 'stretch', maxWidth: '92vw', maxHeight: '88vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Main image + prev/next */}
            <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {/* Prev arrow */}
              {prop.images && prop.images.length > 1 && (
                <button
                  onClick={() => setActiveImgIndex(i => (i - 1 + prop.images!.length) % prop.images!.length)}
                  style={{
                    position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff', width: 40, height: 40, borderRadius: '50%',
                    cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 18, zIndex: 5,
                  }}
                >‹</button>
              )}
              <img
                src={prop.images && prop.images.length > 0 ? prop.images[activeImgIndex] : ''}
                alt={prop.title}
                style={{
                  maxWidth: '72vw', maxHeight: '80vh',
                  borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  objectFit: 'contain', display: 'block',
                }}
              />
              {/* Next arrow */}
              {prop.images && prop.images.length > 1 && (
                <button
                  onClick={() => setActiveImgIndex(i => (i + 1) % prop.images!.length)}
                  style={{
                    position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff', width: 40, height: 40, borderRadius: '50%',
                    cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 18, zIndex: 5,
                  }}
                >›</button>
              )}
              {/* Caption */}
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 10, fontFamily: 'var(--f-mono)' }}>
                {activeImgIndex + 1} / {prop.images?.length ?? 1} — {prop.title}
              </div>
            </div>

            {/* Right thumbnail strip */}
            {prop.images && prop.images.length > 1 && (
              <div style={{
                width: 96, display: 'flex', flexDirection: 'column', gap: 8,
                overflowY: 'auto', maxHeight: '80vh',
                scrollbarWidth: 'thin',
                paddingRight: 2,
              }}>
                {prop.images.map((imgUrl, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveImgIndex(i)}
                    style={{
                      width: 88, height: 66, flexShrink: 0,
                      borderRadius: 8, overflow: 'hidden',
                      cursor: 'pointer',
                      border: activeImgIndex === i
                        ? '2px solid var(--gold)'
                        : '2px solid rgba(255,255,255,0.1)',
                      opacity: activeImgIndex === i ? 1 : 0.55,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`Image ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmDoc}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteConfirmDoc?.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={executeDeleteDocument}
        onCancel={() => setDeleteConfirmDoc(null)}
      />

      {toast.visible && (
        <div 
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'var(--ink)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-strong)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 10,
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            zIndex: 1001,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'modalIn 0.25s ease-out'
          }}
        >
          <span>✨</span> {toast.message}
        </div>
      )}
    </div>
  );
}
