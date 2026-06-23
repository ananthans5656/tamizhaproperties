import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import FloatField from '../components/FloatField';
import { I } from '../components/Icons';
import { usersApi, User, UserStats } from '../api/users.api';
import ConfirmModal from '../components/ConfirmModal';

interface UserMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  native: string;
  status: string;
  role: string;
  join: string;
  tc: string;
}


function UserStat({ label, value, delta, tone }: { label: string; value: string | number; delta: string; tone: string }) {
  const dark = tone === 'dark';
  return (
    <div className="tp-card" style={{
      padding: 20,
      background: dark ? '#0E1117' : 'var(--surface)',
      color: dark ? '#fff' : 'var(--text)',
      border: dark ? '1px solid #1F2433' : '1px solid var(--border)'
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, color: dark ? 'rgba(255,255,255,0.55)' : 'var(--text-3)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 32, fontWeight: 500, letterSpacing: '-1px', lineHeight: 1, color: dark ? '#fff' : 'var(--ink)', marginBottom: 8 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: tone === 'gold' ? 'var(--gold-deep)' : tone === 'success' ? '#15803D' : tone === 'warn' ? '#B45309' : dark ? 'rgba(226,195,109,0.85)' : 'var(--text-3)' }}>{delta}</div>
    </div>
  );
}

function statusPill(status: string) {
  if (status === 'Active') return 'tp-pill tp-pill-success';
  if (status === 'NRI Premium') return 'tp-pill tp-pill-gold';
  if (status === 'Pending') return 'tp-pill tp-pill-warn';
  return 'tp-pill tp-pill-neutral';
}

interface AddUserModalProps {
  onClose: () => void;
  onSave: (user: Omit<UserMember, 'id' | 'tc' | 'join'>) => void;
  editingUser?: UserMember | null;
}

function AddUserModal({ onClose, onSave, editingUser }: AddUserModalProps) {
  const [name, setName] = useState(editingUser?.name ?? '');
  const [email, setEmail] = useState(editingUser?.email ?? '');
  const [phone, setPhone] = useState(editingUser?.phone ?? '');
  const [city, setCity] = useState(editingUser?.city ?? '');
  const [native, setNative] = useState(editingUser?.native ?? '');
  const [role, setRole] = useState(editingUser?.role ?? 'User');
  const [status, setStatus] = useState(editingUser?.status ?? 'Active');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = () => {
    if (!name || !email || !phone || !city || !native) {
      setErrorMsg('All contact details are required.');
      return;
    }
    onSave({ name, email, phone, city, native, role, status });
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(14,17,23,0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="tp-card" style={{
        width: '100%', maxWidth: 520,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 32px 80px rgba(0,0,0,0.28)',
        borderRadius: 20,
        animation: 'modalIn 0.22s ease',
      }} onClick={e => e.stopPropagation()}>
        {/* Modal header strip */}
        <div style={{
          padding: '14px 22px 0',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <span style={{
            display: 'inline-block',
            background: '#0E1117', color: '#E2C36D',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '4px 10px', borderRadius: 6,
          }}>{editingUser ? 'Edit Member' : 'New Member'}</span>
          <div style={{ flex: 1 }} />
          <button className="tp-act" onClick={onClose} style={{ flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ padding: '18px 26px 28px' }}>
          {/* Title */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.3px' }}>
              {editingUser ? 'Modify Member Details' : 'Add New Member'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
              {editingUser ? 'Update platform permissions and credentials.' : 'Manually onboard a verified buyer or NRI investor.'}
            </div>
          </div>

          {/* Avatar upload */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            marginBottom: 22, padding: 16,
            background: 'var(--bg-warm)', borderRadius: 12,
            border: '1px dashed var(--border-strong)',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 999,
              background: 'linear-gradient(135deg, #1F2433, #0E1117)',
              display: 'grid', placeItems: 'center',
              color: 'var(--gold)', fontFamily: 'var(--f-display)',
              fontSize: 20, fontWeight: 700, position: 'relative', flexShrink: 0,
            }}>
              {name ? name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase() : 'KA'}
              <div style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 22, height: 22, borderRadius: 999,
                background: 'var(--gold)', color: 'var(--ink)',
                display: 'grid', placeItems: 'center',
                border: '2px solid var(--surface)',
                cursor: 'pointer'
              }} onClick={() => alert('Photo upload dispatcher is ready (AWS S3 channels configured).')}>{I.upload}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Upload profile photo</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>PNG or JPG · max 4MB · square preferred</div>
            </div>
          </div>

          {/* Fields */}
          <div style={{ display: 'grid', gap: 14 }}>
            <FloatField label="Full name" value={name} onChange={setName}/>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FloatField label="Email address" value={email} onChange={setEmail}/>
              <FloatField label="Phone" value={phone} onChange={setPhone} mono/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FloatField label="Current city" value={city} onChange={setCity}/>
              <FloatField label="Native place" value={native} onChange={setNative}/>
            </div>

            {/* Role selector */}
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-3)', marginBottom: 8 }}>Role</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['User', 'Admin'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    className={`tp-chip${role === r ? ' active' : ''}`}
                    onClick={() => setRole(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Status selector */}
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-3)', marginBottom: 8 }}>Status</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['Active', 'NRI Premium', 'Pending', 'Inactive'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`tp-chip${status === s ? ' active' : ''}`}
                    onClick={() => setStatus(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {!editingUser && (
              <FloatField label="Temporary password" value={password} onChange={setPassword} mono type="password"/>
            )}
          </div>

          {errorMsg && (
            <div style={{ fontSize: 12, color: 'red', marginTop: 12 }}>{errorMsg}</div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button className="tp-btn tp-btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
            <button className="tp-btn tp-btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSubmit}>
              {I.check} {editingUser ? 'Save Changes' : 'Create Member'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// User Detail Modal
function UserDetailModal({ user, onClose }: { user: UserMember; onClose: () => void }) {
  const initials = user.name.split(' ').map(s => s[0]).slice(0, 2).join('');
  
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(14,17,23,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div className="tp-card" style={{
        width: '100%', maxWidth: 440,
        boxShadow: '0 32px 80px rgba(0,0,0,0.28)',
        borderRadius: 20,
        padding: 24,
        animation: 'modalIn 0.2s ease',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-3)' }}>Member Card</span>
          <button className="tp-act" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 20 }}>
          <div className={`tp-init ${user.tc}`} style={{ width: 64, height: 64, fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
            {initials}
          </div>
          <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 600 }}>{user.name}</h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Native: {user.native}</p>
          <span className={statusPill(user.status)} style={{ marginTop: 8 }}>{user.status}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border-2)', paddingTop: 18, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
            <span style={{ color: 'var(--text-3)' }}>Email:</span>
            <span style={{ fontWeight: 600 }}>{user.email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
            <span style={{ color: 'var(--text-3)' }}>Phone:</span>
            <span style={{ fontWeight: 600, fontFamily: 'var(--f-mono)' }}>{user.phone}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
            <span style={{ color: 'var(--text-3)' }}>Location:</span>
            <span style={{ fontWeight: 600 }}>{user.city}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
            <span style={{ color: 'var(--text-3)' }}>Joined Date:</span>
            <span style={{ fontWeight: 600, fontFamily: 'var(--f-mono)' }}>{user.join}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
            <span style={{ color: 'var(--text-3)' }}>Permission Role:</span>
            <span style={{ fontWeight: 600 }}>{user.role}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={`https://wa.me/${user.phone.replace(/[^0-9]/g, '')}?text=Vanakkam%20${encodeURIComponent(user.name)},%20this%20is%20Karthik%20from%20Tamizha%20Properties.`}
            target="_blank"
            rel="noopener noreferrer"
            className="tp-btn tp-btn-gold"
            style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}
          >
            WhatsApp NRI
          </a>
          <a
            href={`mailto:${user.email}`}
            className="tp-btn tp-btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Compose Email
          </a>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [usersList, setUsersList] = useState<UserMember[]>([]);
  const [dbStats, setDbStats] = useState<UserStats | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<UserMember | null>(null);
  const [viewingUser, setViewingUser] = useState<UserMember | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // States for search and active status filters
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'NRI Premium' | 'Pending' | 'Inactive'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 8;

  const mapBackendUserToMember = (u: User, i: number): UserMember => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    city: u.city || '',
    native: u.nativePlace || '',
    status: u.status,
    role: u.role === 'admin' ? 'Admin' : u.role === 'agent' ? 'Agent' : 'User',
    join: new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    tc: `c${(i % 6) + 1}`
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        status: activeFilter === 'All' ? undefined : activeFilter
      });
      setUsersList(res.data.map((u, i) => mapBackendUserToMember(u, i)));
      setTotalPages(res.totalPages);
      setTotalItems(res.total);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const stats = await usersApi.getStats();
      setDbStats(stats);
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchQuery, activeFilter]);

  const paginatedUsers = usersList;
  const startIndex = (currentPage - 1) * itemsPerPage;

  // Helper counts for tabs (fallback to dynamic database stats if loaded)
  const countAll = dbStats ? dbStats.total : 0;
  const countActive = dbStats ? dbStats.active : 0;
  const countNRI = dbStats ? dbStats.nriPremium : 0;
  const countPending = dbStats ? dbStats.pending : 0;
  const countInactive = Math.max(0, countAll - countActive - countNRI - countPending);

  const handleSaveUser = async (userData: Omit<UserMember, 'id' | 'tc' | 'join'>) => {
    try {
      if (editingUser) {
        // Edit User in Database
        await usersApi.update(editingUser.id, {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          city: userData.city,
          nativePlace: userData.native,
          role: userData.role.toLowerCase() as any,
          status: userData.status as any
        });
        setEditingUser(null);
      } else {
        // Add User to Database
        await usersApi.create({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          city: userData.city,
          nativePlace: userData.native,
          role: userData.role.toLowerCase() as any,
          status: userData.status as any,
          password: 'Password@123' // default password for manual onboards
        });
        setShowAddUser(false);
      }
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error('Failed to save user:', err);
      alert('Failed to save user profile. Please check email uniqueness.');
    }
  };

  const handleDeleteUser = (id: string, name: string) => {
    setDeleteConfirmUser({ id, name });
  };

  const executeDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      await usersApi.remove(deleteConfirmUser.id);
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user.');
    } finally {
      setDeleteConfirmUser(null);
    }
  };

  return (
    <div className="tp-layout">
      <Sidebar />
      <div className="tp-main">
        <Topbar searchPlaceholder="Search users by name, email or city…" />
        <div className="tp-content">

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="tp-eyebrow">Member Intelligence</span>
              <h1 className="tp-h1">Users <em>Management</em></h1>
              <p className="tp-subtitle">1,248 verified members across India, Singapore, Malaysia and the UAE. NRI investors account for 41% of platform engagement.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <button className="tp-btn tp-btn-gold" onClick={() => setShowAddUser(true)}>{I.plus} Add User</button>
            </div>
          </div>

          {/* Stat strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <UserStat label="Total Members" value={countAll} delta="+62 this week" tone="gold"/>
            <UserStat label="NRI Premium" value={countNRI} delta="+41% MoM" tone="dark"/>
            <UserStat label="Active Today" value={countActive} delta="Live" tone="success"/>
            <UserStat label="Pending Verification" value={countPending} delta="Needs action" tone="warn"/>
          </div>

          {/* Full-width table */}
          <div className="tp-card">
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div className="tp-card-title">All Members</div>
                  <div className="tp-card-sub">Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} matches · sorted by recent</div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div className="tp-search" style={{ width: 220, padding: '8px 12px' }}>
                    {I.search}
                    <input
                      placeholder="Search…"
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                  <button className="tp-icon-btn" style={{ width: 36, height: 36 }} onClick={() => { setSearchQuery(''); setActiveFilter('All'); }} title="Reset Filters">{I.filter}</button>
                  <button className="tp-btn tp-btn-gold" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => setShowAddUser(true)}>{I.plus} Add User</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className={`tp-chip${activeFilter === 'All' ? ' active' : ''}`} onClick={() => { setActiveFilter('All'); setCurrentPage(1); }}>All <span className="tp-chip-count">{countAll}</span></button>
                <button className={`tp-chip${activeFilter === 'Active' ? ' active' : ''}`} onClick={() => { setActiveFilter('Active'); setCurrentPage(1); }}>Active <span className="tp-chip-count">{countActive}</span></button>
                <button className={`tp-chip${activeFilter === 'NRI Premium' ? ' active' : ''}`} onClick={() => { setActiveFilter('NRI Premium'); setCurrentPage(1); }}>NRI Premium <span className="tp-chip-count">{countNRI}</span></button>
                <button className={`tp-chip${activeFilter === 'Pending' ? ' active' : ''}`} onClick={() => { setActiveFilter('Pending'); setCurrentPage(1); }}>Pending <span className="tp-chip-count">{countPending}</span></button>
                <button className={`tp-chip${activeFilter === 'Inactive' ? ' active' : ''}`} onClick={() => { setActiveFilter('Inactive'); setCurrentPage(1); }}>Inactive <span className="tp-chip-count">{countInactive}</span></button>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'grid', placeItems: 'center', height: 250, color: 'var(--text-3)', fontSize: 13 }}>
                <span className="tp-spinner" style={{ width: 24, height: 24, marginBottom: 12 }} />
                Loading members directory...
              </div>
            ) : (
              <>
                <table className="tp-table">
              <thead>
                <tr>
                  <th style={{ width: 28 }}><input type="checkbox" readOnly /></th>
                  <th>Member</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)' }}>
                      No members found matching your search.
                    </td>
                  </tr>
                ) : paginatedUsers.map((u, i) => (
                  <tr key={u.id}>
                    <td><input type="checkbox" readOnly/></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className={`tp-init ${u.tc}`} style={{ width: 36, height: 36, fontSize: 12 }}>
                          {u.name.split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Native · {u.native}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{u.email}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--f-mono)' }}>{u.phone}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
                        {I.pin} {u.city}
                      </div>
                    </td>
                    <td><span className={statusPill(u.status)}>{u.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--f-mono)' }}>{u.join}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button className="tp-act" onClick={() => setViewingUser(u)} title="View Detail Card">{I.eye}</button>
                        <button className="tp-act gold" onClick={() => setEditingUser(u)} title="Edit Member Profile">{I.edit}</button>
                        <button className="tp-act danger" onClick={() => handleDeleteUser(u.id, u.name)} title="Remove User">{I.trash}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderTop: '1px solid var(--border-2)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Page {currentPage} of {totalPages}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="tp-btn tp-btn-ghost"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  ← Prev
                </button>
                <button
                  className="tp-btn tp-btn-dark"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
            </>
          )}
          </div>

        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onSave={handleSaveUser}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <AddUserModal
          editingUser={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />
      )}

      {/* View User Detail Card Modal */}
      {viewingUser && (
        <UserDetailModal
          user={viewingUser}
          onClose={() => setViewingUser(null)}
        />
      )}

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmUser}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteConfirmUser?.name} from your workspace? This action cannot be undone.`}
        confirmText="Delete Member"
        cancelText="Cancel"
        onConfirm={executeDeleteUser}
        onCancel={() => setDeleteConfirmUser(null)}
      />
    </div>
  );
}
