import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'https://swipeshare-production.up.railway.app';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Automatically refresh expired access tokens using the refresh token
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/api/auth/login/')) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/auth/refresh/`, { refresh });
          const newAccess = res.data.access;
          localStorage.setItem('access_token', newAccess);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
          original.headers['Authorization'] = `Bearer ${newAccess}`;
          return apiClient(original);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth Context ────────────────────────────────────────────────────────────

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  campus: string;
  reliability_score: number;
  swipes_donated: number;
  swipes_received: number;
  is_staff?: boolean;
  bio?: string;
  phone_number?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const res = await apiClient.get('/api/auth/me/');
      setUser(res.data);
    } catch {
      setToken(null);
      localStorage.removeItem('access_token');
    }
  };

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/api/auth/login/', { email, password });
    const { tokens, user: userData } = res.data;
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    setToken(tokens.access);
    setUser(userData);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
  };

  const register = async (data: any) => {
    const res = await apiClient.post('/api/auth/register/', data);
    if (res.data.tokens) {
      const { tokens, user: userData } = res.data;
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      setToken(tokens.access);
      setUser(userData);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Shared UI ───────────────────────────────────────────────────────────────

const Button: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'danger' | 'small';
  disabled?: boolean;
}> = ({ onClick, children, variant = 'primary', disabled = false }) => (
  <button className={`button button-${variant}`} onClick={onClick} disabled={disabled}>
    {children}
  </button>
);

const Input: React.FC<{
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  label?: string;
}> = ({ type = 'text', placeholder, value, onChange, label }) => (
  <div className="input-container">
    {label && <label className="input-label">{label}</label>}
    <input
      type={type}
      className="input"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({
  children, className = '', onClick,
}) => (
  <div className={`card ${className} ${onClick ? 'card-clickable' : ''}`} onClick={onClick}>
    {children}
  </div>
);

const Badge: React.FC<{ text: string; color?: string }> = ({ text, color = '#800000' }) => (
  <span className="badge" style={{ backgroundColor: color }}>{text}</span>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title, onClose, children,
}) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2 className="modal-title">{title}</h2>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

// ─── Message User Modal ──────────────────────────────────────────────────────

const MessageUserModal: React.FC<{
  targetUser: { id: number; full_name: string };
  source?: string;
  listingId?: number;
  onClose: () => void;
}> = ({ targetUser, source, listingId, onClose }) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!text.trim() || sending) return;
    try {
      setSending(true);
      const body: any = { text: text.trim() };
      if (listingId) body.listing = listingId;
      else body.receiver = targetUser.id;
      if (source) body.source = source;
      await apiClient.post('/api/messaging/conversations/', body);
      setSent(true);
    } catch {} finally { setSending(false); }
  };

  return (
    <Modal title={`Message ${targetUser.full_name}`} onClose={onClose}>
      {sent ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
          <p style={{ color: '#2e7d32', fontWeight: 600 }}>Message sent! Check your Messages tab.</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      ) : (
        <>
          {source && <p style={{ fontSize: 13, color: '#777', marginBottom: 8 }}>From: {source}</p>}
          <textarea
            className="input"
            placeholder={`Say hi to ${targetUser.full_name}...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            style={{ resize: 'vertical', width: '100%' }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <Button onClick={send} disabled={sending || !text.trim()}>
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </>
      )}
    </Modal>
  );
};

// ─── Report Modal ─────────────────────────────────────────────────────────────

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'scam', label: 'Scam or Fraud' },
  { value: 'other', label: 'Other' },
];

const ReportModal: React.FC<{
  contentType: 'post' | 'comment' | 'user' | 'swipe_listing';
  contentId: number;
  onClose: () => void;
}> = ({ contentType, contentId, onClose }) => {
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    try {
      setLoading(true); setError('');
      await apiClient.post('/api/moderation/reports/', { content_type: contentType, content_id: contentId, reason, description });
      setDone(true);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit report');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Report Content" onClose={onClose}>
      {done ? (
        <div className="success-message">Report submitted. Our team will review it shortly.</div>
      ) : (
        <>
          <div className="input-container">
            <label className="input-label">Reason</label>
            <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
              {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="input-container">
            <label className="input-label">Additional details (optional)</label>
            <textarea className="input textarea" placeholder="Describe the issue..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          {error && <div className="error-message">{error}</div>}
          <Button onClick={handle} disabled={loading} variant="danger">{loading ? 'Submitting...' : 'Submit Report'}</Button>
          <Button onClick={onClose} variant="outline">Cancel</Button>
        </>
      )}
    </Modal>
  );
};

// ─── Auth Screens ─────────────────────────────────────────────────────────────

const LoginScreen: React.FC<{ onSwitch: () => void }> = ({ onSwitch }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    try {
      setLoading(true); setError('');
      await login(email.toLowerCase(), password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="screen">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Fordham SwipeShare</h1>
          <p className="auth-subtitle">Share meal swipes with fellow Rams</p>
        </div>
        <div className="auth-form">
          <Input type="email" label="Email" placeholder="your.name@fordham.edu" value={email} onChange={setEmail} />
          <Input type="password" label="Password" placeholder="Enter your password" value={password} onChange={setPassword} />
          {error && <div className="error-message">{error}</div>}
          <Button onClick={handle} disabled={loading}>{loading ? 'Logging in...' : 'Login'}</Button>
          <Button onClick={onSwitch} variant="outline">Create Account</Button>
        </div>
      </div>
    </div>
  );
};

const RegisterScreen: React.FC<{ onSwitch: () => void }> = ({ onSwitch }) => {
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: '', username: '', password: '', password_confirm: '',
    full_name: '', campus: 'RH', phone_number: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const handle = async () => {
    if (!form.email || !form.username || !form.password || !form.full_name) {
      setError('Please fill in all required fields'); return;
    }
    if (!form.email.endsWith('@fordham.edu')) { setError('Email must be @fordham.edu'); return; }
    if (form.password !== form.password_confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    try {
      setLoading(true); setError('');
      const res = await register(form);
      if (!res.tokens) { setSuccess(res.message); setTimeout(onSwitch, 2000); }
    } catch (err: any) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).flat().join(', ') : 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="screen">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the SwipeShare community</p>
        </div>
        <div className="auth-form">
          <Input type="email" label="Email *" placeholder="your.name@fordham.edu" value={form.email} onChange={(v) => set('email', v)} />
          <Input label="Username *" placeholder="Choose a username" value={form.username} onChange={(v) => set('username', v)} />
          <Input label="Full Name *" placeholder="Enter your full name" value={form.full_name} onChange={(v) => set('full_name', v)} />
          <div className="input-container">
            <label className="input-label">Campus *</label>
            <select className="input" value={form.campus} onChange={(e) => set('campus', e.target.value)}>
              <option value="RH">Rose Hill</option>
              <option value="LC">Lincoln Center</option>
            </select>
          </div>
          <Input label="Phone (Optional)" placeholder="+1234567890" value={form.phone_number} onChange={(v) => set('phone_number', v)} />
          <Input type="password" label="Password *" placeholder="At least 8 characters" value={form.password} onChange={(v) => set('password', v)} />
          <Input type="password" label="Confirm Password *" placeholder="Re-enter password" value={form.password_confirm} onChange={(v) => set('password_confirm', v)} />
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <Button onClick={handle} disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</Button>
          <Button onClick={onSwitch} variant="outline">Already have an account? Login</Button>
        </div>
      </div>
    </div>
  );
};

// ─── Swipes Screen ────────────────────────────────────────────────────────────

interface SwipeListing {
  id: number;
  user: User;
  type: 'donation' | 'request';
  campus: string;
  quantity: number;
  available_date: string;
  available_time: string;
  meeting_location: string;
  notes: string;
  status: string;
  created_at: string;
}

const SwipesScreen: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<SwipeListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'donation' | 'request'>('all');
  const [campusFilter, setCampusFilter] = useState<'all' | 'RH' | 'LC'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<SwipeListing | null>(null);
  const [error, setError] = useState('');
  const [msgTarget, setMsgTarget] = useState<{ user: { id: number; full_name: string }; listingId: number } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const params: any = { active: 'true' };
      if (filter !== 'all') params.type = filter;
      if (campusFilter !== 'all') params.campus = campusFilter;
      const res = await apiClient.get('/api/swipes/listings/', { params });
      setListings(res.data.results ?? res.data);
    } catch { setError('Failed to load listings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter, campusFilter]);

  const campusLabel = (c: string) => c === 'RH' ? 'Rose Hill' : 'Lincoln Center';

  return (
    <div className="tab-content">
      <div className="filter-bar">
        <div className="filter-group">
          {(['all', 'donation', 'request'] as const).map((t) => (
            <button key={t} className={`filter-btn ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
              {t === 'all' ? 'All' : t === 'donation' ? 'Donations' : 'Requests'}
            </button>
          ))}
        </div>
        <div className="filter-group">
          {(['all', 'RH', 'LC'] as const).map((c) => (
            <button key={c} className={`filter-btn ${campusFilter === c ? 'active' : ''}`} onClick={() => setCampusFilter(c)}>
              {c === 'all' ? 'All' : campusLabel(c)}
            </button>
          ))}
        </div>
      </div>

      <div className="content">
        <Button onClick={() => setShowCreate(true)}>+ Post a Listing</Button>

        {error && <div className="error-message">{error}</div>}
        {loading ? <div className="loading">Loading...</div> : listings.length === 0 ? (
          <div className="empty-state">No listings found. Be the first to post!</div>
        ) : (
          listings.map((l) => (
            <Card key={l.id} onClick={() => setSelected(l)}>
              <div className="listing-row">
                <div>
                  <Badge text={l.type === 'donation' ? 'Donation' : 'Request'} color={l.type === 'donation' ? '#2e7d32' : '#1565c0'} />
                  <Badge text={campusLabel(l.campus)} color="#555" />
                </div>
                <span className="listing-qty">x{l.quantity}</span>
              </div>
              <div className="listing-info">
                <strong
                  style={{ cursor: 'pointer', color: '#800000', textDecoration: 'underline' }}
                  onClick={(e) => { e.stopPropagation(); if (l.user.id !== user?.id) setMsgTarget({ user: l.user, listingId: l.id }); }}
                >{l.user.full_name}</strong>
              </div>
              <div className="listing-date">{l.available_date}{l.available_time ? ` · ~${l.available_time}` : ''}</div>
              {l.notes && <div className="listing-notes">{l.notes}</div>}
            </Card>
          ))
        )}
      </div>

      {showCreate && (
        <CreateListingModal onClose={() => { setShowCreate(false); load(); }} />
      )}
      {selected && (
        <ListingDetailModal listing={selected} currentUser={user!} onClose={() => { setSelected(null); load(); }} />
      )}
      {msgTarget && (
        <MessageUserModal
          targetUser={msgTarget.user}
          listingId={msgTarget.listingId}
          source={`Swipe Listing #${msgTarget.listingId}`}
          onClose={() => setMsgTarget(null)}
        />
      )}
    </div>
  );
};

const CreateListingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [form, setForm] = useState({
    type: 'donation', campus: 'RH', quantity: '1',
    available_date: '', available_time: '', meeting_location: '', notes: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const handle = async () => {
    if (!form.available_date) { setError('Available date is required'); return; }
    try {
      setLoading(true); setError('');
      await apiClient.post('/api/swipes/listings/', { ...form, quantity: parseInt(form.quantity) });
      onClose();
    } catch (err: any) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).flat().join(', ') : 'Failed to create listing');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Post a Listing" onClose={onClose}>
      <div className="input-container">
        <label className="input-label">Type</label>
        <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
          <option value="donation">Donation (I have swipes to give)</option>
          <option value="request">Request (I need a swipe)</option>
        </select>
      </div>
      <div className="input-container">
        <label className="input-label">Campus</label>
        <select className="input" value={form.campus} onChange={(e) => set('campus', e.target.value)}>
          <option value="RH">Rose Hill</option>
          <option value="LC">Lincoln Center</option>
        </select>
      </div>
      <Input label="Quantity" type="number" placeholder="1" value={form.quantity} onChange={(v) => set('quantity', v)} />
      <Input label="Available Date *" type="date" placeholder="" value={form.available_date} onChange={(v) => set('available_date', v)} />
      <Input label="Around Time" type="time" placeholder="" value={form.available_time} onChange={(v) => set('available_time', v)} />
      <Input label="Meeting Location" placeholder="e.g. Library entrance" value={form.meeting_location} onChange={(v) => set('meeting_location', v)} />
      <div className="input-container">
        <label className="input-label">Notes</label>
        <textarea className="input textarea" placeholder="Any additional info..." value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} />
      </div>
      {error && <div className="error-message">{error}</div>}
      <Button onClick={handle} disabled={loading}>{loading ? 'Posting...' : 'Post Listing'}</Button>
    </Modal>
  );
};

