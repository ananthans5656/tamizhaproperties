import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { I } from '../components/Icons';
import { leadsApi } from '../api/leads.api';

const QUICK_REPLIES = [
  'Thank you for your interest! I\'ll send the brochure shortly.',
  'Our RERA number is TNRERA/2024/PROP/12847. All documents are clear.',
  'We have NRI-friendly payment plans with POA support. Shall I explain?',
  'I\'ll schedule a virtual tour for you. What time works best?',
  'The property is ready for immediate registration. When can you visit?',
];

interface ChatMessage {
  id: string;
  text: string;
  sender: 'admin' | 'client';
  timestamp: any;
}

interface LeadItem {
  id: string;        // Firestore doc ID
  userId: string;    // Firebase Auth UID — messages live at leads/{userId}/messages
  name: string;
  phone: string;
  city: string;
  status: 'HOT' | 'WARM' | 'NEW';
  property: string;
  lastTime: string;
  source: string;
  tc: string;
}

const TC = ['c1','c2','c3','c4','c5','c6','c7'];

function statusPillClass(s: string) {
  if (s === 'HOT') return 'tp-pill tp-pill-danger';
  if (s === 'WARM') return 'tp-pill tp-pill-warn';
  return 'tp-pill tp-pill-info';
}


function formatTimestamp(ts: any): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : (ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatMsgTime(ts: any): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : (ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function EnquiriesPage() {
  const [allLeads, setAllLeads] = useState<LeadItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    leadsApi.getAll({ limit: 500 })
      .then(res => {
        const docs = (res.data || []).map((d: any, i: number) => ({
          id: String(d.id),
          userId: String(d.id),
          name: d.name || 'Unknown',
          phone: d.phone || '',
          city: d.city || '—',
          status: (['HOT','WARM','NEW'].includes(String(d.status).toUpperCase())
            ? String(d.status).toUpperCase()
            : 'NEW') as 'HOT' | 'WARM' | 'NEW',
          property: d.property_interest || d.notes || '—',
          lastTime: formatTimestamp(d.created_at || d.createdAt),
          source: d.source || '',
          tc: TC[i % TC.length],
        }));
        setAllLeads(docs);
        setSelectedId(prev => prev ?? (docs[0]?.id || null));
      })
      .catch(err => console.error('Leads fetch:', err));
  }, []);

  const msgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    setLoadingMsgs(true);
    const fetchMsgs = async () => {
      try {
        const msgs = await leadsApi.getMessages(selectedId);
        setMessages((msgs || []).map((m: any) => ({
          id: String(m.id),
          text: m.text || '',
          sender: m.sender === 'admin' ? 'admin' : 'client',
          timestamp: m.created_at || m.timestamp,
        })));
      } catch (e) {
        console.error('Messages fetch:', e);
      } finally {
        setLoadingMsgs(false);
      }
    };
    fetchMsgs();
    msgPollRef.current = setInterval(fetchMsgs, 5000);
    return () => { if (msgPollRef.current) clearInterval(msgPollRef.current); };
  }, [selectedId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filtered = allLeads;
  const selected = allLeads.find(l => l.id === selectedId) ?? filtered[0] ?? null;

  // Stats count all unique users in the inbox (allLeads is already deduplicated)
  const hot = allLeads.filter(l => l.status === 'HOT').length;
  const warm = allLeads.filter(l => l.status === 'WARM').length;
  const newCount = allLeads.filter(l => l.status === 'NEW').length;
  const sendMessage = async () => {
    if (!reply.trim() || !selected || sending) return;
    const text = reply.trim();
    setReply('');
    setSending(true);
    try {
      const msg = await leadsApi.sendMessage(selected.id, text, 'admin');
      setMessages(prev => [...prev, {
        id: String(msg.id || Date.now()),
        text: msg.text || text,
        sender: 'admin',
        timestamp: msg.created_at || new Date().toISOString(),
      }]);
      setShowQuickReplies(false);
    } catch (err) {
      console.error('Send failed:', err);
      setReply(text);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const deleteAllMessages = async () => {
    if (!selected) return;
    if (!window.confirm(`Delete all messages with ${selected.name}? This cannot be undone.`)) return;
    try {
      await leadsApi.deleteAllMessages(selected.id);
      setMessages([]);
    } catch (err) {
      console.error('Delete all failed:', err);
    }
  };

  const deleteMessage = async (msgId: string) => {
    if (!selected) return;
    try {
      await leadsApi.deleteMessage(selected.id, msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="tp-layout">
      <Sidebar />
      <div className="tp-main">
        <Topbar searchPlaceholder="Search enquiries by name, phone or property…" />
        <div className="tp-content tp-fadein">

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="tp-eyebrow">CRM · Inbox</span>
              <h1 className="tp-h1">Enquiries <em>Inbox</em></h1>
              <p className="tp-subtitle">All conversations in one unified inbox. Reply and track lead engagement.</p>
            </div>
          </div>

          {/* Stats row — live from Firestore */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Open Enquiries', val: String(hot + warm + newCount), color: 'var(--info)', icon: I.inbox },
              { label: 'Total Leads',    val: String(allLeads.length), color: 'var(--success)', icon: I.check },
            ].map((s, i) => (
              <div key={i} className="tp-mini-stat" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg)', display: 'grid', placeItems: 'center', color: s.color, flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div className="tp-mini-stat-label">{s.label}</div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.5px', color: 'var(--ink)', lineHeight: 1, marginTop: 4 }}>{s.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Split inbox */}
          <div className="tp-inbox" style={{ boxShadow: 'var(--sh-soft)' }}>

            {/* Left: lead list */}
            <div className="tp-inbox-list">
              {filtered.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No leads found</div>
              ) : (
                filtered.map(lead => (
                  <div
                    key={lead.id}
                    className={`tp-inbox-item${selectedId === lead.id ? ' active' : ''}`}
                    onClick={() => setSelectedId(lead.id)}
                  >
                    <div className={`tp-init ${lead.tc}`} style={{ width: 38, height: 38, fontSize: 12, flexShrink: 0 }}>
                      {lead.name.split(' ').map((s: string) => s[0]).slice(0,2).join('')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--f-mono)', flexShrink: 0 }}>{lead.lastTime}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {I.pin} <span>{lead.city}</span>
                        <span>·</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{lead.property}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                          {messages.length > 0 && selectedId === lead.id
                            ? messages[messages.length - 1].text
                            : 'Tap to view messages'}
                        </span>
                        <span className={statusPillClass(lead.status)} style={{ fontSize: 9, padding: '2px 6px', flexShrink: 0 }}>{lead.status}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right: conversation panel */}
            <div className="tp-inbox-detail">
              {!selected ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-3)' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>{I.inbox}</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>No enquiries found</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Select a lead to start chatting</div>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="tp-inbox-header">
                    <div className={`tp-init ${selected.tc}`} style={{ width: 40, height: 40, fontSize: 13 }}>
                      {selected.name.split(' ').map((s: string) => s[0]).slice(0,2).join('')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <span>{I.pin} {selected.city}</span>
                        <span>·</span>
                        <span style={{ fontFamily: 'var(--f-mono)' }}>{selected.phone}</span>
                      </div>
                    </div>
                    <button
                      onClick={deleteAllMessages}
                      title="Delete all messages"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 18, padding: '4px 6px', lineHeight: 1 }}
                    >🗑</button>
                  </div>

                  {/* Property card */}
                  <div style={{ padding: '12px 18px', background: 'var(--bg-warm)', borderBottom: '1px solid var(--border-2)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="tp-img land" style={{ width: 44, height: 36, fontSize: 0, padding: 0, borderRadius: 8 }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{selected.property}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Property Interest · Last engaged {selected.lastTime}</div>
                    </div>
                  </div>

                  {/* Messages — real Firestore subcollection */}
                  <div className="tp-inbox-messages" style={{ display: 'flex', flexDirection: 'column', padding: '16px 20px', gap: 10, overflowY: 'auto', flex: 1 }}>
                    {loadingMsgs ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 30 }}>Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-3)', gap: 8 }}>
                        <div style={{ fontSize: 36 }}>💬</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>Start a conversation</div>
                        <div style={{ fontSize: 12 }}>No messages yet with {selected.name}. Use quick replies below.</div>
                      </div>
                    ) : (
                      <>
                        {messages.map(msg => {
                          const isAdmin = msg.sender === 'admin';
                          const isHovered = hoveredMsgId === msg.id;
                          return (
                            <div
                              key={msg.id}
                              style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start', alignItems: 'center', gap: 6 }}
                              onMouseEnter={() => setHoveredMsgId(msg.id)}
                              onMouseLeave={() => setHoveredMsgId(null)}
                            >
                              {isAdmin && (
                                <button
                                  onClick={() => deleteMessage(msg.id)}
                                  style={{
                                    visibility: isHovered ? 'visible' : 'hidden',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: '#EF4444', fontSize: 14, padding: '2px 4px', lineHeight: 1,
                                  }}
                                  title="Delete message"
                                >🗑</button>
                              )}
                              <div style={{
                                maxWidth: '72%',
                                padding: '10px 14px',
                                borderRadius: isAdmin ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                background: isAdmin ? '#C9A84C' : 'var(--border)',
                                color: isAdmin ? '#fff' : 'var(--text)',
                                fontSize: 13,
                                lineHeight: 1.5,
                                fontWeight: 500,
                              }}>
                                <div>{msg.text}</div>
                                <div style={{
                                  fontSize: 9,
                                  marginTop: 4,
                                  textAlign: 'right',
                                  color: isAdmin ? 'rgba(255,255,255,0.7)' : 'var(--text-3)',
                                  fontWeight: 700,
                                }}>
                                  {formatMsgTime(msg.timestamp)}
                                  {isAdmin && ' · You'}
                                </div>
                              </div>
                              {!isAdmin && (
                                <button
                                  onClick={() => deleteMessage(msg.id)}
                                  style={{
                                    visibility: isHovered ? 'visible' : 'hidden',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: '#EF4444', fontSize: 14, padding: '2px 4px', lineHeight: 1,
                                  }}
                                  title="Delete message"
                                >🗑</button>
                              )}
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef}/>
                      </>
                    )}
                  </div>

                  {/* Quick replies */}
                  {showQuickReplies && (
                    <div style={{ padding: '8px 18px', borderTop: '1px solid var(--border-2)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {QUICK_REPLIES.map((qr, i) => (
                        <button key={i} className="tp-chip" style={{ fontSize: 11 }}
                          onClick={() => { setReply(qr); setShowQuickReplies(false); }}>
                          {qr.slice(0, 42)}…
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Composer */}
                  <div className="tp-inbox-composer">
                    <button className="tp-act" title="Quick replies" onClick={() => setShowQuickReplies(v => !v)}>{I.bolt}</button>
                    <textarea
                      className="tp-composer-input"
                      placeholder="Type a message… (Enter to send)"
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                    />
                    <button
                      className="tp-btn tp-btn-gold"
                      style={{ padding: '8px 16px', fontSize: 13, opacity: (!reply.trim() || sending) ? 0.5 : 1 }}
                      onClick={sendMessage}
                      disabled={!reply.trim() || sending}
                    >
                      {sending ? '…' : <>{I.send} Send</>}
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
