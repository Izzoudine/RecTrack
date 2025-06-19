import { Outlet } from 'react-router-dom';
import { LayoutDashboard, UserCheck, Shield } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 to-secondary-50">
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex items-center">
          <div className="flex items-center space-x-2 text-primary-600">
          <Shield className="h-6 w-6" style={{ stroke: '#00a551' }} />
            <span className="text-xl font-semibold">RecTrack</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <div  className="rounded-full p-4 text-white"style={{ backgroundColor: '#00a551' }}>
                <UserCheck className="h-10 w-10" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des recommandations</h1>
            <p className="text-gray-600">Suivi et gestion des recommandations par département</p>
          </div>
          
          <Outlet />
        </div>
      </main>
      
    </div>
  );
};

export default AuthLayout;