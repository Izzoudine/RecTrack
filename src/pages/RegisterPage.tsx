import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, KeyRound, AlertCircle, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { departments, signUp } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    departmentId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!formData.email || !formData.password || !formData.name || !formData.departmentId) {
      setError('Veuillez remplir tous les champs');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setIsLoading(false);
      return;
    }

    try {
      await signUp(formData.email, formData.password, formData.name, formData.departmentId);
      navigate('/login');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during registration';
      setError(errorMessage);
      console.error('Registration error:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="card shadow-md animate-fade-in max-w-md w-full mx-auto">
      <div className="p-6">
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">Créer un compte</h2>

        {error && (
          <div className="mb-4 bg-error-50 text-error-700 p-3 rounded-md flex items-center text-sm">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="label">
            Nom Complet
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="h-5 w-5" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="input pl-10"
                placeholder="Saisissez votre nom complet"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="label">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="h-5 w-5" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="input pl-10"
                placeholder="Saisissez votre email"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="departmentId" className="label">
            Département
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Building2 className="h-5 w-5" />
              </div>
              <select
                id="departmentId"
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="input pl-10"
              >
                <option value="">Sélectionnez un département                </option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.acronym})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="label">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="input pl-10"
                placeholder="Créer un mot de passe"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="label">
            Confirmez le mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input pl-10"
                placeholder="Confirmez le mot de passe"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoading}
            >
           {isLoading ? 'Création du compte...' : 'Créer un compte'}            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
          Vous avez déjà un compte ?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;