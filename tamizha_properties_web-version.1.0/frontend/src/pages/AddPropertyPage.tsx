import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import FloatField from '../components/FloatField';
import { I } from '../components/Icons';
import { propertiesApi } from '../api/properties.api';
import client from '../api/client';

const districts = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul',
  'Erode', 'Kallakurichi', 'Kancheepuram', 'Kanniyakumari', 'Karur', 'Krishnagiri', 'Madurai',
  'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni',
  'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupattur', 'Tiruvallur', 'Tiruvannamalai',
  'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar', 'Nagercoil', 'Malaysia'
];
const statusOptions = ['For Sale', 'Premium', 'New Launch', 'Sold', 'Draft'];
const plotTypeOptions = ['Residential', 'Commercial', 'Industrial', 'Agricultural'];

const AVAILABLE_AMENITIES = [
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
];

export default function AddPropertyPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [step, setStep] = useState(1);
  const [selectedDistrict, setSelectedDistrict] = useState('Coimbatore');
  const [selectedStatus, setSelectedStatus] = useState('For Sale');
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);

  // Amenities State
  const [selectedAmenities, setSelectedAmenities] = useState<{ label: string; emoji: string }[]>(AVAILABLE_AMENITIES);
  const [customEmoji, setCustomEmoji] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customAmenitiesList, setCustomAmenitiesList] = useState<{ label: string; emoji: string }[]>([]);

  // Nearby Infrastructure State
  const [nearbyList, setNearbyList] = useState<{ icon: string; label: string; dist: string }[]>([
    { icon: '🏫', label: "St. Xavier's School", dist: '1.2 km' },
    { icon: '🏥', label: 'Tirunelveli Med. Coll.', dist: '2.4 km' },
    { icon: '🚉', label: 'Tirunelveli Junction', dist: '4.0 km' },
    { icon: '🛍️', label: 'Central Mega Mall', dist: '3.1 km' },
    { icon: '⛽', label: 'BPCL Petrol Bunk', dist: '0.6 km' },
    { icon: '🏦', label: 'SBI Main Branch', dist: '2.0 km' },
  ]);
  const [nearbyIcon, setNearbyIcon] = useState('');
  const [nearbyLabel, setNearbyLabel] = useState('');
  const [nearbyDist, setNearbyDist] = useState('');

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [sqft, setSqft] = useState('');
  const [ground, setGround] = useState('');
  const [plotType, setPlotType] = useState('Residential');
  const [isReraVerified, setIsReraVerified] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  // Pricing & Offers State
  const [displayPriceLabel, setDisplayPriceLabel] = useState('');
  const [offerCode, setOfferCode] = useState('');
  const [bankOffer, setBankOffer] = useState('');
  const [partnerOffer, setPartnerOffer] = useState('');
  const [specialNote, setSpecialNote] = useState('');

  // Convert any absolute /uploads/ URL to a relative path so it resolves
  // correctly regardless of which port/host the browser uses.
  const toRelativeUrl = (url: string): string => {
    if (!url || url.startsWith('/')) return url;
    const match = url.match(/\/uploads\/[^?#]+/);
    return match ? match[0] : url;
  };

  // Images state and refs
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video state and refs
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoName, setVideoName] = useState<string>('');
  const [videoSize, setVideoSize] = useState<string>('');
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Documents state and refs
  const [documents, setDocuments] = useState<{ name: string; size: string; status: string; date: string; fileData: string }[]>([]);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Operational State
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  // Fetch property details when in Edit Mode
  useEffect(() => {
    if (isEditMode && id) {
      propertiesApi.getOne(id)
        .then(p => {
          setTitle(p.title || '');
          setDescription(p.description || '');
          setLocation(p.location || '');
          setSelectedDistrict(p.district || 'Coimbatore');
          setSelectedStatus(p.status || 'For Sale');
          setPlotType(p.plotType || 'Residential');
          setPrice(p.price ? p.price.toString() : '');
          setDisplayPriceLabel(p.priceLabel || '');
          setSqft(p.sqft ? p.sqft.toString() : '');
          setGround(p.ground ? p.ground.toString() : '');
          setIsReraVerified(p.isReraVerified || false);
          setIsFeatured(p.isFeatured || false);
          setOfferCode(p.offerCode || '');
          setBankOffer(p.bankOffer || '');
          setPartnerOffer(p.partnerOffer || '');
          setImages((p.images || []).map(toRelativeUrl));
          setVideoUrl(p.videoUrl || '');
          if (p.videoUrl) {
            setVideoName('walkthrough.mp4');
            setVideoSize('Uploaded');
          }
          setDocuments(p.documents || []);
          if (p.amenities && Array.isArray(p.amenities)) {
            setSelectedAmenities(p.amenities);
            const customOnes = p.amenities.filter(
              (a: any) => !AVAILABLE_AMENITIES.some((std) => std.label.toLowerCase() === a.label.toLowerCase())
            );
            setCustomAmenitiesList(customOnes);
          } else {
            setSelectedAmenities(AVAILABLE_AMENITIES);
          }
          if (p.nearby && Array.isArray(p.nearby)) {
            setNearbyList(p.nearby);
          }
        })
        .catch(err => {
          console.error('Failed to load property details:', err);
          setError('Failed to fetch property details from database.');
        });
    }
  }, [id, isEditMode]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        const form = new FormData();
        form.append('file', file);
        const res = await client.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        setImages(prev => [...prev, toRelativeUrl(res.data.url)]);
      } catch (err) {
        console.error('Image upload failed:', err);
        alert('Failed to upload image.');
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        const form = new FormData();
        form.append('file', file);
        const res = await client.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        setImages(prev => [...prev, toRelativeUrl(res.data.url)]);
      } catch (err) {
        console.error('Image drop upload failed:', err);
      }
    }
  };

  const handleVideoBrowseClick = () => {
    videoInputRef.current?.click();
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoName(file.name);
    setVideoSize('Uploading...');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await client.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setVideoUrl(res.data.url);
      setVideoSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    } catch (err) {
      console.error('Video upload failed:', err);
      alert('Failed to upload video.');
      setVideoSize('Failed');
    }
  };

  const handleRemoveVideo = () => {
    setVideoUrl('');
    setVideoName('');
    setVideoSize('');
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleDocChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
      try {
        const form = new FormData();
        form.append('file', file);
        const res = await client.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        setDocuments(prev => [...prev, {
          name: file.name,
          size: `${sizeInMb} MB`,
          status: 'verified',
          date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          fileData: res.data.url,
        }]);
      } catch (err) {
        console.error('Document upload failed:', err);
      }
    }
  };

  const handleRemoveDoc = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  // Submission handler to call database API
  const handlePublish = async () => {
    if (!title || !location) {
      setError('Please fill in the Property Title and address / location.');
      setStep(1);
      return;
    }

    setPublishing(true);
    setError('');

    try {
      const numPrice = parseFloat(price);
      
      // Auto-compute price label if displaying blank
      let finalPriceLabel = displayPriceLabel;
      if (!finalPriceLabel && !isNaN(numPrice)) {
        if (numPrice >= 10000000) {
          finalPriceLabel = `₹${(numPrice / 10000000).toFixed(1)} Cr`;
        } else if (numPrice >= 100000) {
          finalPriceLabel = `₹${(numPrice / 100000).toFixed(1)} Lakhs`;
        } else {
          finalPriceLabel = `₹${numPrice.toLocaleString()}`;
        }
      }

      const payload = {
        title,
        description: description || "",
        location,
        district: selectedDistrict,
        price: numPrice || 0,
        priceLabel: finalPriceLabel || '₹0',
        sqft: parseInt(sqft) || undefined,
        ground: parseFloat(ground) || undefined,
        status: selectedStatus as any,
        isReraVerified,
        isFeatured,
        offerCode: offerCode || "",
        bankOffer: bankOffer || "",
        partnerOffer: partnerOffer || "",
        images: images.length > 0 ? images : undefined,
        videoUrl: videoUrl || "",
        imgType: selectedStatus === 'Premium' ? 'villa' : 'land',
        plotType,
        documents: documents,
        amenities: selectedAmenities,
        nearby: nearbyList,
      };

      if (isEditMode && id) {
        await propertiesApi.update(id, payload);
      } else {
        await propertiesApi.create(payload);
      }

      navigate(isEditMode ? `/properties/${id}` : '/properties');
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to save property listing to database. Please check connection.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="tp-layout">
      <Sidebar />
      <div className="tp-main">
        <Topbar searchPlaceholder={isEditMode ? "Edit property listing…" : "Add new property listing…"} />
        <div className="tp-content">

          {/* Error Alert Display */}
          {error && (
            <div style={{
              marginBottom: 20, padding: '12px 18px', borderRadius: 10,
              background: 'var(--danger-soft)', border: '1px solid rgba(220,38,38,0.2)',
              fontSize: 14, color: '#B91C1C', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <button
                  className="tp-btn tp-btn-ghost"
                  style={{ padding: '6px 14px', fontSize: 13 }}
                  onClick={() => navigate('/properties')}
                >
                  ← Back to Properties
                </button>
                <span style={{ color: 'var(--border-strong)', fontSize: 18 }}>·</span>
                {/* Step pills */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    background: step === 1 ? '#0E1117' : 'var(--bg)',
                    color: step === 1 ? '#E2C36D' : 'var(--text-3)',
                    border: step === 1 ? '1px solid #1F2433' : '1px solid var(--border)',
                  }}>
                    <span style={{ width: 18, height: 18, borderRadius: 999, background: step === 1 ? 'var(--gold)' : 'var(--border)', color: step === 1 ? '#0E1117' : 'var(--text-3)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700 }}>1</span>
                    Media &amp; Details
                  </span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    background: step === 2 ? '#0E1117' : 'var(--bg)',
                    color: step === 2 ? '#E2C36D' : 'var(--text-3)',
                    border: step === 2 ? '1px solid #1F2433' : '1px solid var(--border)',
                  }}>
                    <span style={{ width: 18, height: 18, borderRadius: 999, background: step === 2 ? 'var(--gold)' : 'var(--border)', color: step === 2 ? '#0E1117' : 'var(--text-3)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700 }}>2</span>
                    Pricing &amp; Publish
                  </span>
                </div>
              </div>
              <span className="tp-eyebrow">Asset Registry</span>
              <h1 className="tp-h1">
                {step === 1 
                  ? <>{isEditMode ? 'Edit' : 'Add'} Property — <em>Step 1 of 2</em></> 
                  : <>{isEditMode ? 'Preview & Update' : 'Preview & Publish'}</>
                }
              </h1>
              <p className="tp-subtitle">
                {step === 1
                  ? 'Upload photos and a walkthrough video, then fill in all property details.'
                  : (isEditMode 
                      ? 'Review listing details, set pricing options and update the property listing.' 
                      : 'Review listing details, set pricing options and publish to the user app.'
                    )
                }
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <button className="tp-btn tp-btn-ghost" onClick={() => navigate(isEditMode ? `/properties/${id}` : '/properties')}>Discard</button>
              {step === 1
                ? <button className="tp-btn tp-btn-dark" onClick={() => setStep(2)}>Save draft</button>
                : <button className="tp-btn tp-btn-dark" onClick={() => setStep(1)}>← Back</button>
              }
              {step === 1
                ? <button className="tp-btn tp-btn-gold" onClick={() => setStep(2)}>Continue → Preview</button>
                : <button className="tp-btn tp-btn-gold" onClick={handlePublish} disabled={publishing}>
                    {publishing 
                      ? <span className="tp-spinner" style={{ width: 14, height: 14, marginRight: 8 }}/> 
                      : I.check
                    }
                    {publishing 
                      ? (isEditMode ? 'Updating...' : 'Publishing...') 
                      : (isEditMode ? 'Update Listing' : 'Publish Listing')
                    }
                  </button>
              }
            </div>
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'flex-start' }}>

              {/* LEFT — Media */}
              <div style={{ display: 'grid', gap: 16 }}>
                {/* Photo dropzone */}
                <div className="tp-card" style={{ padding: 24 }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Property Photos</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>Up to 16 images · JPG/PNG/WEBP · max 8MB each</div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                  />

                  {/* Thumbnails */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' as const }}>
                    {images.map((imgSrc, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img 
                          src={imgSrc} 
                          alt={`Upload ${i}`} 
                          style={{ width: 90, height: 70, objectFit: 'cover', borderRadius: 10 }}
                        />
                        {i === 0 && (
                          <span style={{
                            position: 'absolute', bottom: 4, left: 4,
                            background: 'var(--gold)', color: '#0E1117',
                            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                          }}>COVER</span>
                        )}
                        <button 
                          className="tp-act danger" 
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          style={{
                            position: 'absolute', top: 4, right: 4,
                            width: 20, height: 20, borderRadius: 6, padding: 0,
                          }}
                        >
                          {I.trash}
                        </button>
                      </div>
                    ))}
                    {/* Add more */}
                    <div 
                      onClick={handleBrowseClick}
                      style={{
                        width: 90, height: 70, borderRadius: 10,
                        background: 'rgba(14,17,23,0.04)',
                        border: '1.5px dashed var(--border-strong)',
                        display: 'grid', placeItems: 'center',
                        color: 'var(--text-3)', cursor: 'pointer',
                      }}
                    >
                      {I.plus}
                    </div>
                  </div>

                  {/* Drop area */}
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    style={{
                      border: '1.5px dashed var(--border-strong)', borderRadius: 12,
                      background: 'var(--bg-warm)', padding: '16px 20px',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'rgba(226,195,109,0.15)', color: 'var(--gold-deep)',
                      display: 'grid', placeItems: 'center', flexShrink: 0,
                    }}>{I.upload}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Drag &amp; drop photos here</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>or click Browse to select from your device</div>
                    </div>
                    <button 
                      type="button"
                      className="tp-btn tp-btn-ghost" 
                      onClick={handleBrowseClick}
                      style={{ padding: '6px 14px', fontSize: 12, flexShrink: 0 }}
                    >
                      Browse
                    </button>
                  </div>
                </div>

                {/* Video */}
                <div className="tp-card" style={{ padding: 20 }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Walkthrough Video</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>MP4 or MOV · max 200MB · drone/interior footage recommended</div>
                  
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={handleVideoChange}
                    accept="video/*"
                    style={{ display: 'none' }}
                  />

                  {videoUrl ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', border: '1px solid var(--border)',
                      borderRadius: 12, background: 'var(--surface-2)',
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0E1117', color: 'var(--gold)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{videoName || 'walkthrough_video.mp4'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--f-mono)', marginTop: 2 }}>{videoSize || 'N/A'} · Uploaded</div>
                      </div>
                      <button 
                        type="button"
                        onClick={handleRemoveVideo}
                        className="tp-act danger"
                      >
                        {I.trash}
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      border: '1.5px dashed var(--border-strong)', borderRadius: 12,
                      background: 'var(--bg-warm)', padding: '14px 18px',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(226,195,109,0.12)', color: 'var(--gold-deep)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{I.upload}</div>
                      <div style={{ flex: 1, fontSize: 12, color: 'var(--text-3)' }}>Upload a walkthrough video</div>
                      <button 
                        type="button"
                        onClick={handleVideoBrowseClick}
                        className="tp-btn tp-btn-ghost" 
                        style={{ padding: '5px 12px', fontSize: 12, flexShrink: 0 }}
                      >
                        Browse
                      </button>
                    </div>
                  )}
                </div>

                {/* Legal Documents Upload */}
                <div className="tp-card" style={{ padding: 20 }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Legal Documents</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>Upload PDF, DOCX or images (e.g., RERA Certificate, Title Deed, Layout Approval)</div>
                  
                  <input
                    type="file"
                    ref={docInputRef}
                    onChange={handleDocChange}
                    multiple
                    accept=".pdf,.doc,.docx,image/*"
                    style={{ display: 'none' }}
                  />

                  {/* Document List */}
                  {documents.length > 0 && (
                    <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                      {documents.map((doc, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 14px',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          background: 'var(--surface)'
                        }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 8,
                            background: 'rgba(226,195,109,0.12)', color: 'var(--gold-deep)',
                            display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0
                          }}>📄</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{doc.size} · {doc.status || 'verified'}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(idx)}
                            className="tp-act danger"
                            style={{ padding: 4 }}
                          >
                            {I.trash}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{
                    border: '1.5px dashed var(--border-strong)', borderRadius: 12,
                    background: 'var(--bg-warm)', padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(226,195,109,0.12)', color: 'var(--gold-deep)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{I.upload}</div>
                    <div style={{ flex: 1, fontSize: 12, color: 'var(--text-3)' }}>Upload property documents</div>
                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      className="tp-btn tp-btn-ghost"
                      style={{ padding: '5px 12px', fontSize: 12, flexShrink: 0 }}
                    >
                      Browse
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT — Property details */}
              <div className="tp-card" style={{ padding: 28 }}>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Property Details</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 22 }}>Fill in all fields to publish this listing.</div>

                <div style={{ display: 'grid', gap: 16 }}>
                  <FloatField label="Property title" value={title} onChange={setTitle} />
                  <FloatField label="Description" value={description} onChange={setDescription} textarea />
                  <FloatField label="Full address / location" value={location} onChange={setLocation} />

                  {/* District */}
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8 }}>District</div>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        type="button"
                        onClick={() => setIsDistrictOpen(o => !o)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          minWidth: 260, width: '100%',
                          background: 'var(--surface)',
                          color: 'var(--ink)',
                          border: '1.5px solid var(--border-strong)',
                          borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 600,
                          fontFamily: 'var(--f-body)', cursor: 'pointer', outline: 'none',
                        }}
                      >
                        <span style={{ flex: 1, textAlign: 'left' }}>{selectedDistrict}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>▼</span>
                      </button>
                      {isDistrictOpen && (
                        <>
                          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setIsDistrictOpen(false)} />
                          <div style={{
                            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            minWidth: 260, maxHeight: 320, overflowY: 'auto',
                          }}>
                            {[
                              { label: 'Tamil Nadu', options: districts.filter(d => d !== 'Nagercoil' && d !== 'Malaysia').map(v => ({ value: v, label: v })) },
                              { label: 'Other', options: [{ value: 'Nagercoil', label: 'Nagercoil' }, { value: 'Malaysia', label: 'Malaysia' }] },
                            ].map((group, gi) => (
                              <div key={gi}>
                                <div style={{ padding: '6px 12px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', borderTop: gi > 0 ? '1px solid var(--border-2)' : 'none' }}>
                                  {group.label}
                                </div>
                                {group.options.map(opt => (
                                  <div
                                    key={opt.value}
                                    onClick={() => { setSelectedDistrict(opt.value); setIsDistrictOpen(false); }}
                                    style={{
                                      padding: '8px 14px', fontSize: 13, cursor: 'pointer',
                                      fontWeight: selectedDistrict === opt.value ? 700 : 400,
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
                  </div>

                  {/* Status */}
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8 }}>Listing Status</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                      {statusOptions.map(s => (
                        <button key={s} type="button" className={`tp-chip${selectedStatus === s ? ' active' : ''}`} onClick={() => setSelectedStatus(s)}>{s}</button>
                      ))}
                    </div>
                  </div>

                  {/* Property Type */}
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8 }}>Property Type</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                      {plotTypeOptions.map(t => (
                        <button key={t} type="button" className={`tp-chip${plotType === t ? ' active' : ''}`} onClick={() => setPlotType(t)}>{t}</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <FloatField label="Price (₹)" value={price} onChange={setPrice} mono />
                    <FloatField label="Sqft" value={sqft} onChange={setSqft} mono />
                    <FloatField label="Ground area" value={ground} onChange={setGround} mono />
                  </div>

                  {/* Flags */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--surface)' }}>
                      <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--gold-deep)' }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Featured Listing</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Show on homepage</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                  <button className="tp-btn tp-btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate('/properties')}>Discard</button>
                  <button className="tp-btn tp-btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(2)}>Continue → Preview</button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'flex-start' }}>

              {/* LEFT — Preview card */}
              <div style={{ display: 'grid', gap: 16 }}>
                <div className="tp-card" style={{ overflow: 'hidden' }}>
                  <div style={{ height: 220, position: 'relative', overflow: 'hidden' }}>
                    {images.length > 0 ? (
                      <img src={images[0]} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className={`tp-img ${selectedStatus === 'Premium' ? 'villa' : 'land'}`} style={{ width: '100%', height: '100%', borderRadius: 0 }} />
                    )}
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <span className="tp-tag tp-tag-premium">{selectedStatus.toUpperCase()}</span>
                    </div>
                  </div>
                  <div style={{ padding: 20 }}>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 19, fontWeight: 600, marginBottom: 4 }}>{title || 'Saraswathi Villas — Block C'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>{I.pin} {selectedDistrict} · {location || 'Saravanampatti'}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: '14px 0', borderTop: '1px solid var(--border-2)', borderBottom: '1px solid var(--border-2)', marginBottom: 14 }}>
                      {[
                        ['Price', displayPriceLabel || (price ? `₹${(parseFloat(price) / 10000000).toFixed(2)} Cr` : '₹3.4 Cr')],
                        ['Sqft', sqft || '3,600'],
                        ['Ground', ground || '1.6']
                      ].map(([l, v]) => (
                        <div key={l}>
                          <div style={{ fontSize: 10, textTransform: 'uppercase' as const, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.1em' }}>{l}</div>
                          <div style={{ fontFamily: l === 'Price' ? 'var(--f-display)' : 'var(--f-mono)', fontWeight: 600, fontSize: l === 'Price' ? 17 : 14, marginTop: 2 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span className="tp-pill tp-pill-gold">{selectedDistrict}</span>
                      <span className="tp-pill tp-pill-info">{selectedStatus}</span>
                    </div>
                  </div>
                </div>



                {/* Nearby Infrastructure card */}
                <div className="tp-card" style={{ padding: 24 }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Nearby Infrastructure</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>List schools, hospitals, malls and transport hubs.</div>
                  
                  {/* Current List rendering with small delete option */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                    {nearbyList.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--surface)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>{item.icon}</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)' }}>{item.label}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{item.dist}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNearbyList(prev => prev.filter((_, idx) => idx !== index))}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            fontSize: 12,
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Form to add new item */}
                  <div style={{ borderTop: '1px solid var(--border-2)', paddingTop: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, color: 'var(--text-3)', marginBottom: 10, letterSpacing: '0.05em' }}>Add Nearby Infrastructure</div>
                    
                    {/* Quick Emoji Selector */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', marginRight: 4 }}>Quick select:</span>
                      {['🏫', '🏥', '🚉', '🛍️', '⛽', '🏦', '🌳', '🛣️', '🎓', '🚇', '🏠', '🏪'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNearbyIcon(emoji)}
                          style={{
                            background: nearbyIcon === emoji ? 'rgba(226,195,109,0.15)' : 'rgba(14,17,23,0.03)',
                            border: nearbyIcon === emoji ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                            borderRadius: 6,
                            width: 32,
                            height: 32,
                            display: 'grid',
                            placeItems: 'center',
                            cursor: 'pointer',
                            fontSize: 16,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Icon"
                        value={nearbyIcon}
                        onChange={e => setNearbyIcon(e.target.value)}
                        style={{
                          width: 60,
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--surface)',
                          fontSize: 14,
                          textAlign: 'center',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Name (e.g. KV School)"
                        value={nearbyLabel}
                        onChange={e => setNearbyLabel(e.target.value)}
                        style={{
                          flex: 2,
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--surface)',
                          fontSize: 14,
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Dist (e.g. 1.5 km)"
                        value={nearbyDist}
                        onChange={e => setNearbyDist(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--surface)',
                          fontSize: 14,
                        }}
                      />
                      <button
                        type="button"
                        className="tp-btn tp-btn-gold"
                        onClick={() => {
                          if (!nearbyLabel.trim() || !nearbyDist.trim()) return;
                          const icon = nearbyIcon.trim() || '📍';
                          const newItem = {
                            icon,
                            label: nearbyLabel.trim(),
                            dist: nearbyDist.trim(),
                          };
                          setNearbyList(prev => [...prev, newItem]);
                          setNearbyIcon('');
                          setNearbyLabel('');
                          setNearbyDist('');
                        }}
                        style={{ padding: '8px 16px', fontSize: 13 }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT — Pricing & Offers */}
              <div style={{ display: 'grid', gap: 16 }}>
                <div className="tp-card" style={{ padding: 24 }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Pricing &amp; Offers</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>Set promo codes, bank tie-ups and partner credits.</div>
                  <div style={{ display: 'grid', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <FloatField label="Display price label" value={displayPriceLabel} onChange={setDisplayPriceLabel} mono />
                      <FloatField label="Offer code" value={offerCode} onChange={setOfferCode} mono />
                    </div>
                    <FloatField label="Bank offer" value={bankOffer} onChange={setBankOffer} />
                    <FloatField label="Partner / interiors credit" value={partnerOffer} onChange={setPartnerOffer} />
                    <FloatField label="Special note (shown in app)" value={specialNote} onChange={setSpecialNote} />
                  </div>
                </div>

                {/* Amenities & Features selection card */}
                <div className="tp-card" style={{ padding: 24 }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Amenities &amp; Features</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>Select all features available at this property.</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                    {AVAILABLE_AMENITIES.map((amenity) => {
                      const isSelected = selectedAmenities.some(a => a.label === amenity.label);
                      return (
                        <button
                          key={amenity.label}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAmenities(prev => prev.filter(a => a.label !== amenity.label));
                            } else {
                              setSelectedAmenities(prev => [...prev, amenity]);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '12px 14px',
                            borderRadius: 10,
                            border: isSelected ? '1.5px solid var(--gold-deep)' : '1px solid var(--border)',
                            background: isSelected ? 'rgba(226,195,109,0.1)' : 'var(--surface)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            color: isSelected ? 'var(--gold-deep)' : 'var(--text-main)',
                            fontWeight: isSelected ? 600 : 500,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span style={{ fontSize: 16 }}>{amenity.emoji}</span>
                          <span style={{ fontSize: 13 }}>{amenity.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-2)', paddingTop: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, color: 'var(--text-3)', marginBottom: 10, letterSpacing: '0.05em' }}>Add Custom Amenity</div>
                    
                    {/* Quick Emoji Selector */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', marginRight: 4 }}>Quick select:</span>
                      {['🏊', '🏋️', '🚗', '🛝', '🛜', '🍖', '🎾', '🏠', '🚶', '🌱', '☀️', '🚲', '🛡️', '💧', '⚡'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setCustomEmoji(emoji)}
                          style={{
                            background: customEmoji === emoji ? 'rgba(226,195,109,0.15)' : 'rgba(14,17,23,0.03)',
                            border: customEmoji === emoji ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                            borderRadius: 6,
                            width: 32,
                            height: 32,
                            display: 'grid',
                            placeItems: 'center',
                            cursor: 'pointer',
                            fontSize: 16,
                            transition: 'all 0.15s ease',
                          }}
                          title="Click to select"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <input
                        type="text"
                        placeholder="Emoji (e.g. 🏊)"
                        value={customEmoji}
                        onChange={e => setCustomEmoji(e.target.value)}
                        style={{
                          width: 80,
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--surface)',
                          fontSize: 14,
                          textAlign: 'center',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Amenity name (e.g. Swimming Pool)"
                        value={customLabel}
                        onChange={e => setCustomLabel(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--surface)',
                          fontSize: 14,
                        }}
                      />
                      <button
                        type="button"
                        className="tp-btn tp-btn-gold"
                        onClick={() => {
                          if (!customLabel.trim()) return;
                          const emoji = customEmoji.trim() || '✨';
                          const newAmenity = { label: customLabel.trim(), emoji };
                          setSelectedAmenities(prev => {
                            if (prev.some(a => a.label.toLowerCase() === newAmenity.label.toLowerCase())) {
                              return prev;
                            }
                            return [...prev, newAmenity];
                          });
                          setCustomAmenitiesList(prev => {
                            if (prev.some(a => a.label.toLowerCase() === newAmenity.label.toLowerCase())) {
                              return prev;
                            }
                            return [...prev, newAmenity];
                          });
                          setCustomLabel('');
                          setCustomEmoji('');
                        }}
                        style={{ padding: '8px 16px', fontSize: 13 }}
                      >
                        Add
                      </button>
                    </div>
                    
                    {customAmenitiesList.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginTop: 12 }}>
                        {customAmenitiesList.map((c, i) => {
                          const isSelected = selectedAmenities.some(a => a.label === c.label);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                  if (isSelected) {
                                    setSelectedAmenities(prev => prev.filter(a => a.label !== c.label));
                                  } else {
                                    setSelectedAmenities(prev => [...prev, c]);
                                  }
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                borderRadius: 8,
                                border: isSelected ? '1px solid var(--gold-deep)' : '1px solid var(--border)',
                                background: isSelected ? 'rgba(226,195,109,0.08)' : 'var(--bg)',
                                fontSize: 12,
                                cursor: 'pointer',
                                color: isSelected ? 'var(--gold-deep)' : 'var(--text-2)',
                              }}
                            >
                              <span>{c.emoji}</span>
                              <span>{c.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="tp-card" style={{ padding: 24 }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Publish Settings</div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--surface)' }}>
                      <input type="checkbox" defaultChecked={true} style={{ width: 16, height: 16, accentColor: 'var(--gold-deep)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Publish to User App</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Visible to all app users immediately</div>
                      </div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--surface)' }}>
                      <input type="checkbox" defaultChecked={true} style={{ width: 16, height: 16, accentColor: 'var(--gold-deep)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Notify NRI Investors</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Push notification to premium members</div>
                      </div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--surface)' }}>
                      <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--gold-deep)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Feature on Homepage</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Pinned in Featured this week carousel</div>
                      </div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--surface)' }}>
                      <input type="checkbox" defaultChecked={true} style={{ width: 16, height: 16, accentColor: 'var(--gold-deep)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Enable Enquiry Form</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Capture leads from property page</div>
                      </div>
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                    <button className="tp-btn tp-btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(1)}>← Edit Details</button>
                    <button className="tp-btn tp-btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={handlePublish} disabled={publishing}>
                      {publishing ? <span className="tp-spinner" style={{ width: 14, height: 14, marginRight: 8 }}/> : I.check}
                      {publishing ? 'Publishing...' : 'Publish Listing'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