const ListingInbox: React.FC<{ listingId: number; currentUser: User }> = ({ listingId }) => {
  const [convs, setConvs] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    apiClient.get('/api/messaging/conversations/').then((res) => {
      const all = res.data.results ?? res.data;
      setConvs(all.filter((c: any) => c.listing === listingId));
    }).catch(() => {});
  }, [listingId]);

  const openConv = async (conv: any) => {
    setActiveConv(conv);
    const res = await apiClient.get(`/api/messaging/conversations/${conv.id}/messages/`);
    setMessages(res.data);
  };

  const reply = async () => {
    if (!text.trim() || !activeConv) return;
    try {
      const res = await apiClient.post(`/api/messaging/conversations/${activeConv.id}/reply/`, { text });
      setMessages((prev) => [...prev, res.data]);
      setText('');
    } catch {}
  };

  if (convs.length === 0) return null;

  return (
    <div style={{ marginTop: 16, border: '1px solid #ddd', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', background: '#800000', color: '#fff', fontWeight: 600, fontSize: 14 }}>
        Messages ({convs.length})
      </div>
      {!activeConv ? (
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {convs.map((c) => (
            <div key={c.id} onClick={() => openConv(c)} style={{
              padding: '10px 14px', borderBottom: '1px solid #eee', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.sender_name}</div>
                <div style={{ fontSize: 12, color: '#777' }}>{c.last_message?.text || 'No messages'}</div>
              </div>
              {c.unread_count > 0 && (
                <span style={{
                  background: '#800000', color: '#fff', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                }}>{c.unread_count}</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div onClick={() => setActiveConv(null)} style={{ padding: '8px 14px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: 13, color: '#800000', fontWeight: 600 }}>
            ← Back · {activeConv.sender_name}
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto', padding: 10, background: '#fafafa' }}>
            {messages.map((m: any) => (
              <div key={m.id} style={{ marginBottom: 8, textAlign: m.is_mine ? 'right' : 'left' }}>
                <div style={{
                  display: 'inline-block', padding: '8px 12px', borderRadius: 12, maxWidth: '75%', fontSize: 14,
                  background: m.is_mine ? '#800000' : '#e8e8e8', color: m.is_mine ? '#fff' : '#333',
                }}>{m.text}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                  {m.author_name} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid #eee' }}>
            <input className="input" style={{ flex: 1, margin: 0 }} placeholder="Reply..." value={text}
              onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && reply()} />
            <button onClick={reply} style={{ padding: '6px 14px', background: '#800000', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

const ListingDetailModal: React.FC<{ listing: SwipeListing; currentUser: User; onClose: () => void }> = ({ listing, currentUser, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState('');
  const [convId, setConvId] = useState<number | null>(null);
  const [editingQty, setEditingQty] = useState(false);
  const [qty, setQty] = useState(listing.quantity);
  const isOwner = currentUser != null && String(listing.user.id) === String(currentUser.id);
  const campusLabel = (c: string) => c === 'RH' ? 'Rose Hill' : 'Lincoln Center';

  const saveQty = async () => {
    try {
      await apiClient.patch(`/api/swipes/listings/${listing.id}/`, { quantity: qty });
      listing.quantity = qty;
      setEditingQty(false);
      setMsg('Quantity updated!');
    } catch { setMsg('Failed to update quantity'); }
  };

  useEffect(() => {
    if (!isOwner && listing.type === 'donation') {
      apiClient.get('/api/swipes/listings/', { params: { type: 'request', active: 'true' } })
        .then((res) => {
          const all = res.data.results ?? res.data;
          setMyRequests(all.filter((l: any) => l.user.id === currentUser.id));
        }).catch(() => {});
    }
  }, []);

  const openChat = async () => {
    setShowChat(true);
    // Check if conversation already exists
    try {
      const res = await apiClient.get('/api/messaging/conversations/');
      const convs = res.data.results ?? res.data;
      const existing = convs.find((c: any) => c.listing === listing.id && c.sender === currentUser.id);
      if (existing) {
        setConvId(existing.id);
        const msgRes = await apiClient.get(`/api/messaging/conversations/${existing.id}/messages/`);
        setChatMessages(msgRes.data);
      }
    } catch {}
  };

  const sendMessage = async () => {
    if (!chatText.trim()) return;
    try {
      if (convId) {
        const res = await apiClient.post(`/api/messaging/conversations/${convId}/reply/`, { text: chatText });
        setChatMessages((prev) => [...prev, res.data]);
      } else {
        const res = await apiClient.post('/api/messaging/conversations/', { listing: listing.id, text: chatText });
        setConvId(res.data.id);
        const msgRes = await apiClient.get(`/api/messaging/conversations/${res.data.id}/messages/`);
        setChatMessages(msgRes.data);
      }
      setChatText('');
    } catch { setMsg('Failed to send message'); }
  };

  const handleMatch = async (requestId: number) => {
    try {
      setLoading(true); setMsg('');
      await apiClient.post(`/api/swipes/listings/${listing.id}/match/`, { request_listing_id: requestId });
      setMsg('Match created! Check your matches.');
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Failed to create match');
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing? This will count as a completed share.')) return;
    try {
      await apiClient.delete(`/api/swipes/listings/${listing.id}/`);
      onClose();
    } catch { setMsg('Failed to cancel listing'); }
  };

  return (
    <Modal title="Listing Details" onClose={onClose}>
      <div className="detail-row">
        <Badge text={listing.type === 'donation' ? 'Donation' : 'Request'} color={listing.type === 'donation' ? '#2e7d32' : '#1565c0'} />
        <Badge text={campusLabel(listing.campus)} color="#555" />
        {isOwner && editingQty ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <input type="number" min="0" value={qty} onChange={(e) => setQty(Number(e.target.value))}
              style={{ width: 50, padding: '2px 6px', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }} />
            <button onClick={saveQty} style={{ padding: '2px 8px', background: '#800000', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Save</button>
            <button onClick={() => { setEditingQty(false); setQty(listing.quantity); }} style={{ padding: '2px 8px', background: '#eee', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          </span>
        ) : (
          <Badge text={`x${listing.quantity}`} color="#800000" />
        )}
        {isOwner && !editingQty && (
          <span onClick={() => setEditingQty(true)} style={{ cursor: 'pointer', fontSize: 12, color: '#800000', textDecoration: 'underline' }}>Edit</span>
        )}
      </div>
      <div className="detail-section">
        <p><strong>Posted by:</strong> <span
          style={{ cursor: !isOwner ? 'pointer' : 'default', color: !isOwner ? '#800000' : 'inherit', textDecoration: !isOwner ? 'underline' : 'none' }}
          onClick={() => { if (!isOwner) setShowChat(true); openChat(); }}
        >{listing.user.full_name}</span></p>
        <p><strong>Date:</strong> {listing.available_date}{listing.available_time ? ` · ~${listing.available_time}` : ''}</p>
        {listing.meeting_location && <p><strong>Meeting Location:</strong> {listing.meeting_location}</p>}
        {listing.notes && <p><strong>Notes:</strong> {listing.notes}</p>}
      </div>
      {msg && <div className={msg.includes('Match') ? 'success-message' : 'error-message'}>{msg}</div>}
      {isOwner && <ListingInbox listingId={listing.id} currentUser={currentUser} />}
      {(isOwner || currentUser.is_staff) && (
        <Button onClick={handleDelete} variant="danger">Delete Listing</Button>
      )}
      {!isOwner && (
        <>
          {listing.type === 'donation' && (
            myRequests.length === 0 ? (
              <div className="info-message">Post a request listing first to match with this donation.</div>
            ) : (
              <>
                <p className="input-label">Match with your request:</p>
                {myRequests.map((r) => (
                  <Button key={r.id} onClick={() => handleMatch(r.id)} disabled={loading}>
                    {loading ? 'Matching...' : `Match (${r.available_date})`}
                  </Button>
                ))}
              </>
            )
          )}
          <Button onClick={openChat}>Message Poster</Button>
          <Button onClick={() => setShowReport(true)} variant="danger">Report Listing</Button>
        </>
      )}
      {showChat && (
        <div style={{ marginTop: 16, border: '1px solid #ddd', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: '#800000', color: '#fff', fontWeight: 600, fontSize: 14 }}>
            Chat with {listing.user.full_name}
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto', padding: 10, background: '#fafafa' }}>
            {chatMessages.length === 0 ? (
              <div style={{ color: '#999', textAlign: 'center', padding: 16, fontSize: 13 }}>No messages yet — say hi!</div>
            ) : chatMessages.map((m: any) => (
              <div key={m.id} style={{ marginBottom: 8, textAlign: m.is_mine ? 'right' : 'left' }}>
                <div style={{
                  display: 'inline-block', padding: '8px 12px', borderRadius: 12, maxWidth: '75%', fontSize: 14,
                  background: m.is_mine ? '#800000' : '#e8e8e8', color: m.is_mine ? '#fff' : '#333',
                }}>
                  {m.text}
                </div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                  {m.author_name} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid #eee' }}>
            <input
              className="input"
              style={{ flex: 1, margin: 0 }}
              placeholder="Type a message..."
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage} style={{ padding: '6px 14px', background: '#800000', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Send</button>
          </div>
        </div>
      )}
      {showReport && <ReportModal contentType="swipe_listing" contentId={listing.id} onClose={() => setShowReport(false)} />}
    </Modal>
  );
};

// ─── Forum Screen ─────────────────────────────────────────────────────────────

interface Post {
  id: number;
  user: User;
  category: string;
  title: string;
  content: string;
  images: string[];
  tags: string[];
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_has_liked?: boolean;
  can_edit?: boolean;
}

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'housing', label: 'Housing' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'rideshare', label: 'Rides' },
  { value: 'events', label: 'Events' },
  { value: 'general', label: 'General' },
];

type SortMode = 'new' | 'hot' | 'best' | 'rising';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'hot', label: 'Hot' },
  { value: 'best', label: 'Best' },
  { value: 'rising', label: 'Rising' },
];

const ForumScreen: React.FC<{ openPostId?: number; onDeepLinkHandled?: () => void }> = ({ openPostId, onDeepLinkHandled }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SortMode>('hot');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Post | null>(null);
  const [error, setError] = useState('');
  const [msgTarget, setMsgTarget] = useState<{ id: number; full_name: string } | null>(null);

  const sortPosts = (raw: Post[], mode: SortMode): Post[] => {
    const now = Date.now();
    const sorted = [...raw];
    switch (mode) {
      case 'new':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'best':
        return sorted.sort((a, b) => b.likes_count - a.likes_count);
      case 'hot': {
        // Engagement (likes + comments) weighted by recency
        const score = (p: Post) => {
          const ageHours = Math.max(1, (now - new Date(p.created_at).getTime()) / 3600000);
          return (p.likes_count + p.comments_count * 2) / Math.pow(ageHours, 0.8);
        };
        return sorted.sort((a, b) => score(b) - score(a));
      }
      case 'rising': {
        // Recent posts (< 24h) with any engagement, sorted by engagement
        const dayAgo = now - 86400000;
        const recent = sorted.filter((p) => new Date(p.created_at).getTime() > dayAgo && (p.likes_count + p.comments_count) > 0);
        const older = sorted.filter((p) => new Date(p.created_at).getTime() <= dayAgo || (p.likes_count + p.comments_count) === 0);
        recent.sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count));
        older.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return [...recent, ...older];
      }
      default:
        return sorted;
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (category !== 'all') params.category = category;
      if (search.trim()) params.search = search.trim();
      const res = await apiClient.get('/api/forum/posts/', { params });
      const raw = res.data.results ?? res.data;
      setPosts(sortPosts(raw, sort));
    } catch { setError('Failed to load posts'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [category, sort, search]);

  // Auto-open post from deep link
  useEffect(() => {
    if (openPostId && posts.length > 0 && !selected) {
      const target = posts.find((p) => p.id === openPostId);
      if (target) {
        setSelected(target);
        onDeepLinkHandled?.();
      }
    }
  }, [openPostId, posts]);

  const handleLike = async (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await apiClient.post(`/api/forum/posts/${post.id}/like/`);
      setPosts(posts.map((p) => p.id === post.id ? { ...p, likes_count: res.data.likes_count, user_has_liked: res.data.liked } : p));
    } catch {}
  };

  const catLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label ?? v;

  return (
    <div className="tab-content">
      <div className="filter-bar-inline">
        <select className="filter-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select className="filter-select" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <div className="search-mini">
          <input
            className="search-mini-input"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button className="search-mini-clear" onClick={() => setSearch('')}>x</button>}
        </div>
      </div>
      <div className="content">
        <Button onClick={() => setShowCreate(true)}>+ New Post</Button>
        {error && <div className="error-message">{error}</div>}
        {loading ? <div className="loading">Loading...</div> : posts.length === 0 ? (
          <div className="empty-state">No posts yet. Start the conversation!</div>
        ) : (
          posts.map((p) => (
            <Card key={p.id} onClick={() => setSelected(p)}>
              <div className="post-header">
                <Badge text={catLabel(p.category)} color="#555" />
                <span className="post-time">{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="post-title">{p.title}</h3>
              {p.tags && p.tags.length > 0 && (
                <div className="tag-list" onClick={(e) => e.stopPropagation()}>
                  {p.tags.map((t) => (
                    <span key={t} className="tag clickable" onClick={() => setSearch(t)}>#{t}</span>
                  ))}
                </div>
              )}
              <p className="post-preview">{p.content.slice(0, 120)}{p.content.length > 120 ? '...' : ''}</p>
              <div className="post-footer">
                <span className="post-author">by <span
                  style={{ cursor: p.user.id !== user?.id ? 'pointer' : 'default', color: p.user.id !== user?.id ? '#800000' : 'inherit', textDecoration: p.user.id !== user?.id ? 'underline' : 'none' }}
                  onClick={(e) => { e.stopPropagation(); if (p.user.id !== user?.id) setMsgTarget(p.user); }}
                >{p.user.full_name}</span></span>
                <div className="post-actions">
                  <button className={`action-btn ${p.user_has_liked ? 'liked' : ''}`} onClick={(e) => handleLike(p, e)}>
                    ♥ {p.likes_count}
                  </button>
                  <span className="action-btn">💬 {p.comments_count}</span>
                  {p.can_edit && <span className="action-btn views">👁 {p.views_count || 0}</span>}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
      {showCreate && <CreatePostModal onClose={() => { setShowCreate(false); load(); }} />}
      {selected && <PostDetailModal post={selected} onClose={() => { setSelected(null); load(); }} />}
      {msgTarget && (
        <MessageUserModal
          targetUser={msgTarget}
          source={`Forum post`}
          onClose={() => setMsgTarget(null)}
        />
      )}
    </div>
  );
};

const useImageUpload = () => {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (images.length >= 5) break;
      const fd = new FormData();
      fd.append('image', file);
      try {
        const res = await apiClient.post('/api/upload/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setImages((prev) => [...prev, res.data.url]);
      } catch {}
    }
    setUploading(false);
  };

  const remove = (url: string) => setImages((prev) => prev.filter((u) => u !== url));

  return { images, uploading, upload, remove, setImages };
};

const ImagePicker: React.FC<{
  images: string[];
  uploading: boolean;
  onUpload: (files: FileList | null) => void;
  onRemove: (url: string) => void;
}> = ({ images, uploading, onUpload, onRemove }) => (
  <div className="input-container">
    <label className="input-label">Images (max 5)</label>
    <label className="image-upload-btn">
      {uploading ? 'Uploading...' : '+ Add Image'}
      <input type="file" accept="image/*" multiple hidden onChange={(e) => onUpload(e.target.files)} />
    </label>
    {images.length > 0 && (
      <div className="image-preview-row">
        {images.map((url) => (
          <div key={url} className="image-preview-wrap">
            <img src={url} className="image-preview" alt="" />
            <button className="image-remove" onClick={() => onRemove(url)}>✕</button>
          </div>
        ))}
      </div>
    )}
  </div>
);

const CreatePostModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [form, setForm] = useState({ category: 'general', title: '', content: '' });
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { images, uploading, upload, remove } = useImageUpload();
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const handle = async () => {
    if (!form.title || !form.content) { setError('Title and content are required'); return; }
    try {
      setLoading(true); setError('');
      await apiClient.post('/api/forum/posts/', { ...form, images, tags });
      onClose();
    } catch (err: any) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).flat().join(', ') : 'Failed to create post');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="New Post" onClose={onClose}>
      <div className="input-container">
        <label className="input-label">Category</label>
        <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
          {CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      <Input label="Title *" placeholder="Post title" value={form.title} onChange={(v) => set('title', v)} />
      <div className="input-container">
        <label className="input-label">Content *</label>
        <textarea className="input textarea" placeholder="What's on your mind?" value={form.content} onChange={(e) => set('content', e.target.value)} rows={5} />
      </div>
      <ImagePicker images={images} uploading={uploading} onUpload={upload} onRemove={remove} />
      <div className="input-container">
        <label className="input-label">Tags (max 5)</label>
        <div className="tag-input-row">
          <input
            className="input tag-input"
            placeholder="Add a tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          />
          <button className="tag-add-btn" type="button" onClick={addTag}>Add</button>
        </div>
        {tags.length > 0 && (
          <div className="tag-list">
            {tags.map((t) => (
              <span key={t} className="tag">
                #{t}
                <button className="tag-remove" onClick={() => setTags(tags.filter((x) => x !== t))}>x</button>
              </span>
            ))}
          </div>
        )}
      </div>
      {error && <div className="error-message">{error}</div>}
      <Button onClick={handle} disabled={loading || uploading}>{loading ? 'Posting...' : 'Post'}</Button>
    </Modal>
  );
};

interface Comment {
  id: number;
  user: User;
  content: string;
  image?: string;
  parent?: number | null;
  likes_count: number;
  created_at: string;
  replies?: Comment[];
}

const CommentItem: React.FC<{
  comment: Comment;
  allComments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  postId: number;
  depth?: number;
  replyToName?: string;
  onMessageUser?: (u: { id: number; full_name: string }) => void;
}> = ({ comment: c, allComments, setComments, postId, depth = 0, replyToName, onMessageUser }) => {
  const { user } = useAuth();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState<string | null>(null);
  const replyImageRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [repliesVisible, setRepliesVisible] = useState(false);

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/api/forum/comments/${c.id}/`);
      // Remove from top-level or from parent's replies
      setComments((prev) => removeComment(prev, c.id));
    } catch {}
  };

  const handleLike = async () => {
    try {
      const res = await apiClient.post(`/api/forum/comments/${c.id}/like/`);
      setComments((prev) => updateCommentLike(prev, c.id, res.data.likes_count));
    } catch {}
  };

  const handleReply = async () => {
    const img = replyImageRef.current;
    if (!replyText.trim() && !img) return;
    const raw = replyText.trim() || '(image)';
    // Prefix with @[name] when replying to a nested reply (so readers know who it's directed at)
    const content = depth > 0 ? `@[${c.user.full_name}] ${raw}` : raw;
    try {
      setLoading(true);
      const body: any = { post: postId, content, parent: c.parent ?? c.id };
      if (img) body.image = img;
      const res = await apiClient.post('/api/forum/comments/', body);
      const parentId = c.parent ?? c.id;
      setComments((prev) => addReply(prev, parentId, res.data));
      setReplyText('');
      setReplyImage(null);
      replyImageRef.current = null;
      setReplyOpen(false);
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className={`comment ${depth > 0 ? 'comment-reply' : ''}`}>
      <div className="comment-header">
        <strong
          style={{ cursor: onMessageUser && c.user.id !== user?.id ? 'pointer' : 'default', color: onMessageUser && c.user.id !== user?.id ? '#800000' : 'inherit', textDecoration: onMessageUser && c.user.id !== user?.id ? 'underline' : 'none' }}
          onClick={() => { if (onMessageUser && c.user.id !== user?.id) onMessageUser(c.user); }}
        >{c.user.full_name}</strong>
        {(() => {
          // Extract @[name] mention from content, or fall back to replyToName
          const mention = c.content?.match(/^@\[(.+?)\]\s?/)?.[1] || replyToName;
          return mention ? <span className="reply-to-label">replied to {mention}</span> : null;
        })()}
        <span className="comment-time">{new Date(c.created_at).toLocaleDateString()}</span>
        {(c.user.id === user?.id || user?.is_staff) && (
          <button className="comment-delete" onClick={handleDelete}>✕</button>
        )}
      </div>
      {c.content && c.content !== '(image)' && (
        <p className="comment-content">
          {c.content.replace(/^@\[.+?\]\s?/, '')}
        </p>
      )}
      {c.image && <img src={c.image} className="comment-attached-image" alt="" onClick={() => window.open(c.image, '_blank')} />}
      <div className="comment-actions">
        <button className="action-btn" onClick={handleLike}>♥ {c.likes_count || 0}</button>
        <button className="action-btn reply-btn" onClick={() => setReplyOpen(!replyOpen)}>Reply</button>
      </div>

      {replyOpen && (
        <div className="reply-input-area">
          <div className="comment-input-row">
            <input
              className="input comment-input"
              placeholder={`Reply to ${c.user.full_name}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReply()}
            />
            <label className="comment-image-btn" title="Attach image">
              📎
              <input type="file" accept="image/*" hidden onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append('image', file);
                try {
                  const res = await apiClient.post('/api/upload/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                  replyImageRef.current = res.data.url;
                  setReplyImage(res.data.url);
                } catch {}
              }} />
            </label>
            <button className="comment-submit" onClick={handleReply} disabled={loading}>Send</button>
          </div>
          {replyImage && (
            <div className="comment-image-preview-wrap">
              <img src={replyImage} className="comment-image-preview" alt="" />
              <button className="image-remove" onClick={() => { setReplyImage(null); replyImageRef.current = null; }}>✕ Remove</button>
            </div>
          )}
        </div>
      )}

      {c.replies && c.replies.length > 0 && depth === 0 && (
        <button className="toggle-replies-btn" onClick={() => setRepliesVisible(!repliesVisible)}>
          {repliesVisible ? '▾' : '▸'} {c.replies.length} {c.replies.length === 1 ? 'reply' : 'replies'}
        </button>
      )}
      {c.replies && c.replies.length > 0 && (depth > 0 || repliesVisible) && (
        <div className="replies-list">
          {c.replies.map((r) => (
            <CommentItem key={r.id} comment={r} allComments={allComments} setComments={setComments} postId={postId} depth={depth + 1} replyToName={c.user.full_name} onMessageUser={onMessageUser} />
          ))}
        </div>
      )}
    </div>
  );
};

// Helper functions for updating nested comment state
const removeComment = (comments: Comment[], id: number): Comment[] =>
  comments.filter((c) => c.id !== id).map((c) => ({
    ...c,
    replies: c.replies ? removeComment(c.replies, id) : [],
  }));

const updateCommentLike = (comments: Comment[], id: number, likesCount: number): Comment[] =>
  comments.map((c) => ({
    ...c,
    likes_count: c.id === id ? likesCount : c.likes_count,
    replies: c.replies ? updateCommentLike(c.replies, id, likesCount) : [],
  }));

const addReply = (comments: Comment[], parentId: number, reply: Comment): Comment[] =>
  comments.map((c) =>
    c.id === parentId
      ? { ...c, replies: [...(c.replies || []), reply] }
      : { ...c, replies: c.replies ? addReply(c.replies, parentId, reply) : [] }
  );

const PostDetailModal: React.FC<{ post: Post; onClose: () => void }> = ({ post: initialPost, onClose }) => {
  const { user } = useAuth();
  const post = initialPost;
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [likes, setLikes] = useState(post.likes_count);
  const [liked, setLiked] = useState(post.user_has_liked ?? false);
  const [showReport, setShowReport] = useState(false);
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const commentImageRef = useRef<string | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const isOwner = post.can_edit === true;
  const [msgTarget, setMsgTarget] = useState<{ id: number; full_name: string } | null>(null);

  useEffect(() => {
    // Trigger view count
    apiClient.post(`/api/forum/posts/${post.id}/view/`).catch(() => {});
    apiClient.get('/api/forum/comments/', { params: { post: post.id } })
      .then((res) => setComments(res.data.results ?? res.data))
      .catch(() => {});
  }, []);

  const handleLike = async () => {
    try {
      const res = await apiClient.post(`/api/forum/posts/${post.id}/like/`);
      setLikes(res.data.likes_count);
      setLiked(res.data.liked);
    } catch {}
  };

  const handleComment = async () => {
    const img = commentImageRef.current;
    if (!newComment.trim() && !img) return;
    const content = newComment.trim() || '(image)';
    try {
      setLoading(true);
      const body: any = { post: post.id, content };
      if (img) body.image = img;
      const res = await apiClient.post('/api/forum/comments/', body);
      setComments([...comments, res.data]);
      setNewComment('');
      setCommentImage(null);
      commentImageRef.current = null;
    } catch {} finally { setLoading(false); }
  };

  const totalComments = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);
  const catLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label ?? v;

  return (
    <Modal title="Post" onClose={onClose}>
      <Badge text={catLabel(post.category)} color="#555" />
      <h2 className="detail-post-title">{post.title}</h2>
      <p className="detail-post-meta">by <span
        style={{ cursor: post.user.id !== user?.id ? 'pointer' : 'default', color: post.user.id !== user?.id ? '#800000' : 'inherit', textDecoration: post.user.id !== user?.id ? 'underline' : 'none' }}
        onClick={() => { if (post.user.id !== user?.id) setMsgTarget(post.user); }}
      >{post.user.full_name}</span> · {new Date(post.created_at).toLocaleDateString()}</p>
      {post.tags && post.tags.length > 0 && (
        <div className="tag-list">{post.tags.map((t) => <span key={t} className="tag">#{t}</span>)}</div>
      )}
      <p className="detail-post-content">{post.content}</p>
      {post.images && post.images.length > 0 && (
        <div className="post-images">
          {post.images.map((url: string) => (
            <img key={url} src={url} className="post-image" alt="" onClick={() => window.open(url, '_blank')} />
          ))}
        </div>
      )}
      <div className="detail-actions">
        <button className={`action-btn large ${liked ? 'liked' : ''}`} onClick={handleLike}>♥ {likes}</button>
        <button className="action-btn large" onClick={() => commentInputRef.current?.focus()}>💬 {totalComments}</button>
        {isOwner && <span className="action-btn large views">👁 {post.views_count || 0}</span>}
        {(isOwner || user?.is_staff) && (
          <button className="action-btn large danger-text" onClick={async () => {
            if (!window.confirm('Delete this post?')) return;
            try { await apiClient.delete(`/api/forum/posts/${post.id}/`); onClose(); } catch {}
          }}>🗑 Delete</button>
        )}
        {!isOwner && (
          <button className="action-btn large danger-text" onClick={() => setShowReport(true)}>⚑ Report</button>
        )}
      </div>

      {showReport && <ReportModal contentType="post" contentId={post.id} onClose={() => setShowReport(false)} />}

      <div className="comments-section">
        <h4 className="comments-title">Comments ({totalComments})</h4>
        {comments.length === 0 && <p className="empty-state small">No comments yet. Be the first!</p>}
        {comments.map((c) => (
          <CommentItem key={c.id} comment={c} allComments={comments} setComments={setComments} postId={post.id} onMessageUser={setMsgTarget} />
        ))}
        <div className="comment-input-row">
          <input
            ref={commentInputRef}
            className="input comment-input"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
          />
          <label className="comment-image-btn" title="Attach image">
            📎
            <input type="file" accept="image/*" hidden onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.append('image', file);
              try {
                const res = await apiClient.post('/api/upload/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                commentImageRef.current = res.data.url;
                setCommentImage(res.data.url);
              } catch {}
            }} />
          </label>
          <button className="comment-submit" onClick={handleComment} disabled={loading}>Send</button>
        </div>
        {commentImage && (
          <div className="comment-image-preview-wrap">
            <img src={commentImage} className="comment-image-preview" alt="" />
            <button className="image-remove" onClick={() => { setCommentImage(null); commentImageRef.current = null; }}>✕ Remove</button>
          </div>
        )}
      </div>
      {msgTarget && (
        <MessageUserModal
          targetUser={msgTarget}
          source={`Forum: "${post.title}"`}
          onClose={() => setMsgTarget(null)}
        />
      )}
    </Modal>
  );
};

// ─── Profile Screen ───────────────────────────────────────────────────────────

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [myListings, setMyListings] = useState<SwipeListing[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<'listings' | 'posts'>('listings');

  useEffect(() => {
    apiClient.get('/api/swipes/listings/my_listings/').then((r) => setMyListings(r.data.results ?? r.data)).catch(() => {});
    apiClient.get('/api/forum/posts/my_posts/').then((r) => setMyPosts(r.data.results ?? r.data)).catch(() => {});
  }, []);

  const campusLabel = (c: string) => c === 'RH' ? 'Rose Hill' : 'Lincoln Center';

  return (
    <div className="tab-content">
      <div className="profile-header">
        <div className="avatar">{user?.full_name?.charAt(0).toUpperCase()}</div>
        <h2 className="profile-name">{user?.full_name}</h2>
        <p className="profile-email">{user?.email}</p>
        <p className="profile-campus">{user?.campus ? campusLabel(user.campus) : ''}</p>
        <div className="reliability-badge">⭐ Reliability Score: {user?.reliability_score ?? 100}</div>
      </div>

      <div className="content">
        <Card>
          <div className="stats-row">
            <div className="stat">
              <div className="stat-number">{user?.swipes_donated ?? 0}</div>
              <div className="stat-label">Donated</div>
            </div>
            <div className="stat">
              <div className="stat-number">{user?.swipes_received ?? 0}</div>
              <div className="stat-label">Received</div>
            </div>
            <div className="stat">
              <div className="stat-number">{myListings.length}</div>
              <div className="stat-label">Listings</div>
            </div>
            <div className="stat">
              <div className="stat-number">{myPosts.length}</div>
              <div className="stat-label">Posts</div>
            </div>
          </div>
        </Card>

        <div className="filter-group" style={{ marginBottom: 16 }}>
          <button className={`filter-btn ${tab === 'listings' ? 'active' : ''}`} onClick={() => setTab('listings')}>My Listings</button>
          <button className={`filter-btn ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}>My Posts</button>
        </div>

        {tab === 'listings' ? (
          myListings.length === 0 ? <div className="empty-state">No listings yet.</div> : myListings.map((l) => (
            <Card key={l.id}>
              <div className="listing-row">
                <div>
                  <Badge text={l.type === 'donation' ? 'Donation' : 'Request'} color={l.type === 'donation' ? '#2e7d32' : '#1565c0'} />
                  <Badge text={l.status} color={l.status === 'open' ? '#2e7d32' : '#888'} />
                </div>
                <span className="listing-qty">x{l.quantity}</span>
              </div>
              <div className="listing-date">{l.available_date}</div>
              {l.notes && <div className="listing-notes">{l.notes}</div>}
            </Card>
          ))
        ) : (
          myPosts.length === 0 ? <div className="empty-state">No posts yet.</div> : myPosts.map((p) => (
            <Card key={p.id}>
              <div className="post-header">
                <Badge text={CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category} color="#555" />
                <span className="post-time">{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="post-title">{p.title}</h3>
              <div className="post-actions" style={{ marginTop: 8 }}>
                <span className="action-btn">♥ {p.likes_count}</span>
                <span className="action-btn">💬 {p.comments_count}</span>
              </div>
            </Card>
          ))
        )}

        <Button onClick={logout} variant="danger">Logout</Button>
      </div>
    </div>
  );
};

// ─── Activity History Modal ───────────────────────────────────────────────────

type ActivityView = 'donated' | 'requested' | 'completed';

const ActivityHistoryModal: React.FC<{ view: ActivityView; onClose: () => void }> = ({ view, onClose }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const titles: Record<ActivityView, string> = {
    donated: 'Donations History',
    requested: 'Requests History',
    completed: 'Completed Matches',
  };

  const campusLabel = (c: string) => c === 'RH' ? 'Rose Hill' : 'Lincoln Center';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (view === 'donated') {
          const res = await apiClient.get('/api/swipes/listings/my_listings/');
          const all = res.data.results ?? res.data;
          setItems(all.filter((l: any) => l.type === 'donation'));
        } else if (view === 'requested') {
          const res = await apiClient.get('/api/swipes/listings/my_listings/');
          const all = res.data.results ?? res.data;
          setItems(all.filter((l: any) => l.type === 'request'));
        } else {
          const res = await apiClient.get('/api/swipes/matches/my_matches/', { params: { status: 'completed' } });
          setItems(res.data.results ?? res.data);
        }
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [view]);

  const statusColor = (s: string) => ({ open: '#2e7d32', pending: '#e65100', completed: '#1565c0', cancelled: '#888' }[s] ?? '#888');

  return (
    <Modal title={titles[view]} onClose={onClose}>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">No history yet.</div>
      ) : view === 'completed' ? (
        items.map((m) => (
          <div key={m.id} className="history-item">
            <div className="history-row">
              <Badge text="Completed" color="#1565c0" />
              <span className="history-date">{new Date(m.completed_at ?? m.created_at).toLocaleDateString()}</span>
            </div>
            <div className="history-detail"><strong>Donor:</strong> {m.donor?.full_name}</div>
            <div className="history-detail"><strong>Requester:</strong> {m.requester?.full_name}</div>
          </div>
        ))
      ) : (
        items.map((l) => (
          <div key={l.id} className="history-item">
            <div className="history-row">
              <div>
                <Badge text={l.type === 'donation' ? 'Donation' : 'Request'} color={l.type === 'donation' ? '#2e7d32' : '#1565c0'} />
                <Badge text={l.status} color={statusColor(l.status)} />
              </div>
              <span className="history-qty">x{l.quantity}</span>
            </div>
            <div className="history-detail">{campusLabel(l.campus)}</div>
            <div className="history-date">{l.available_date}{l.available_time ? ` · ~${l.available_time}` : ''}</div>
            {l.notes && <div className="history-notes">{l.notes}</div>}
          </div>
        ))
      )}
    </Modal>
  );
};

// ─── Admin Screen ─────────────────────────────────────────────────────────────

type AdminTab = 'dashboard' | 'reports' | 'users' | 'actions';

interface ReportItem {
  id: number;
  reporter: User;
  content_type: string;
  content_id: number;
  reason: string;
  description: string;
  status: string;
  admin_notes: string;
  reviewed_by: User | null;
  created_at: string;
}

interface ActionItem {
  id: number;
  report: ReportItem;
  action_type: string;
  target_user: User;
  admin: User;
  notes: string;
  duration_days: number | null;
  created_at: string;
}

const AdminScreen: React.FC = () => {
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');

  return (
    <div className="tab-content">
      <div className="admin-tabs">
        {([
          { key: 'dashboard' as AdminTab, label: 'Dashboard' },
          { key: 'reports' as AdminTab, label: 'Reports' },
          { key: 'users' as AdminTab, label: 'Users' },
          { key: 'actions' as AdminTab, label: 'Actions' },
        ]).map((t) => (
          <button
            key={t.key}
            className={`admin-tab-btn ${adminTab === t.key ? 'active' : ''}`}
            onClick={() => setAdminTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="content">
        {adminTab === 'dashboard' && <AdminDashboard />}
        {adminTab === 'reports' && <AdminReports />}
        {adminTab === 'users' && <AdminUsers />}
        {adminTab === 'actions' && <AdminActions />}
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get('/api/moderation/reports/stats/'),
      apiClient.get('/api/auth/admin/users/'),
    ]).then(([s, u]) => {
      setStats(s.data);
      const users = u.data.results ?? u.data;
      setUserCount(Array.isArray(users) ? users.length : 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <>
      <h3 className="admin-section-title">Moderation Overview</h3>
      <div className="admin-stats-grid">
        <div className="admin-stat-card pending">
          <div className="admin-stat-number">{stats?.pending_reports ?? 0}</div>
          <div className="admin-stat-label">Pending Reports</div>
        </div>
        <div className="admin-stat-card review">
          <div className="admin-stat-number">{stats?.under_review_reports ?? 0}</div>
          <div className="admin-stat-label">Under Review</div>
        </div>
        <div className="admin-stat-card resolved">
          <div className="admin-stat-number">{stats?.resolved_reports ?? 0}</div>
          <div className="admin-stat-label">Resolved</div>
        </div>
        <div className="admin-stat-card dismissed">
          <div className="admin-stat-number">{stats?.dismissed_reports ?? 0}</div>
          <div className="admin-stat-label">Dismissed</div>
        </div>
      </div>

      <Card>
        <h4>Summary</h4>
        <p>Total Reports: <strong>{stats?.total_reports ?? 0}</strong></p>
        <p>Total Actions Taken: <strong>{stats?.total_actions ?? 0}</strong></p>
        <p>Total Users: <strong>{userCount ?? '...'}</strong></p>
      </Card>

      {stats?.reports_by_type && Object.keys(stats.reports_by_type).length > 0 && (
        <Card>
          <h4>Reports by Type</h4>
          {Object.entries(stats.reports_by_type).map(([k, v]) => (
            <p key={k}>{k}: <strong>{v as number}</strong></p>
          ))}
        </Card>
      )}

      {stats?.reports_by_reason && Object.keys(stats.reports_by_reason).length > 0 && (
        <Card>
          <h4>Reports by Reason</h4>
          {Object.entries(stats.reports_by_reason).map(([k, v]) => (
            <p key={k}>{k}: <strong>{v as number}</strong></p>
          ))}
        </Card>
      )}
    </>
  );
};

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selected, setSelected] = useState<ReportItem | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await apiClient.get('/api/moderation/reports/', { params });
      setReports(res.data.results ?? res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const statusColor = (s: string) => ({ pending: '#e65100', under_review: '#1565c0', resolved: '#2e7d32', dismissed: '#888' }[s] ?? '#888');
  const reasonLabel = (r: string) => REPORT_REASONS.find((x) => x.value === r)?.label ?? r;

  const handleResolve = async (id: number, notes: string) => {
    try {
      await apiClient.post(`/api/moderation/reports/${id}/resolve/`, { admin_notes: notes });
      load();
      setSelected(null);
    } catch {}
  };

  const handleDismiss = async (id: number, notes: string) => {
    try {
      await apiClient.post(`/api/moderation/reports/${id}/dismiss/`, { admin_notes: notes });
      load();
      setSelected(null);
    } catch {}
  };

  return (
    <>
      <div className="filter-group" style={{ marginBottom: 12 }}>
        {['pending', 'under_review', 'resolved', 'dismissed', 'all'].map((s) => (
          <button key={s} className={`filter-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
            {s === 'all' ? 'All' : s === 'under_review' ? 'Reviewing' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div className="loading">Loading...</div> : reports.length === 0 ? (
        <div className="empty-state">No reports found.</div>
      ) : reports.map((r) => (
        <Card key={r.id} onClick={() => setSelected(r)}>
          <div className="report-row">
            <Badge text={r.status} color={statusColor(r.status)} />
            <Badge text={r.content_type} color="#555" />
            <Badge text={reasonLabel(r.reason)} color="#800000" />
          </div>
          <p className="report-info">
            Reported by {r.reporter?.full_name ?? 'Unknown'} · {new Date(r.created_at).toLocaleDateString()}
          </p>
          {r.description && <p className="report-desc">{r.description.slice(0, 100)}{r.description.length > 100 ? '...' : ''}</p>}
        </Card>
      ))}

      {selected && <ReportDetailModal report={selected} onResolve={handleResolve} onDismiss={handleDismiss} onClose={() => setSelected(null)} />}
    </>
  );
};

const ReportDetailModal: React.FC<{
  report: ReportItem;
  onResolve: (id: number, notes: string) => void;
  onDismiss: (id: number, notes: string) => void;
  onClose: () => void;
}> = ({ report, onResolve, onDismiss, onClose }) => {
  const [notes, setNotes] = useState(report.admin_notes || '');
  const [actionType, setActionType] = useState('warning');
  const [targetUserId, setTargetUserId] = useState('');
  const [durationDays, setDurationDays] = useState('7');
  const [actionNotes, setActionNotes] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const statusColor = (s: string) => ({ pending: '#e65100', under_review: '#1565c0', resolved: '#2e7d32', dismissed: '#888' }[s] ?? '#888');

  const handleCreateAction = async () => {
    if (!targetUserId) { setActionMsg('Target user ID is required'); return; }
    try {
      await apiClient.post('/api/moderation/actions/', {
        report: report.id,
        action_type: actionType,
        target_user: parseInt(targetUserId),
        notes: actionNotes || 'Moderation action taken',
        duration_days: actionType === 'user_suspended' ? parseInt(durationDays) : null,
      });
      setActionMsg('Action created successfully');
    } catch (err: any) {
      setActionMsg(err.response?.data?.detail || 'Failed to create action');
    }
  };

  return (
    <Modal title={`Report #${report.id}`} onClose={onClose}>
      <div className="detail-row">
        <Badge text={report.status} color={statusColor(report.status)} />
        <Badge text={report.content_type} color="#555" />
      </div>
      <div className="detail-section">
        <p><strong>Reporter:</strong> {report.reporter?.full_name} ({report.reporter?.email})</p>
        <p><strong>Content:</strong> {report.content_type} #{report.content_id}</p>
        <p><strong>Reason:</strong> {REPORT_REASONS.find((x) => x.value === report.reason)?.label ?? report.reason}</p>
        <p><strong>Date:</strong> {new Date(report.created_at).toLocaleString()}</p>
        {report.description && <p><strong>Description:</strong> {report.description}</p>}
        {report.reviewed_by && <p><strong>Reviewed by:</strong> {report.reviewed_by.full_name}</p>}
      </div>

      {report.status === 'pending' || report.status === 'under_review' ? (
        <>
          <div className="input-container">
            <label className="input-label">Admin Notes</label>
            <textarea className="input textarea" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Add notes..." />
          </div>
          <div className="admin-action-buttons">
            <Button onClick={() => onResolve(report.id, notes)} variant="primary">Resolve</Button>
            <Button onClick={() => onDismiss(report.id, notes)} variant="outline">Dismiss</Button>
          </div>

          <hr className="admin-divider" />
          <h4>Take Moderation Action</h4>
          <div className="input-container">
            <label className="input-label">Action Type</label>
            <select className="input" value={actionType} onChange={(e) => setActionType(e.target.value)}>
              <option value="warning">Warning</option>
              <option value="content_removed">Remove Content</option>
              <option value="user_suspended">Suspend User</option>
              <option value="user_banned">Ban User</option>
              <option value="no_action">No Action</option>
            </select>
          </div>
          <Input label="Target User ID" placeholder="User ID to take action on" value={targetUserId} onChange={setTargetUserId} />
          {actionType === 'user_suspended' && (
            <Input label="Suspension Duration (days)" type="number" placeholder="7" value={durationDays} onChange={setDurationDays} />
          )}
          <div className="input-container">
            <label className="input-label">Action Notes</label>
            <textarea className="input textarea" value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} rows={2} placeholder="Reason for action..." />
          </div>
          {actionMsg && <div className={actionMsg.includes('success') ? 'success-message' : 'error-message'}>{actionMsg}</div>}
          <Button onClick={handleCreateAction} variant="danger">Execute Action</Button>
        </>
      ) : (
        report.admin_notes && <p><strong>Admin Notes:</strong> {report.admin_notes}</p>
      )}
    </Modal>
  );
};

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [actionMsg, setActionMsg] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (activeFilter !== 'all') params.is_active = activeFilter === 'active' ? 'true' : 'false';
      const res = await apiClient.get('/api/auth/admin/users/', { params });
      setUsers(res.data.results ?? res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [activeFilter]);

  const handleAction = async (userId: number, action: string, days?: number) => {
    try {
      const body: any = { action };
      if (days) body.duration_days = days;
      await apiClient.post(`/api/auth/admin/users/${userId}/toggle-active/`, body);
      setActionMsg(`Action "${action}" successful`);
      load();
    } catch { setActionMsg('Action failed'); }
  };

  return (
    <>
      <div className="admin-user-toolbar">
        <div className="search-mini" style={{ flex: 1, marginRight: 8 }}>
          <input
            className="search-mini-input"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
          {search && <button className="search-mini-clear" onClick={() => { setSearch(''); load(); }}>x</button>}
        </div>
        <div className="filter-group">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button key={f} className={`filter-btn ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {actionMsg && <div className="success-message" style={{ marginBottom: 8 }}>{actionMsg}</div>}

      {loading ? <div className="loading">Loading...</div> : users.length === 0 ? (
        <div className="empty-state">No users found.</div>
      ) : users.map((u) => (
        <Card key={u.id}>
          <div className="admin-user-row">
            <div className="admin-user-info">
              <div className="admin-user-avatar">{u.full_name?.charAt(0).toUpperCase()}</div>
              <div>
                <div className="admin-user-name">
                  {u.full_name}
                  {u.is_staff && <Badge text="Admin" color="#800000" />}
                </div>
                <div className="admin-user-email">{u.email}</div>
                <div className="admin-user-meta">
                  ID: {u.id} · {u.campus === 'RH' ? 'Rose Hill' : 'Lincoln Center'}
                  · Joined {new Date(u.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="admin-user-status">
              <Badge text={u.is_active !== false ? 'Active' : 'Inactive'} color={u.is_active !== false ? '#2e7d32' : '#c62828'} />
              {u.is_email_verified && <Badge text="Verified" color="#1565c0" />}
            </div>
          </div>
          {!u.is_staff && (
            <div className="admin-user-actions">
              {u.is_active !== false ? (
                <>
                  <button className="admin-action-btn warn" onClick={() => handleAction(u.id, 'suspend', 7)}>Suspend 7d</button>
                  <button className="admin-action-btn ban" onClick={() => handleAction(u.id, 'ban')}>Ban</button>
                </>
              ) : (
                <button className="admin-action-btn activate" onClick={() => handleAction(u.id, 'activate')}>Activate</button>
              )}
            </div>
          )}
        </Card>
      ))}
    </>
  );
};

const AdminActions: React.FC = () => {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/moderation/actions/')
      .then((res) => setActions(res.data.results ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const actionLabel = (t: string) => ({
    warning: 'Warning',
    content_removed: 'Content Removed',
    user_suspended: 'Suspended',
    user_banned: 'Banned',
    no_action: 'No Action',
  }[t] ?? t);

  const actionColor = (t: string) => ({
    warning: '#e65100',
    content_removed: '#c62828',
    user_suspended: '#e65100',
    user_banned: '#c62828',
    no_action: '#888',
  }[t] ?? '#888');

  return (
    <>
      <h3 className="admin-section-title">Moderation Action History</h3>
      {loading ? <div className="loading">Loading...</div> : actions.length === 0 ? (
        <div className="empty-state">No moderation actions taken yet.</div>
      ) : actions.map((a) => (
        <Card key={a.id}>
          <div className="report-row">
            <Badge text={actionLabel(a.action_type)} color={actionColor(a.action_type)} />
            {a.duration_days && <Badge text={`${a.duration_days} days`} color="#555" />}
          </div>
          <p className="report-info">
            <strong>Target:</strong> {a.target_user?.full_name} ({a.target_user?.email})
          </p>
          <p className="report-info">
            <strong>By:</strong> {a.admin?.full_name} · {new Date(a.created_at).toLocaleString()}
          </p>
          {a.notes && <p className="report-desc">{a.notes}</p>}
        </Card>
      ))}
    </>
  );
};

// ─── Messages Screen ──────────────────────────────────────────────────────────

const MessagesScreen: React.FC<{ openConvId?: number; onDeepLinkHandled?: () => void }> = ({ openConvId, onDeepLinkHandled }) => {
  const { user } = useAuth();
  const [convs, setConvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const isNearBottom = () => {
    const el = chatContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMsgCount(0);
  };

  useEffect(() => {
    loadConvs();
    const interval = setInterval(loadConvs, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-poll messages when a conversation is open
  useEffect(() => {
    if (!activeConv) return;
    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get(`/api/messaging/conversations/${activeConv.id}/messages/`);
        const newMsgs = res.data;
        const added = newMsgs.length - messages.length;
        if (added > 0 && !isNearBottom()) {
          setNewMsgCount((prev) => prev + added);
        } else if (added > 0) {
          setNewMsgCount(0);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
        setMessages(newMsgs);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [activeConv, messages.length]);

  // Auto-open conversation from deep link
  useEffect(() => {
    if (openConvId && convs.length > 0 && !activeConv) {
      const target = convs.find((c) => c.id === openConvId);
      if (target) {
        openConv(target);
        onDeepLinkHandled?.();
      }
    }
  }, [openConvId, convs]);

  const loadConvs = async () => {
    try {
      const res = await apiClient.get('/api/messaging/conversations/');
      setConvs(res.data.results ?? res.data);
    } catch {} finally { setLoading(false); }
  };

  const openConv = async (conv: any) => {
    setActiveConv(conv);
    setNewMsgCount(0);
    try {
      const res = await apiClient.get(`/api/messaging/conversations/${conv.id}/messages/`);
      setMessages(res.data);
      // Update unread count locally
      setConvs((prev) => prev.map((c) => c.id === conv.id ? { ...c, unread_count: 0 } : c));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
    } catch {}
  };

  const sendReply = async () => {
    if (!text.trim() || sending || !activeConv) return;
    try {
      setSending(true);
      const body: any = { text: text.trim() };
      if (replyTo) body.reply_to = replyTo.id;
      const res = await apiClient.post(`/api/messaging/conversations/${activeConv.id}/reply/`, body);
      setMessages((prev) => [...prev, res.data]);
      setText('');
      setReplyTo(null);
      setNewMsgCount(0);
      // Update last message in convs list
      setConvs((prev) => prev.map((c) => c.id === activeConv.id ? { ...c, last_message: { text: res.data.text, author_name: res.data.author_name, created_at: res.data.created_at } } : c));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {} finally { setSending(false); }
  };

  const deleteConv = async (convId: number) => {
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await apiClient.delete(`/api/messaging/conversations/${convId}/`);
      setConvs((prev) => prev.filter((c) => c.id !== convId));
      if (activeConv?.id === convId) { setActiveConv(null); setMessages([]); }
    } catch {}
  };

  const otherName = (conv: any) => {
    if (!user) return 'Unknown';
    return conv.sender === user.id ? conv.receiver_name : conv.sender_name;
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) return <div className="loading">Loading messages...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100%', gap: 0, background: '#fff', overflow: 'hidden' }}>
      {/* Conversation list */}
      <div style={{ width: activeConv ? 320 : '100%', borderRight: activeConv ? '1px solid #e0e0e0' : 'none', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', fontWeight: 700, fontSize: 16, color: '#333' }}>
          Messages
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {convs.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: 40, fontSize: 14 }}>No conversations yet</div>
          ) : convs.map((conv) => (
            <div key={conv.id} onClick={() => openConv(conv)} style={{
              padding: '12px 16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
              background: activeConv?.id === conv.id ? '#fdf0f0' : 'transparent',
              display: 'flex', gap: 10, alignItems: 'center',
              transition: 'background 0.15s',
            }}
              onMouseEnter={(e) => { if (activeConv?.id !== conv.id) e.currentTarget.style.background = '#fafafa'; }}
              onMouseLeave={(e) => { if (activeConv?.id !== conv.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 20, background: '#800000', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0,
              }}>
                {otherName(conv)?.charAt(0) || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>{otherName(conv)}</span>
                  {conv.unread_count > 0 && (
                    <span style={{ background: '#800000', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#777', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {conv.last_message?.text || 'No messages yet'}
                </div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                  {conv.listing_type ? `${conv.listing_type === 'donation' ? 'Donation' : 'Request'} · ${conv.listing_date}` : 'Direct Message'}
                  {conv.last_message?.created_at && ` · ${timeAgo(conv.last_message.created_at)}`}
                </div>
              </div>
              <span onClick={(e) => { e.stopPropagation(); deleteConv(conv.id); }}
                style={{ color: '#ccc', fontSize: 16, padding: '4px 6px', cursor: 'pointer', flexShrink: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#c62828')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#ccc')}
                title="Delete conversation">✕</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      {activeConv && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #eee', fontWeight: 600, fontSize: 15, color: '#333', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span onClick={() => setActiveConv(null)} style={{ cursor: 'pointer', fontSize: 18, color: '#800000' }}>←</span>
            {otherName(activeConv)}
            <span style={{ fontWeight: 400, fontSize: 12, color: '#999' }}>
              {activeConv.listing_type ? `${activeConv.listing_type === 'donation' ? 'Donation' : 'Request'} · ${activeConv.listing_date}` : 'Direct Message'}
            </span>
          </div>
          <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#fafafa', position: 'relative' }}
            onScroll={() => { if (isNearBottom()) setNewMsgCount(0); }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>No messages yet</div>
            ) : messages.map((m: any) => (
              <div key={m.id} style={{ marginBottom: 10, textAlign: m.is_mine ? 'right' : 'left' }}>
                {m.reply_to_data && (
                  <div style={{
                    display: 'inline-block', maxWidth: '70%', padding: '4px 10px', borderRadius: 8, marginBottom: 2,
                    background: m.is_mine ? 'rgba(255,255,255,0.15)' : '#d5d5d5', fontSize: 12, color: '#666',
                    borderLeft: '3px solid #800000', textAlign: 'left',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 11, color: '#800000' }}>{m.reply_to_data.author_name}</div>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.reply_to_data.text}</div>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: m.is_mine ? 'flex-end' : 'flex-start' }}>
                  {!m.is_mine && (
                    <span onClick={() => setReplyTo(m)} style={{ cursor: 'pointer', fontSize: 14, color: '#aaa', padding: '2px 4px' }} title="Quote reply">↩</span>
                  )}
                  <div style={{
                    display: 'inline-block', padding: '9px 14px', borderRadius: 14, maxWidth: '70%', fontSize: 14, lineHeight: '20px',
                    background: m.is_mine ? '#800000' : '#e8e8e8', color: m.is_mine ? '#fff' : '#333',
                    borderBottomRightRadius: m.is_mine ? 4 : 14, borderBottomLeftRadius: m.is_mine ? 14 : 4,
                  }}>{m.text}</div>
                  {m.is_mine && (
                    <span onClick={() => setReplyTo(m)} style={{ cursor: 'pointer', fontSize: 14, color: '#aaa', padding: '2px 4px' }} title="Quote reply">↩</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>
                  {m.author_name} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            {newMsgCount > 0 && (
              <div onClick={scrollToBottom} style={{
                position: 'sticky', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                background: '#800000', color: '#fff', borderRadius: 20, padding: '6px 16px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', width: 'fit-content', margin: '0 auto',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)', textAlign: 'center',
              }}>
                ↓ {newMsgCount} new message{newMsgCount > 1 ? 's' : ''}
              </div>
            )}
          </div>
          <div style={{ borderTop: '1px solid #eee', background: '#fff' }}>
            {replyTo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#f5f0f0', borderBottom: '1px solid #eee' }}>
                <div style={{ flex: 1, borderLeft: '3px solid #800000', paddingLeft: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#800000' }}>{replyTo.author_name}</div>
                  <div style={{ fontSize: 12, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyTo.text}</div>
                </div>
                <span onClick={() => setReplyTo(null)} style={{ cursor: 'pointer', color: '#999', fontSize: 16, padding: 4 }}>✕</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, padding: 12 }}>
              <input className="input" style={{ flex: 1, margin: 0 }} placeholder={replyTo ? `Reply to ${replyTo.author_name}...` : "Type a message..."}
                value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendReply()} />
              <button onClick={sendReply} disabled={sending || !text.trim()} style={{
                padding: '8px 16px', background: text.trim() ? '#800000' : '#ccc', color: '#fff', border: 'none',
                borderRadius: 8, cursor: text.trim() ? 'pointer' : 'default', fontSize: 13, fontWeight: 600,
              }}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────

type Tab = 'home' | 'swipes' | 'forum' | 'messages' | 'profile' | 'admin';

const HomeScreen: React.FC<{ onNavigate: (tab: Tab, link?: { type: 'conversation' | 'post'; id: number }) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [activityView, setActivityView] = useState<ActivityView | null>(null);
  const [news, setNews] = useState<any[]>([]);

  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    const fetchAll = () => {
      Promise.all([
        apiClient.get('/api/swipes/listings/stats/'),
        apiClient.get('/api/forum/posts/stats/'),
        apiClient.get('/api/auth/whats-new/'),
        apiClient.get('/api/auth/stats/'),
      ]).then(([sw, po, nw, us]) => {
        setStats({ swipes: sw.data, posts: po.data });
        setNews(nw.data.items || []);
        setUserStats(us.data);
      }).catch(() => {});
    };
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const campusLabel = (c: string) => c === 'RH' ? 'Rose Hill' : 'Lincoln Center';

  return (
    <div className="tab-content">
      <div className="welcome-section">
        <p className="welcome-text">Welcome back,</p>
        <h1 className="user-name">{user?.full_name}!</h1>
        <p className="user-campus">{user?.campus ? campusLabel(user.campus) : ''}</p>
      </div>
      <div className="content">
        <div className="home-grid">
          <div className="home-tile" onClick={() => onNavigate('swipes')}>
            <span className="home-tile-icon">🍽️</span>
            <span className="home-tile-label">Swipes</span>
          </div>
          <div className="home-tile" onClick={() => onNavigate('forum')}>
            <span className="home-tile-icon">💬</span>
            <span className="home-tile-label">Forum</span>
          </div>
          <div className="home-tile" onClick={() => onNavigate('profile')}>
            <span className="home-tile-icon">👤</span>
            <span className="home-tile-label">Profile</span>
          </div>
        </div>

        <Card>
          <h3 className="card-title">Your Activity</h3>
          <div className="stats-row">
            <div className="stat stat-clickable" onClick={() => setActivityView('donated')}>
              <div className="stat-number">{stats?.swipes?.total_donations ?? 0}</div>
              <div className="stat-label">Available Donations</div>
            </div>
            <div className="stat stat-clickable" onClick={() => setActivityView('requested')}>
              <div className="stat-number">{stats?.swipes?.total_requests ?? 0}</div>
              <div className="stat-label">Requested</div>
            </div>
            <div className="stat stat-clickable" onClick={() => setActivityView('completed')}>
              <div className="stat-number">{stats?.swipes?.completed_matches ?? 0}</div>
              <div className="stat-label">Completed Shares</div>
            </div>
          </div>
          <div className="reliability-badge">⭐ Reliability: {user?.reliability_score ?? 100}</div>
        </Card>

        {(stats?.swipes?.pending_matches ?? 0) > 0 && (
          <Card>
            <p>You have <strong>{stats.swipes.pending_matches}</strong> pending match{stats.swipes.pending_matches > 1 ? 'es' : ''} waiting for confirmation.</p>
          </Card>
        )}

        <Card>
          <h3 className="card-title">What's New</h3>
          {news.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: 16 }}>You're all caught up!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {news.map((item: any, i: number) => {
                const icons: Record<string, string> = { message: '✉️', comment: '💬', like: '❤️', listing: '🍽️' };
                const diff = Date.now() - new Date(item.created_at).getTime();
                const mins = Math.floor(diff / 60000);
                const timeAgo = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;
                const handleClick = () => {
                  if (item.type === 'message') onNavigate('messages', { type: 'conversation', id: item.conversation_id });
                  else if (item.type === 'comment' || item.type === 'like') onNavigate('forum', { type: 'post', id: item.post_id });
                };
                return (
                  <div key={i} onClick={handleClick} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', padding: '6px 4px', borderRadius: 8 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ fontSize: 20, lineHeight: '24px' }}>{icons[item.type] || '📌'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>{item.text}</div>
                      {item.detail && <div style={{ fontSize: 13, color: '#777', marginTop: 2 }}>{item.detail}</div>}
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>{timeAgo}</div>
                    </div>
                    <span style={{ color: '#ccc', fontSize: 16 }}>›</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {userStats && (
          <Card>
            <h3 className="card-title">Activity Overview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Active Listings', value: userStats.active_listings_count ?? 0 },
                { label: 'Pending Matches', value: userStats.active_matches_count ?? 0 },
                { label: 'Completed Swaps', value: userStats.swipes_donated + userStats.swipes_received },
                { label: 'Forum Posts', value: userStats.posts_count ?? 0 },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '10px 0',
                  borderBottom: i < 3 ? '1px solid #f0f0f0' : 'none',
                }}>
                  <span style={{ fontSize: 14, color: '#555' }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {activityView && <ActivityHistoryModal view={activityView} onClose={() => setActivityView(null)} />}
    </div>
  );
};

const getTabFromHash = (): Tab => {
  const hash = window.location.hash.replace('#', '') as Tab;
  const valid: Tab[] = ['home', 'swipes', 'forum', 'messages', 'profile', 'admin'];
  return valid.includes(hash) ? hash : 'home';
};

const MainApp: React.FC = () => {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>(getTabFromHash());
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [deepLink, setDeepLink] = useState<{ type: 'conversation' | 'post'; id: number } | null>(null);

  useEffect(() => {
    const onHashChange = () => setTab(getTabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Poll for unread message count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await apiClient.get('/api/messaging/conversations/');
        const convs = res.data.results ?? res.data;
        const total = convs.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
        setUnreadTotal(total);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, []);

  const changeTab = (t: Tab) => {
    window.location.hash = t;
    setTab(t);
  };

  const TAB_LABELS: { key: Tab; label: string; icon: string }[] = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'swipes', label: 'Swipes', icon: '🍽️' },
    { key: 'forum', label: 'Forum', icon: '💬' },
    { key: 'messages', label: 'Messages', icon: '✉️' },
    { key: 'profile', label: 'Profile', icon: '👤' },
    ...(user?.is_staff ? [{ key: 'admin' as Tab, label: 'Admin', icon: '⚙️' }] : []),
  ];

  return (
    <div className="screen">
      <div className="header">
        <h1 className="header-title">SwipeShare</h1>
        <button className="logout-button" onClick={logout}>Logout</button>
      </div>

      {tab === 'messages' ? (
        <div style={{ flex: 1, overflow: 'hidden', marginBottom: 52 }}>
          <MessagesScreen openConvId={deepLink?.type === 'conversation' ? deepLink.id : undefined} onDeepLinkHandled={() => setDeepLink(null)} />
        </div>
      ) : (
        <div className="main-content">
          {tab === 'home' && <HomeScreen onNavigate={(t, link) => { setDeepLink(link ?? null); changeTab(t); }} />}
          {tab === 'swipes' && <SwipesScreen />}
          {tab === 'forum' && <ForumScreen openPostId={deepLink?.type === 'post' ? deepLink.id : undefined} onDeepLinkHandled={() => setDeepLink(null)} />}
          {tab === 'profile' && <ProfileScreen />}
          {tab === 'admin' && user?.is_staff && <AdminScreen />}
        </div>
      )}

      <div className="tab-bar">
        {TAB_LABELS.map((t) => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => changeTab(t.key)}>
            <span className="tab-icon" style={{ position: 'relative' }}>
              {t.icon}
              {t.key === 'messages' && unreadTotal > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -10, background: '#e53935', color: '#fff',
                  borderRadius: 10, padding: '1px 5px', fontSize: 10, fontWeight: 700, minWidth: 16, textAlign: 'center',
                  lineHeight: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}>{unreadTotal}</span>
              )}
            </span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Verify Email Screen ──────────────────────────────────────────────────────

const VerifyEmailScreen: React.FC<{ token: string; onDone: () => void }> = ({ token, onDone }) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    apiClient.post('/api/auth/verify-email/', { token })
      .then((res) => {
        setStatus('success');
        setMsg('Email verified! Logging you in...');
        if (res.data.tokens) {
          localStorage.setItem('access_token', res.data.tokens.access);
          localStorage.setItem('refresh_token', res.data.tokens.refresh);
          setTimeout(() => window.location.href = '/', 1500);
        }
      })
      .catch(() => {
        setStatus('error');
        setMsg('Invalid or expired verification link.');
      });
  }, []);

  return (
    <div className="screen">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Email Verification</h1>
        </div>
        {status === 'verifying' && <div className="loading">Verifying your email...</div>}
        {status === 'success' && <div className="success-message">{msg}</div>}
        {status === 'error' && (
          <>
            <div className="error-message">{msg}</div>
            <Button onClick={onDone} variant="outline">Back to Login</Button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  return (
    <AuthProvider>
      <AppContent authScreen={authScreen} setAuthScreen={setAuthScreen} />
    </AuthProvider>
  );
};

const AppContent: React.FC<{ authScreen: 'login' | 'register'; setAuthScreen: (s: 'login' | 'register') => void }> = ({ authScreen, setAuthScreen }) => {
  const { isAuthenticated } = useAuth();

  // Check for verify-email token in URL
  const params = new URLSearchParams(window.location.search);
  const verifyToken = params.get('token');
  if (window.location.pathname === '/verify-email' && verifyToken) {
    return <VerifyEmailScreen token={verifyToken} onDone={() => { window.history.pushState({}, '', '/'); setAuthScreen('login'); }} />;
  }

  if (!isAuthenticated) {
    return authScreen === 'login'
      ? <LoginScreen onSwitch={() => setAuthScreen('register')} />
      : <RegisterScreen onSwitch={() => setAuthScreen('login')} />;
  }
  return <MainApp />;
};

export default App;
