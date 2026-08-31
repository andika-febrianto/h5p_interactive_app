import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="topbar">
      <div className="topbar-brand" onClick={() => { if (!user) navigate('/'); }} role={user ? undefined : 'button'} tabIndex={user ? undefined : 0} style={{ cursor: user ? 'default' : 'pointer' }}>
        <span className="topbar-logo">📚</span>
        <span className="topbar-title">Perpustakaan Belajar</span>
      </div>
      {user && (
        <div className="topbar-operator">
          <span className="topbar-operator-avatar">{user.name.charAt(0).toUpperCase()}</span>
          <span className="topbar-operator-name">{user.name}</span>
          <span className="topbar-operator-role">{user.role === 'TEACHER' ? 'Operator' : 'Murid'}</span>
        </div>
      )}
    </div>
  );
}
