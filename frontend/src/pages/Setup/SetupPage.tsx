/**
 * SetupPage — First-run admin account creation wizard.
 *
 * This page is shown when the backend reports no users exist yet
 * (GET /api/v1/auth/admin-exists returns { exists: false }).
 * After the admin account is created, the user is automatically
 * logged in and redirected to the dashboard.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';

interface SetupForm {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
}

export function SetupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState<SetupForm>({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    full_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'creating' | 'done'>('form');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setStep('creating');

    try {
      // Register the admin account
      await apiClient.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: 'ADMIN',
      });

      // Auto-login
      const loginResp = await apiClient.post('/auth/login', {
        username: form.username,
        password: form.password,
      });

      setStep('done');
      await login(loginResp.data);
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Setup failed. Please try again.';
      setError(msg);
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      {/* Background glow orbs */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoQ}>Q</div>
        </div>

        <h1 style={styles.title}>Welcome to Qasim Inventory</h1>
        <p style={styles.subtitle}>
          Create your admin account to get started. This only appears once.
        </p>

        {step === 'creating' && (
          <div style={styles.progressWrap}>
            <div style={styles.spinner} />
            <p style={styles.progressText}>Creating your account…</p>
          </div>
        )}

        {step !== 'creating' && (
          <form onSubmit={handleSubmit} style={styles.form} autoComplete="off">
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                id="setup-fullname"
                name="full_name"
                type="text"
                required
                value={form.full_name}
                onChange={handleChange}
                placeholder="Qasim Ali"
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Username</label>
              <input
                id="setup-username"
                name="username"
                type="text"
                required
                value={form.username}
                onChange={handleChange}
                placeholder="admin"
                style={styles.input}
                autoComplete="username"
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email</label>
              <input
                id="setup-email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                style={styles.input}
                autoComplete="email"
              />
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.fieldGroup, flex: 1 }}>
                <label style={styles.label}>Password</label>
                <input
                  id="setup-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  style={styles.input}
                  autoComplete="new-password"
                />
              </div>
              <div style={{ ...styles.fieldGroup, flex: 1 }}>
                <label style={styles.label}>Confirm Password</label>
                <input
                  id="setup-confirm"
                  name="confirm_password"
                  type="password"
                  required
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  style={styles.input}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <button
              id="setup-submit"
              type="submit"
              disabled={loading}
              style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
            >
              {loading ? 'Creating…' : 'Create Admin Account & Start'}
            </button>
          </form>
        )}

        <p style={styles.footer}>
          Qasim Inventory v1.0 &nbsp;·&nbsp; Your data stays on this computer
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
      `}</style>
    </div>
  );
}

// ---------- inline styles ----------
const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f1117 0%, #1a1d2e 50%, #0f1117 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', system-ui, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    top: '-10%',
    left: '-10%',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(234,179,8,0.12) 0%, transparent 70%)',
    animation: 'pulse 6s ease-in-out infinite',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute',
    bottom: '-15%',
    right: '-10%',
    width: 600,
    height: 600,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)',
    animation: 'pulse 8s ease-in-out infinite 2s',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: '48px 48px 36px',
    maxWidth: 560,
    width: '90%',
    boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
    animation: 'fadeIn 0.5s ease',
  },
  logoWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoQ: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 36,
    fontWeight: 700,
    color: '#0f1117',
    boxShadow: '0 0 32px rgba(245,158,11,0.4), 0 8px 24px rgba(0,0,0,0.4)',
  },
  title: {
    textAlign: 'center',
    fontSize: 26,
    fontWeight: 700,
    color: '#f8fafc',
    margin: '0 0 8px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(248,250,252,0.55)',
    margin: '0 0 32px',
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  row: {
    display: 'flex',
    gap: 16,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: 'rgba(248,250,252,0.7)',
    letterSpacing: '0.02em',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: '#f8fafc',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  errorBox: {
    padding: '10px 14px',
    borderRadius: 10,
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#fca5a5',
    fontSize: 13,
    lineHeight: 1.4,
  },
  btn: {
    marginTop: 8,
    padding: '14px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#0f1117',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.15s',
    letterSpacing: '0.01em',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    transform: 'none',
  },
  progressWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    padding: '32px 0',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid rgba(245,158,11,0.2)',
    borderTop: '3px solid #f59e0b',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  progressText: {
    color: 'rgba(248,250,252,0.6)',
    fontSize: 14,
  },
  footer: {
    textAlign: 'center',
    marginTop: 28,
    fontSize: 12,
    color: 'rgba(248,250,252,0.3)',
  },
};
