import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, Building2, Clipboard, LogOut, Menu, X, Shield,CheckCircle } from 'lucide-react';

const AdminLayout = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const navItems = [
    
    { to: '/admin', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Tableau de bord' },
    { to: '/admin/missions', icon: <Clipboard className="h-5 w-5" />, label: 'Missions' },
    { to: '/admin/validations', icon: <CheckCircle className="h-5 w-5" />, label: 'Verifications' },
    { to: '/admin/users', icon: <Users className="h-5 w-5" />, label: 'Utilisateurs' },
    { to: '/admin/departments', icon: <Building2 className="h-5 w-5" />, label: 'Départements' },
  
  ];

  const navClasses = {
    active: "bg-[#00a551] text-white",
    inactive: "text-primary-100 hover:bg-[#00a551]/50 hover:text-white"
  };
  

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-primary-800 py-4 md:hidden">
  <div className="px-4 flex justify-between items-center">
    <div className="flex items-center space-x-2 text-white">
      {/* Shield icon with stroke color #00a551 */}
      <Shield className="h-6 w-6" style={{ stroke: '#00a551' }} />
      {/* RecTrack text with font-semibold and color #00a551 */}
      <span className="text-xl font-semibold" style={{ color: '#00a551' }}>
        RecTrack
      </span>
    </div>
    <button 
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
      className="text-white p-2"
    >
      {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
    </button>
  </div>
</header>


      {/* Sidebar */}
      <aside
  className={`${
    mobileMenuOpen ? 'block' : 'hidden'
  } md:block md:w-64 md:flex-shrink-0 md:sticky md:top-0 md:h-screen overflow-y-auto transition-transform duration-300 ease-in-out bg-[#1564b1]`}
>

        <div className="p-4">
          <div className="flex items-center space-x-2 text-white mb-6 pt-2 md:pt-6">
            <Shield className="h-8 w-8" />
            <span className="text-xl font-bold">RecTrack</span>
          </div>
          
          <div className="mb-8">
            <div className="px-4 py-2 text-sm text-primary-100 uppercase font-semibold">
            Portail Administrateur
            </div>
          </div>
          
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors
                  ${isActive ? navClasses.active : navClasses.inactive}
                `}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-4 border-t border-primary-700">
          <div className="flex items-center px-4 py-2">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                {profile?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{profile?.name}</p>
              <p className="text-xs font-medium text-primary-200">Administrateur</p>
            </div>
          </div>
          <button
  onClick={handleLogout}
  className="mt-2 flex items-center w-full px-4 py-2 text-sm font-medium rounded-md transition-colors"
  style={{ color: '#d1fae5' }} // light greenish text similar to text-primary-100
  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#00a551'}
  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
>
  <LogOut className="h-5 w-5 mr-3"  />
  Déconnexion
</button>

        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 py-6 px-4 md:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;