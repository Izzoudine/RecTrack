import { format } from 'date-fns';
import { useState } from 'react';
import { Recommendation, Department } from '../contexts/AuthContext';
import StatusBadge from './StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { 
  CalendarDays, 
  Info, 
  CheckCircle2, 
  Pencil, 
  Trash2, 
  X,
  Save
} from 'lucide-react';

interface RecommendationCardProps {
  recommendation: Recommendation;
  department?: Department | null;
  userName?: string;
  onStatusChange?: (id: string, status: Recommendation['status'], completedAt?: string) => void;
  onUpdate?: (id: string, data: Partial<Recommendation>) => void;
  onDelete?: (id: string) => void;
}

const RecommendationCard = ({ 
  recommendation, 
  department, 
  userName,
  onStatusChange,
  onUpdate,
  onDelete
}: RecommendationCardProps) => {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // Added for loading state
  const [editData, setEditData] = useState({
    title: recommendation.title,
    description: recommendation.description,
    deadline: recommendation.deadline ?? ''
  });
  
  const handleMarkComplete = async () => {
    if (onStatusChange) {
      setIsUpdating(true);
      try {
        await onStatusChange(recommendation.id, 'completed', new Date().toISOString());
      } catch (error) {
        console.error('Failed to mark as complete:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleSave = () => {
    if (onUpdate && isAdmin) {
      onUpdate(recommendation.id, editData);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete && isAdmin && window.confirm('Êtes-vous sûr de vouloir supprimer cette recommandation ?')) {
      onDelete(recommendation.id);
    }
  };
  
  const isOverdue = recommendation.deadline && 
  new Date(recommendation.deadline) < new Date() && 
  recommendation.status === 'in_progress';

  // Fixed: Properly check for both admin and chief roles
  const isAdmin = profile?.role === 'admin' || profile?.role === 'chief';
  
  return (
    <div className={`card transition-all duration-300 hover:shadow-md ${
      isOverdue ? 'border-error-300' : ''
    }`}>
      <div className="p-4">
        <div className="flex justify-between items-start">
          {isEditing && isAdmin ? (
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="input mb-2"
              placeholder="Titre de la recommandation"
            />
          ) : (
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {recommendation.title}
            </h3>
          )}
          <div className="flex items-center space-x-2">
            <StatusBadge status={recommendation.status} />
            {isAdmin && (
              <div className="flex space-x-1">
                {isEditing ? (
                  <>
                    <button 
                      onClick={handleSave}
                      className="p-1 text-success-600 hover:text-success-700"
                      title="Enregistrer les modifications"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="p-1 text-gray-600 hover:text-gray-700"
                      title="Annuler l'édition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="p-1 text-primary-600 hover:text-primary-700"
                      title="Modifier la recommandation"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={handleDelete}
                      className="p-1 text-error-600 hover:text-error-700"
                      title="Supprimer la recommandation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        {department && (
          <div className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-800 mb-2">
            {department.acronym}
          </div>
        )}
        
        {isEditing && isAdmin ? (
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="input mb-3"
            placeholder="Description de la recommandation"
            rows={3}
          />
        ) : (
          <p className="text-gray-600 text-sm mb-3">
            {recommendation.description}
          </p>
        )}
        
        <div className="border-t border-gray-100 pt-3 mt-2">
          <div className="flex flex-wrap gap-y-2">
            <div className="w-full sm:w-1/2 flex items-center text-sm text-gray-500">
              <CalendarDays className="h-4 w-4 mr-1 text-gray-400" />
              {isEditing && isAdmin ? (
                <input
                  type="date"
                  value={editData.deadline}
                  onChange={(e) => setEditData({ ...editData, deadline: e.target.value })}
                  className="input py-0 px-1 text-sm"
                />
              ) : (
                <span>
                Date limite: {recommendation.deadline 
                  ? format(new Date(recommendation.deadline), 'MMM d, yyyy') 
                  : 'No deadline set'}
              </span> )}
            </div>
            
            {userName && (
              <div className="w-full sm:w-1/2 flex items-center text-sm text-gray-500">
                <Info className="h-4 w-4 mr-1 text-gray-400" />
                <span>Assigné à : {userName}</span>
              </div>
            )}
            
            {recommendation.completedAt && (
              <div className="w-full sm:w-1/2 flex items-center text-sm text-success-600">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                <span>Terminé: {format(new Date(recommendation.completedAt), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </div>
        
        {profile?.role === 'user' && 
         recommendation.status === 'in_progress' && 
         recommendation.userId === profile.id && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button 
              onClick={handleMarkComplete}
              className="btn btn-sm btn-success w-full"
              disabled={isUpdating}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {isUpdating ? 'Mise à jour...' : 'Marquer comme terminé'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationCard;