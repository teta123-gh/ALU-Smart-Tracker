/* =====================================================
   ALU Smart Learning & Skills Tracker — React App
   ===================================================== */
console.log("🔥 App loader started");
const { useState, useEffect, useContext, createContext, useCallback, useRef } = React;
const {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line,
  PieChart, Pie, Cell, Legend
} = window.Recharts || Recharts;

const API_BASE = 'https://alu-smart-tracker.onrender.com/api';

// ── API Helper ────────────────────────────────────────────
const api = {
  get: (path, token) => axios.get(`${API_BASE}${path}`, token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  post: (path, data, token) => axios.post(`${API_BASE}${path}`, data, token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  put: (path, data, token) => axios.put(`${API_BASE}${path}`, data, { headers: { Authorization: `Bearer ${token}` } }),
  del: (path, token) => axios.delete(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } }),
};

// ── Auth Context ─────────────────────────────────────────
const AuthContext = createContext(null);
function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('alu_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/auth/me', token)
        .then(r => setUser(r.data.user))
        .catch(() => { setToken(null); localStorage.removeItem('alu_token'); })
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, [token]);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    localStorage.setItem('alu_token', r.data.token);
    setToken(r.data.token);
    setUser(r.data.user);
  };

  const register = async (name, email, password, program, year) => {
    const r = await api.post('/auth/register', { name, email, password, program, year });
    localStorage.setItem('alu_token', r.data.token);
    setToken(r.data.token);
    setUser(r.data.user);
  };

  const logout = () => {
    localStorage.removeItem('alu_token');
    setToken(null); setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Router (mini hash router) ─────────────────────────────
function useRoute() {
  const [route, setRoute] = useState(window.location.hash.slice(1) || '/');
  useEffect(() => {
    const handler = () => setRoute(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  const navigate = path => { window.location.hash = path; };
  return { route, navigate };
}

// ── Utility Components ───────────────────────────────────
function Spinner() { return <span className="spinner" />; }

function ProgressBar({ value, start = '--alu-red', end = '--alu-gold' }) {
  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

function Modal({ title, onClose, children, actions }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────────
const STUDENT_NAV = [
  { path: '/',           icon: '⊞', label: 'Dashboard' },
  { path: '/courses',    icon: '📚', label: 'Courses' },
  { path: '/activities', icon: '⚡', label: 'Activities' },
  { path: '/skills',     icon: '🎯', label: 'Skills' },
  { path: '/goals',      icon: '🏆', label: 'Goals' },
];
const ADMIN_NAV = [
  { path: '/admin', icon: '🛡️', label: 'Admin Portal' },
  { path: '/courses', icon: '📚', label: 'Browse Courses' },
];

function Sidebar({ route, navigate }) {
  const { user, logout } = useAuth();
  const navItems = user?.is_admin ? ADMIN_NAV : STUDENT_NAV;
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">ALU</div>
        <div>
          <div className="logo-text">ALU Tracker</div>
          <div className="logo-sub">{user?.is_admin ? 'Admin Panel' : 'Smart Learning Platform'}</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-group-label">{user?.is_admin ? 'Admin Menu' : 'Main Menu'}</div>
        {navItems.map(item => (
          <div
            key={item.path}
            className={`nav-item${route === item.path ? ' active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="avatar">{user?.avatar_initials || 'AU'}</div>
        <div className="user-info">
          <div className="user-name">{user?.name || 'User'}</div>
          <div className="user-role">
            {user?.is_admin
              ? <span style={{ color: '#F4A261', fontWeight: 600 }}>🛡️ Administrator</span>
              : `Year ${user?.year} · ${user?.program?.split(' ')[0]}`
            }
          </div>
        </div>
        <button className="btn-logout" onClick={logout} title="Logout">⏻</button>
      </div>
    </aside>
  );
}

// ══════════════════════════════════════════════════════════
// ADMIN PORTAL PAGE
// ══════════════════════════════════════════════════════════
const COURSE_COLORS = ['#E63946','#F4A261','#2DC653','#457B9D','#7B2D8B','#2A9D8F','#E76F51','#F72585','#3776AB','#61DAFB'];
const COURSE_ICONS  = ['📚','💻','🤖','🌐','🗣️','🚀','🗄️','👑','🎨','📊','🔬','✏️','📐','🧩','💡'];
const COURSE_CATS   = ['Computer Science','AI/ML','Web Dev','Soft Skills','Business','Leadership','Design','Data Science','General'];

function AdminPortalPage() {
  const { token } = useAuth();
  const [stats, setStats]     = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('courses');
  const [expandedStudent, setExpandedStudent] = useState(null);

  // Course modals
  const [showModal, setShowModal]       = useState(false);
  const [editModal, setEditModal]       = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');

  const emptyForm = { name: '', instructor: '', description: '', category: 'Computer Science', total_modules: 10, color: '#E63946', icon: '📚' };
  const [form, setForm] = useState(emptyForm);

  const refresh = useCallback(() => {
    Promise.all([
      api.get('/admin/stats', token),
      api.get('/admin/courses', token),
      api.get('/admin/students', token),
    ])
      .then(([s, c, st]) => {
        setStats(s.data);
        setCourses(c.data.courses);
        setStudents(st.data.students);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  const createCourse = async () => {
    if (!form.name.trim() || !form.instructor.trim()) { setError('Name and instructor are required'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/admin/courses', form, token);
      setShowModal(false); setForm(emptyForm); refresh();
    } catch (e) { setError('Failed to create course'); }
    finally { setSaving(false); }
  };

  const updateCourse = async () => {
    if (!editModal) return;
    setSaving(true); setError('');
    try {
      await api.put(`/admin/courses/${editModal.id}`, editModal, token);
      setEditModal(null); refresh();
    } catch (e) { setError('Failed to update course'); }
    finally { setSaving(false); }
  };

  const deleteCourse = async (id) => {
    await api.del(`/admin/courses/${id}`, token);
    setConfirmDelete(null); refresh();
  };

  const CourseForm = ({ data, onChange }) => (
    <>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Course Name *</label>
          <input className="form-input" placeholder="e.g. Data Structures" value={data.name} onChange={e => onChange({ ...data, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Instructor *</label>
          <input className="form-input" placeholder="e.g. Dr. Kwame Asante" value={data.instructor} onChange={e => onChange({ ...data, instructor: e.target.value })} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-textarea" placeholder="Brief course description…" value={data.description} onChange={e => onChange({ ...data, description: e.target.value })} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={data.category} onChange={e => onChange({ ...data, category: e.target.value })}>
            {COURSE_CATS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Total Modules</label>
          <input className="form-input" type="number" min="1" max="50" value={data.total_modules} onChange={e => onChange({ ...data, total_modules: +e.target.value })} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Color</label>
          <select className="form-select" value={data.color} onChange={e => onChange({ ...data, color: e.target.value })}>
            {COURSE_COLORS.map(c => <option key={c} value={c} style={{ background: c, color: '#fff' }}>{c}</option>)}
          </select>
          <div style={{ height: 6, borderRadius: 3, background: data.color, marginTop: 6 }} />
        </div>
        <div className="form-group">
          <label className="form-label">Icon (emoji)</label>
          <select className="form-select" value={data.icon} onChange={e => onChange({ ...data, icon: e.target.value })}>
            {COURSE_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <div style={{ fontSize: 28, textAlign: 'center', marginTop: 4 }}>{data.icon}</div>
        </div>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
    </>
  );

  if (loading) return <div className="loading-page"><Spinner /><span>Loading admin panel…</span></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">🛡️ Admin Portal</div>
        <div className="page-sub">Manage courses and monitor student progress</div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 28 }}>
          {[
            { icon: '👥', val: stats.total_users,       label: 'Registered Students', accent: '#457B9D', t: 'students' },
            { icon: '📚', val: stats.total_courses,     label: 'Total Courses',        accent: '#E63946', t: 'courses' },
            { icon: '📋', val: stats.total_enrollments, label: 'Total Enrollments',    accent: '#2DC653', t: 'students' },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ '--card-accent': s.accent, cursor: 'pointer' }} onClick={() => setTab(s.t)}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn btn-sm ${tab === 'courses' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('courses')}>
          📚 Courses ({courses.length})
        </button>
        <button className={`btn btn-sm ${tab === 'students' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('students')}>
          👥 Students ({students.length})
        </button>
      </div>

      {/* ── COURSES TAB ───────────────────────────────────── */}
      {tab === 'courses' && (
        <div className="card">
          <div className="section-header">
            <span className="section-title">📚 Course Catalogue</span>
            <button className="btn btn-primary btn-sm" onClick={() => { setError(''); setForm(emptyForm); setShowModal(true); }}>+ Add Course</button>
          </div>

          {courses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-text">No courses yet. Create your first one!</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>Course</th>
                    <th style={{ padding: '8px 12px' }}>Instructor</th>
                    <th style={{ padding: '8px 12px' }}>Category</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Modules</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Enrolled</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c.color, marginRight: 8 }} />
                        <span style={{ fontWeight: 500 }}>{c.icon} {c.name}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{c.instructor}</td>
                      <td style={{ padding: '10px 12px' }}><span className="badge">{c.category}</span></td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>{c.total_modules}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--alu-green)', fontWeight: 600 }}>{c.enrollment_count}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button className="btn btn-ghost btn-sm" style={{ marginRight: 6 }}
                          onClick={() => { setError(''); setEditModal({ ...c }); }}>✏️ Edit</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--alu-red)' }}
                          onClick={() => setConfirmDelete(c)}>🗑️ Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── STUDENTS TAB ──────────────────────────────────── */}
      {tab === 'students' && (
        <div className="card">
          <div className="section-header">
            <span className="section-title">👥 Registered Students</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{students.length} student{students.length !== 1 ? 's' : ''} total</span>
          </div>

          {students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👤</div>
              <div className="empty-text">No students registered yet.</div>
            </div>
          ) : (
            <div>
              {students.map(s => (
                <div key={s.id} style={{ marginBottom: 4 }}>
                  {/* Student Row */}
                  <div
                    onClick={() => setExpandedStudent(expandedStudent === s.id ? null : s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                      background: expandedStudent === s.id ? 'rgba(230,57,70,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${expandedStudent === s.id ? 'rgba(230,57,70,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #E63946, #F4A261)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: '#fff',
                    }}>
                      {s.avatar_initials}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email}</div>
                    </div>
                    {/* Program & Year */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.program}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Year {s.year}</div>
                    </div>
                    {/* Enrollment count badge */}
                    <div style={{
                      background: s.total_enrolled > 0 ? 'rgba(45,198,83,0.15)' : 'rgba(255,255,255,0.06)',
                      color: s.total_enrolled > 0 ? '#2DC653' : 'var(--text-muted)',
                      borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, flexShrink: 0,
                    }}>
                      {s.total_enrolled} course{s.total_enrolled !== 1 ? 's' : ''}
                    </div>
                    {/* Expand arrow */}
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, transition: 'transform 0.2s', transform: expandedStudent === s.id ? 'rotate(180deg)' : 'none' }}>
                      ▼
                    </div>
                  </div>

                  {/* Expanded enrollment details */}
                  {expandedStudent === s.id && (
                    <div style={{ marginTop: 4, marginLeft: 16, paddingLeft: 16, borderLeft: '2px solid var(--border)' }}>
                      {s.enrollments.length === 0 ? (
                        <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                          📭 This student hasn't enrolled in any courses yet.
                        </div>
                      ) : (
                        <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {s.enrollments.map(e => (
                            <div key={e.course_id} style={{
                              background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                              padding: '10px 14px', border: '1px solid rgba(255,255,255,0.06)',
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: e.course_color }} />
                                  <span style={{ fontWeight: 500, fontSize: 13 }}>{e.course_icon} {e.course_name}</span>
                                  <span className="badge">{e.category}</span>
                                </div>
                                <span style={{ fontWeight: 700, fontSize: 13, color: e.progress >= 100 ? '#2DC653' : e.progress >= 50 ? '#F4A261' : 'var(--text-secondary)' }}>
                                  {e.progress}%
                                </span>
                              </div>
                              {/* Progress bar */}
                              <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${e.progress}%`, background: e.course_color, borderRadius: 3, transition: 'width 0.4s' }} />
                              </div>
                              <div style={{ marginTop: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                                {e.completed_modules} / {e.total_modules} modules completed
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <Modal title="➕ Add New Course" onClose={() => setShowModal(false)}
          actions={<><button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={createCourse} disabled={saving}>{saving ? <Spinner /> : 'Create Course'}</button></>}>
          <CourseForm data={form} onChange={setForm} />
        </Modal>
      )}

      {/* Edit Modal */}
      {editModal && (
        <Modal title={`✏️ Edit: ${editModal.name}`} onClose={() => setEditModal(null)}
          actions={<><button className="btn btn-ghost" onClick={() => setEditModal(null)}>Cancel</button><button className="btn btn-primary" onClick={updateCourse} disabled={saving}>{saving ? <Spinner /> : 'Save Changes'}</button></>}>
          <CourseForm data={editModal} onChange={setEditModal} />
        </Modal>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <Modal title="⚠️ Delete Course" onClose={() => setConfirmDelete(null)}
          actions={<><button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="btn btn-primary" style={{ background: 'var(--alu-red)' }} onClick={() => deleteCourse(confirmDelete.id)}>Yes, Delete</button></>}>
          <p style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete.icon} {confirmDelete.name}</strong>?<br />
            <span style={{ color: 'var(--alu-red)', fontSize: 13 }}>This will also remove all student enrollments for this course.</span>
          </p>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// PAGES
// ══════════════════════════════════════════════════════════

// ── Dashboard ────────────────────────────────────────────
function DashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard', token)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="loading-page"><Spinner /><span>Loading dashboard…</span></div>;
  if (!data) return <div className="page"><p>Failed to load.</p></div>;

  const { stats, weekly_activity, top_skills, active_goals, recent_enrollments, user } = data;

  const STAT_CARDS = [
    { icon: '📚', value: stats.total_courses, label: 'Enrolled Courses', change: '+2 this semester', accent: '#E63946' },
    { icon: '📈', value: `${stats.avg_progress}%`, label: 'Avg. Progress', change: 'Keep going!', accent: '#F4A261' },
    { icon: '⚡', value: stats.activities_this_week, label: 'Activities This Week', change: 'vs last week', accent: '#2DC653' },
    { icon: '⏱️', value: `${stats.study_hours_this_week}h`, label: 'Study Hours (Week)', change: 'Great consistency', accent: '#457B9D' },
    { icon: '🎯', value: stats.total_skills, label: 'Skills Tracked', change: 'Growing portfolio', accent: '#7B2D8B' },
    { icon: '🏆', value: `${stats.completed_goals}/${stats.total_goals}`, label: 'Goals Completed', change: 'Outstanding!', accent: '#F4A261' },
  ];

  const radarData = top_skills.slice(0, 6).map(s => ({ subject: s.name, value: s.level, fullMark: 100 }));

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Welcome back, {user.name.split(' ')[0]} 👋</div>
        <div className="page-sub">Here's your learning progress at a glance</div>
      </div>

      <div className="stats-grid">
        {STAT_CARDS.map((s, i) => (
          <div className="stat-card" key={i} style={{ '--card-accent': s.accent }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-change">{s.change}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Weekly Activity Chart */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">📊 Weekly Study Activity</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekly_activity} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#8b9ab5', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8b9ab5', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f2f8' }}
                labelStyle={{ color: '#f0f2f8' }}
                formatter={(v) => [`${v} min`, 'Study Time']}
              />
              <Bar dataKey="minutes" fill="#E63946" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Skill Radar */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">🕸️ Skills Radar</span>
          </div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#8b9ab5', fontSize: 10 }} />
                <Radar name="Skills" dataKey="value" stroke="#E63946" fill="#E63946" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><div className="empty-text">No skills tracked yet</div></div>}
        </div>
      </div>

      <div className="grid-2">
        {/* Enrolled Courses */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">🎓 Enrolled Courses</span>
          </div>
          {recent_enrollments.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📚</div><div className="empty-text">No courses enrolled</div></div>
          ) : recent_enrollments.map(e => (
            <div key={e.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>{e.course.icon} {e.course.name}</span>
                <span style={{ color: 'var(--text-muted)' }}>{e.progress}%</span>
              </div>
              <ProgressBar value={e.progress} />
            </div>
          ))}
        </div>

        {/* Active Goals */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">🏆 Active Goals</span>
          </div>
          {active_goals.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🎯</div><div className="empty-text">No active goals</div></div>
          ) : active_goals.map(g => (
            <div key={g.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>{g.title}</span>
                <span style={{ color: 'var(--text-muted)' }}>{g.progress}%</span>
              </div>
              <ProgressBar value={g.progress} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Courses ──────────────────────────────────────────────
function CoursesPage() {
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('browse');
  const [progressModal, setProgressModal] = useState(null);
  const [progressVal, setProgressVal] = useState(0);

  const refresh = useCallback(() => {
    Promise.all([api.get('/courses', token), api.get('/courses/enrolled', token)])
      .then(([c, e]) => { setCourses(c.data.courses); setEnrollments(e.data.enrollments); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  const enroll = async (courseId) => {
    await api.post(`/courses/${courseId}/enroll`, {}, token);
    refresh();
  };

  const updateProgress = async () => {
    if (!progressModal) return;
    const modCount = Math.round((progressVal / 100) * progressModal.total_modules);
    await api.put(`/courses/${progressModal.course_id}/progress`, { completed_modules: modCount }, token);
    setProgressModal(null);
    refresh();
  };

  if (loading) return <div className="loading-page"><Spinner /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">📚 Courses</div>
        <div className="page-sub">Browse and manage your learning journey</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['browse', 'enrolled'].map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)}>
            {t === 'browse' ? '🌐 All Courses' : `📋 Enrolled (${enrollments.length})`}
          </button>
        ))}
      </div>

      {tab === 'browse' ? (
        <div className="grid-auto">
          {courses.map(c => (
            <div key={c.id} className="course-card" style={{ '--course-color': c.color }}>
              <div className="course-icon">{c.icon}</div>
              <div className="course-name">{c.name}</div>
              <div className="course-instructor">👤 {c.instructor}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>{c.description}</div>
              <div className="course-meta">
                <span className="badge">{c.category}</span>
                <span className="badge">{c.total_modules} modules</span>
                {c.enrolled && <span className="badge enrolled">✓ Enrolled</span>}
              </div>
              {!c.enrolled && (
                <button className="btn btn-primary btn-sm" style={{ marginTop: 14, width: '100%' }} onClick={() => enroll(c.id)}>
                  + Enroll Now
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div>
          {enrollments.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📚</div><div className="empty-text">No courses enrolled yet. Browse courses to get started!</div></div>
          ) : (
            <div className="grid-auto">
              {enrollments.map(e => (
                <div key={e.id} className="course-card" style={{ '--course-color': e.course.color }}>
                  <div className="course-icon">{e.course.icon}</div>
                  <div className="course-name">{e.course.name}</div>
                  <div className="course-instructor">👤 {e.course.instructor}</div>
                  <div className="course-progress-label">
                    <span>Progress</span><span style={{ color: 'var(--alu-green)', fontWeight: 600 }}>{e.progress}%</span>
                  </div>
                  <ProgressBar value={e.progress} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                    {e.completed_modules} / {e.total_modules} modules completed
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 12, width: '100%' }}
                    onClick={() => { setProgressModal(e); setProgressVal(e.progress); }}>
                    Update Progress
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {progressModal && (
        <Modal title={`Update: ${progressModal.course.name}`} onClose={() => setProgressModal(null)}
          actions={<><button className="btn btn-ghost" onClick={() => setProgressModal(null)}>Cancel</button><button className="btn btn-primary" onClick={updateProgress}>Save</button></>}>
          <div className="form-group">
            <label className="form-label">Completion Percentage: {progressVal}%</label>
            <input type="range" min="0" max="100" step="5" value={progressVal}
              onChange={e => setProgressVal(+e.target.value)}
              style={{ width: '100%', accentColor: 'var(--alu-red)', cursor: 'pointer' }} />
          </div>
          <div style={{ marginTop: 10 }}><ProgressBar value={progressVal} /></div>
        </Modal>
      )}
    </div>
  );
}

// ── Activities ───────────────────────────────────────────
function ActivitiesPage() {
  const { token } = useAuth();
  const [activities, setActivities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', activity_type: 'Study', duration_mins: 30, course_id: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const ACTIVITY_ICONS = { Study: '📖', Assignment: '✏️', Project: '💼', Reading: '📰', Quiz: '🧩', Other: '💡' };
  const ACTIVITY_COLORS = { Study: '#457B9D', Assignment: '#F4A261', Project: '#E63946', Reading: '#2DC653', Quiz: '#7B2D8B', Other: '#8b9ab5' };

  const refresh = useCallback(() => {
    Promise.all([api.get('/activities', token), api.get('/courses', token)])
      .then(([a, c]) => { setActivities(a.data.activities); setCourses(c.data.courses); })
      .catch(console.error).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  const submit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/activities', { ...form, course_id: form.course_id || null }, token);
      setShowModal(false);
      setForm({ title: '', activity_type: 'Study', duration_mins: 30, course_id: '', notes: '' });
      refresh();
    } catch (e) { setError('Failed to save activity'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    await api.del(`/activities/${id}`, token);
    refresh();
  };

  const formatDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formatTime = d => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Group by date
  const grouped = activities.reduce((acc, a) => {
    const key = new Date(a.date).toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const totalMinutes = activities.slice(0, 30).reduce((s, a) => s + a.duration_mins, 0);

  if (loading) return <div className="loading-page"><Spinner /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">⚡ Learning Activities</div>
        <div className="page-sub">Track your day-to-day learning sessions</div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="stat-card" style={{ '--card-accent': '#E63946' }}>
          <div className="stat-icon">📝</div>
          <div className="stat-value">{activities.length}</div>
          <div className="stat-label">Total Activities</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#F4A261' }}>
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{Math.round(totalMinutes / 60)}h</div>
          <div className="stat-label">Total Study Time</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#2DC653' }}>
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{activities.length > 0 ? Math.round(totalMinutes / activities.length) : 0}m</div>
          <div className="stat-label">Avg. Session</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Log Activity</button>
      </div>

      <div className="card">
        {Object.keys(grouped).length === 0 ? (
          <div className="empty-state"><div className="empty-icon">⚡</div><div className="empty-text">No activities logged yet. Start tracking your learning!</div></div>
        ) : Object.entries(grouped).map(([date, acts]) => (
          <div key={date} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
              {formatDate(acts[0].date)}
            </div>
            {acts.map(a => (
              <div key={a.id} className="activity-item">
                <div className="activity-icon" style={{ background: `${ACTIVITY_COLORS[a.activity_type]}20`, color: ACTIVITY_COLORS[a.activity_type] }}>
                  {ACTIVITY_ICONS[a.activity_type] || '💡'}
                </div>
                <div className="activity-body">
                  <div className="activity-title">{a.title}</div>
                  <div className="activity-meta">
                    {a.activity_type} {a.course_name ? `· ${a.course_name}` : ''} · {formatTime(a.date)}
                    {a.notes && <span style={{ display: 'block', marginTop: 2, fontStyle: 'italic' }}>{a.notes}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="activity-duration">{a.duration_mins}m</span>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => del(a.id)} style={{ color: 'var(--alu-red)', border: 'none' }}>×</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title="Log Learning Activity" onClose={() => setShowModal(false)}
          actions={<><button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? <Spinner /> : 'Save Activity'}</button></>}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="e.g. Binary Trees Study Session" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.activity_type} onChange={e => setForm({ ...form, activity_type: e.target.value })}>
                {['Study', 'Assignment', 'Project', 'Reading', 'Quiz', 'Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <input className="form-input" type="number" min="5" max="480" step="5" value={form.duration_mins} onChange={e => setForm({ ...form, duration_mins: +e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Linked Course (optional)</label>
            <select className="form-select" value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })}>
              <option value="">— None —</option>
              {courses.filter(c => c.enrolled).map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-textarea" placeholder="What did you learn?" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Skills ───────────────────────────────────────────────
const SKILL_COLORS = ['#E63946', '#F4A261', '#2DC653', '#457B9D', '#7B2D8B', '#F72585', '#3776AB', '#2A9D8F', '#F7DF1E', '#61DAFB'];

function SkillsPage() {
  const { token } = useAuth();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState({ name: '', level: 50, category: 'Technical', color: '#E63946' });
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => {
    api.get('/skills', token).then(r => setSkills(r.data.skills)).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.post('/skills', form, token);
      setShowModal(false);
      setForm({ name: '', level: 50, category: 'Technical', color: '#E63946' });
      refresh();
    } finally { setSaving(false); }
  };

  const update = async () => {
    if (!editModal) return;
    await api.put(`/skills/${editModal.id}`, { level: editModal.level, name: editModal.name }, token);
    setEditModal(null);
    refresh();
  };

  const del = async (id) => {
    await api.del(`/skills/${id}`, token);
    refresh();
  };

  const categories = ['Technical', 'Soft Skills', 'Leadership'];
  const byCategory = categories.reduce((acc, cat) => {
    acc[cat] = skills.filter(s => s.category === cat);
    return acc;
  }, {});

  const radarData = skills.slice(0, 8).map(s => ({ subject: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name, value: s.level }));

  const getLevelLabel = l => l >= 90 ? 'Expert' : l >= 75 ? 'Advanced' : l >= 50 ? 'Intermediate' : l >= 25 ? 'Beginner' : 'Novice';

  if (loading) return <div className="loading-page"><Spinner /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">🎯 Skills Tracker</div>
        <div className="page-sub">Visualize and grow your skill portfolio</div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-header">
            <span className="section-title">Skills Overview</span>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Add Skill</button>
          </div>
          {skills.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🎯</div><div className="empty-text">No skills added yet</div></div>
          ) : skills.map(s => (
            <div key={s.id} className="skill-item" onClick={() => setEditModal({ ...s })}>
              <div className="skill-header">
                <span className="skill-name" style={{ cursor: 'pointer' }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: s.color, marginRight: 8 }} />
                  {s.name}
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge" style={{ fontSize: 10 }}>{getLevelLabel(s.level)}</span>
                  <span className="skill-level">{s.level}%</span>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={e => { e.stopPropagation(); del(s.id); }} style={{ color: 'var(--alu-red)', border: 'none', width: 24, height: 24 }}>×</button>
                </div>
              </div>
              <div className="skill-bar">
                <div className="skill-bar-fill" style={{ width: `${s.level}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>Skills Radar</div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#8b9ab5', fontSize: 10 }} />
                <Radar dataKey="value" stroke="#E63946" fill="#E63946" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={{ background: '#111520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f2f8' }} formatter={(v) => [`${v}%`, '']} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><div className="empty-text">Add skills to see the radar chart</div></div>}

          {/* Category breakdown */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <div key={cat} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{cat}</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{byCategory[cat].length}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title="Add New Skill" onClose={() => setShowModal(false)}
          actions={<><button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? <Spinner /> : 'Add Skill'}</button></>}>
          <div className="form-group">
            <label className="form-label">Skill Name *</label>
            <input className="form-input" placeholder="e.g. Python, Leadership, SQL…" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <select className="form-select" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}>
                {SKILL_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Current Level: {form.level}% ({getLevelLabel(form.level)})</label>
            <input type="range" min="0" max="100" step="5" value={form.level}
              onChange={e => setForm({ ...form, level: +e.target.value })}
              style={{ width: '100%', accentColor: form.color, cursor: 'pointer' }} />
          </div>
        </Modal>
      )}

      {editModal && (
        <Modal title={`Edit: ${editModal.name}`} onClose={() => setEditModal(null)}
          actions={<><button className="btn btn-ghost" onClick={() => setEditModal(null)}>Cancel</button><button className="btn btn-primary" onClick={update}>Update</button></>}>
          <div className="form-group">
            <label className="form-label">Skill Name</label>
            <input className="form-input" value={editModal.name} onChange={e => setEditModal({ ...editModal, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Level: {editModal.level}% ({getLevelLabel(editModal.level)})</label>
            <input type="range" min="0" max="100" step="5" value={editModal.level}
              onChange={e => setEditModal({ ...editModal, level: +e.target.value })}
              style={{ width: '100%', accentColor: editModal.color, cursor: 'pointer' }} />
          </div>
          <div style={{ marginTop: 8 }}>
            <div className="skill-bar" style={{ height: 12 }}>
              <div className="skill-bar-fill" style={{ width: `${editModal.level}%`, background: editModal.color }} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Goals ─────────────────────────────────────────────────
function GoalsPage() {
  const { token } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', target_date: '', category: 'Academic', progress: 0 });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const refresh = useCallback(() => {
    api.get('/goals', token).then(r => setGoals(r.data.goals)).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await api.post('/goals', form, token);
      setShowModal(false);
      setForm({ title: '', description: '', target_date: '', category: 'Academic', progress: 0 });
      refresh();
    } finally { setSaving(false); }
  };

  const update = async () => {
    if (!updateModal) return;
    await api.put(`/goals/${updateModal.id}`, { progress: updateModal.progress, status: updateModal.status }, token);
    setUpdateModal(null);
    refresh();
  };

  const del = async (id) => { await api.del(`/goals/${id}`, token); refresh(); };

  const daysLeft = d => {
    if (!d) return null;
    const diff = new Date(d) - new Date();
    const days = Math.ceil(diff / 86400000);
    return days > 0 ? `${days}d left` : days === 0 ? 'Due today!' : `${Math.abs(days)}d overdue`;
  };

  const filtered = filter === 'all' ? goals : goals.filter(g => g.status === filter);

  const stats = {
    total: goals.length,
    completed: goals.filter(g => g.status === 'completed').length,
    active: goals.filter(g => g.status === 'active').length,
    avgProgress: goals.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0,
  };

  if (loading) return <div className="loading-page"><Spinner /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">🏆 Goals</div>
        <div className="page-sub">Set targets and track your academic journey</div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { icon: '🎯', val: stats.total, label: 'Total Goals', accent: '#E63946' },
          { icon: '✅', val: stats.completed, label: 'Completed', accent: '#2DC653' },
          { icon: '⏳', val: stats.active, label: 'In Progress', accent: '#F4A261' },
          { icon: '📊', val: `${stats.avgProgress}%`, label: 'Avg Progress', accent: '#457B9D' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ '--card-accent': s.accent }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'active', 'completed', 'paused'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Goal</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🏆</div><div className="empty-text">No {filter !== 'all' ? filter : ''} goals yet</div></div>
      ) : (
        <div className="grid-auto">
          {filtered.map(g => (
            <div key={g.id} className="goal-card">
              <div className="goal-header">
                <div>
                  <div className="goal-title">{g.title}</div>
                  {g.description && <div className="goal-desc">{g.description}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span className={`goal-status ${g.status}`}>{g.status}</span>
                  <span className="badge">{g.category}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                <span>Progress</span>
                <span style={{ color: g.progress === 100 ? 'var(--alu-green)' : 'var(--text-secondary)', fontWeight: 600 }}>{g.progress}%</span>
              </div>
              <ProgressBar value={g.progress} />

              <div className="goal-footer">
                <span>{g.target_date ? daysLeft(g.target_date) : 'No deadline'}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setUpdateModal({ ...g })}>Update</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--alu-red)' }} onClick={() => del(g.id)}>×</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Create New Goal" onClose={() => setShowModal(false)}
          actions={<><button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? <Spinner /> : 'Create Goal'}</button></>}>
          <div className="form-group">
            <label className="form-label">Goal Title *</label>
            <input className="form-input" placeholder="e.g. Complete Machine Learning course" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="What does success look like?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {['Academic', 'Skill', 'Career', 'Leadership', 'Personal'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Target Date</label>
              <input className="form-input" type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Starting Progress: {form.progress}%</label>
            <input type="range" min="0" max="100" step="5" value={form.progress}
              onChange={e => setForm({ ...form, progress: +e.target.value })}
              style={{ width: '100%', accentColor: 'var(--alu-red)', cursor: 'pointer' }} />
          </div>
        </Modal>
      )}

      {updateModal && (
        <Modal title={`Update: ${updateModal.title}`} onClose={() => setUpdateModal(null)}
          actions={<><button className="btn btn-ghost" onClick={() => setUpdateModal(null)}>Cancel</button><button className="btn btn-primary" onClick={update}>Save</button></>}>
          <div className="form-group">
            <label className="form-label">Progress: {updateModal.progress}%</label>
            <input type="range" min="0" max="100" step="5" value={updateModal.progress}
              onChange={e => setUpdateModal({ ...updateModal, progress: +e.target.value })}
              style={{ width: '100%', accentColor: 'var(--alu-red)', cursor: 'pointer' }} />
          </div>
          <div style={{ marginBottom: 16 }}><ProgressBar value={updateModal.progress} /></div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={updateModal.status} onChange={e => setUpdateModal({ ...updateModal, status: e.target.value })}>
              {['active', 'completed', 'paused'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Auth Pages ─────────────────────────────────────────────
function LoginPage({ onSwitch }) {
  const { login } = useAuth();
  const { navigate } = { navigate: () => {} };
  const [form, setForm] = useState({ email: 'demo@alu.edu', password: 'demo1234' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await login(form.email, form.password); }
    catch (err) { setError(err.response?.data?.error || 'Login failed. Make sure the backend is running.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-bg-grid" />
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">ALU</div>
          <div className="auth-logo-title">Smart Tracker</div>
          <div className="auth-logo-sub">African Leadership University</div>
        </div>
        <div className="auth-title">Welcome back</div>
        <div className="auth-sub">Sign in to continue your learning journey</div>
        <div className="demo-hint">
          Demo: <strong>demo@alu.edu</strong> / <strong>demo1234</strong>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input id="login-email" className="form-input" type="email" placeholder="you@alu.edu" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="login-password" className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <button id="login-submit" className="btn btn-primary" style={{ width: '100%', padding: 14 }} disabled={loading}>
            {loading ? <Spinner /> : 'Sign In →'}
          </button>
        </form>
        <div className="auth-switch">Don't have an account? <a onClick={onSwitch}>Create one</a></div>
      </div>
    </div>
  );
}

function RegisterPage({ onSwitch }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', program: 'Software Engineering', year: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError('All fields are required'); return; }
    setLoading(true); setError('');
    try { await register(form.name, form.email, form.password, form.program, form.year); }
    catch (err) { setError(err.response?.data?.error || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const PROGRAMS = ['Software Engineering', 'Business Administration', 'Data Science', 'Entrepreneurship', 'International Business'];

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-bg-grid" />
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">ALU</div>
          <div className="auth-logo-title">Create Account</div>
          <div className="auth-logo-sub">Join the ALU Learning Platform</div>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input id="reg-name" className="form-input" placeholder="Amara Diallo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input id="reg-email" className="form-input" type="email" placeholder="you@alu.edu" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="reg-password" className="form-input" type="password" placeholder="At least 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Program</label>
              <select className="form-select" value={form.program} onChange={e => setForm({ ...form, program: e.target.value })}>
                {PROGRAMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Year</label>
              <select className="form-select" value={form.year} onChange={e => setForm({ ...form, year: +e.target.value })}>
                {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>
          <button id="reg-submit" className="btn btn-primary" style={{ width: '100%', padding: 14 }} disabled={loading}>
            {loading ? <Spinner /> : 'Create Account →'}
          </button>
        </form>
        <div className="auth-switch">Already have an account? <a onClick={onSwitch}>Sign in</a></div>
      </div>
    </div>
  );
}

// ── Root App ─────────────────────────────────────────────
function App() {
  const { user, loading } = useAuth();
  const { route, navigate } = useRoute();
  const [authPage, setAuthPage] = useState('login');

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" style={{ width: 48, height: 48, borderWidth: 3 }} />
        <span style={{ color: 'var(--text-muted)', marginTop: 12 }}>Loading ALU Tracker…</span>
      </div>
    );
  }

  if (!user) {
    return authPage === 'login'
      ? <LoginPage onSwitch={() => setAuthPage('register')} />
      : <RegisterPage onSwitch={() => setAuthPage('login')} />;
  }

  const renderPage = () => {
    if (user?.is_admin) {
      switch (route) {
        case '/admin':   return <AdminPortalPage />;
        case '/courses': return <CoursesPage />;
        default:         return <AdminPortalPage />;
      }
    }
    switch (route) {
      case '/':           return <DashboardPage />;
      case '/courses':    return <CoursesPage />;
      case '/activities': return <ActivitiesPage />;
      case '/skills':     return <SkillsPage />;
      case '/goals':      return <GoalsPage />;
      default:            return <DashboardPage />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar route={route} navigate={navigate} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

// Mount
console.log("🔥 Attempting to mount React root...");
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("❌ CRITICAL: Root element not found!");
} else {
  console.log("✅ Root element found:", rootElement);
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );
    console.log("✅ Render called successfully");
  } catch (err) {
    console.error("❌ React Render Error:", err);
  }
}
