import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const paragraphText = 
  "Tamizha Properties serves as an elite full-stack real estate administrative workspace created to organize, track, and scale property sales. " +
  "Inside this unified system, we manage extensive property listings including residential gated plots, beachfront estates, and luxury villas. " +
  "We register new property portfolios by recording detailed titles, geographic locations, total square footage, and pricing in Lakhs or Crores. " +
  "The workspace allows us to seamlessly filter active properties by specific districts such as Coimbatore, Chennai, Tirunelveli, and Tenkasi. " +
  "We monitor RERA verification status directly on the dashboard to ensure all listed properties comply with government standards. " +
  "Our team utilizes the executive master dashboard to gain real-time visibility into annual revenue progress and total active assets. " +
  "We keep constant track of our total land bank in acres, evaluating monthly sales velocities and rolling annual transaction counts. " +
  "The integrated CRM pipeline allows us to capture new customer inquiries instantly when prospects register on our public application. " +
  "We classify prospective buyers into distinct categories—such as Hot, Warm, and New leads—to prioritize our daily follow-up activities. " +
  "To facilitate rapid client communications, relationship managers can dial customer phone numbers directly using integrated system calls. " +
  "We compose and dispatch customized WhatsApp greeting messages containing specific property and interest details with one simple click. " +
  "Our sales desk utilizes automated email drafting utilities to send professional proposals and transaction updates to buyers. " +
  "We monitor site visit bookings and customer tour schedules to ensure our agents successfully coordinate regional property views. " +
  "The analytical reports section displays beautiful visual charts representing monthly revenue progress and transaction volume trends. " +
  "We evaluate agent performance using live leaderboards that track closed deal quantities, total sales volumes, and customer ratings. " +
  "Relationship agents can browse full member directories to manage administrative credentials, security roles, and native background locations. " +
  "We perform secure platform onboarding operations to manually register verified real estate buyers and premium international NRI investors. " +
  "The application enables us to download complete data registries into formatted CSV spreadsheets for physical filing and off-site reports. " +
  "Our development mode implements automated database synchronization to load high-fidelity mock data and baseline properties immediately. " +
  "Ultimately, this portal bridges the gap between regional property listings, active customer enquiries, and efficient brokerage operations.";

export default function AboutPage() {
  return (
    <div className="tp-layout">
      <Sidebar />
      <div className="tp-main">
        <Topbar searchPlaceholder="Search help and documentation…" />
        <div className="tp-content">
          
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <span className="tp-eyebrow">Platform Overview</span>
            <h1 className="tp-h1">About <em>Tamizha Properties</em></h1>
            <p className="tp-subtitle">Detailed functional walkthrough of what we manage and execute in this platform.</p>
          </div>

          {/* 20-Sentence Paragraph Container */}
          <div className="tp-card" style={{ padding: '36px 44px', borderRadius: 20 }}>
            <div style={{ borderBottom: '1px solid var(--border-2)', paddingBottom: 18, marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 600 }}>Functional Business Specifications</h2>
            </div>

            {/* Prose block */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(226,195,109,0.04) 0%, rgba(226,195,109,0.01) 100%)',
              borderLeft: '4px solid var(--gold-deep)',
              padding: '24px 30px',
              borderRadius: '0 16px 16px 0',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.01)'
            }}>
              <p style={{
                fontSize: '15.5px',
                lineHeight: '1.9',
                color: 'var(--text-2)',
                textAlign: 'justify',
                margin: 0,
                fontFamily: 'var(--f-body)',
                fontWeight: 500,
                letterSpacing: '-0.05px'
              }}>
                {paragraphText}
              </p>
            </div>

            {/* Core functional columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 32, borderTop: '1px solid var(--border-2)', paddingTop: 28 }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.12em' }}>1. Asset Controls</div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginTop: 4, color: 'var(--ink)' }}>Registering, filtering and verifying plots / villas</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.12em' }}>2. CRM Communications</div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginTop: 4, color: 'var(--ink)' }}>One-click WhatsApp, email and phone client dialing</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.12em' }}>3. Business Reports</div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginTop: 4, color: 'var(--ink)' }}>Tracking land bank size, monthly revenue & conversion funnel</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-2)', paddingTop: 18, marginTop: 28, textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
              © 2026 Tamizha Properties · Secure Enterprise Admin Workspace v2.0
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
