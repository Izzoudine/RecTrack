import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Clipboard, LogOut, Menu, X, Shield } from 'lucide-react';

const UserLayout = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/user', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Tableau de bord' },
    { to: '/user/recommendations', icon: <Clipboard className="h-5 w-5" />, label: 'Recommandations' },
  ];

  const navClasses = {
    active: "bg-[#1564b1] text-white",
    inactive: "text-[#a0c4ff] hover:bg-[#1564b1]/50 hover:text-white"
  };
  

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-secondary-800 py-4 md:hidden">
        <div className="px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-white">
          <Shield className="h-6 w-6" style={{ stroke: '#00a551' }} />
            <span className="text-xl font-semibold">RecTrack</span>
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
        } md:block bg-secondary-800 md:w-64 md:flex-shrink-0 md:sticky md:top-0 md:h-screen overflow-y-auto transition-transform duration-300 ease-in-out`}
      >
        <div className="p-4">
          <div className="flex items-center space-x-2 text-white mb-6 pt-2 md:pt-6">
          <Shield className="h-6 w-6" style={{ stroke: '#00a551' }} />
            <span className="text-xl font-bold">RecTrack</span>
          </div>
          
          <div className="mb-8">
            <div className="px-4 py-2 text-sm text-secondary-100 uppercase font-semibold">
            Portail utilisateur
            </div>
          </div>
          
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/user'}
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
        
        <div className="mt-auto p-4 border-t border-secondary-700">
          <div className="flex items-center px-4 py-2">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-secondary-600 flex items-center justify-center text-white font-semibold">
                {profile?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{profile?.name}</p>
              <p className="text-xs font-medium text-secondary-200">Utilisateur</p>
            </div>
          </div>
          <button
  onClick={handleLogout}
  className="mt-2 flex items-center w-full px-4 py-2 text-sm font-medium rounded-md transition-colors"
  style={{ color: '#a0c4ff' }} // lighter blue text similar to secondary-100
  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(21, 100, 177, 0.5)'} // #1564b1 at 50% opacity
  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
>
  <LogOut className="h-5 w-5 mr-3" style={{ stroke: '#1564b1' }} />
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

export default UserLayout;