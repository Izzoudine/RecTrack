import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gray-50">
      <div className="text-center max-w-lg">
        <div className="flex justify-center mb-6">
          <div className="bg-warning-100 rounded-full p-4 text-warning-600">
            <AlertTriangle className="h-12 w-12" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page non trouvée        </h2>
        <p className="text-gray-600 mb-8">
        La page que vous recherchez n'existe pas ou a été déplacée
        </p>
        
        <Link to="/" className="btn btn-primary">
        Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;