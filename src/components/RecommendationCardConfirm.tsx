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
  Save,
  Shield,
  User,
  Clock
} from 'lucide-react';

interface RecommendationCardProps {
  recommendation: Recommendation;
  department?: Department | null;
  userName?: string;
  onStatusChange?: (id: string, status: Recommendation['status'], confirmedAt?: string) => void;
  onUpdate?: (id: string, data: Partial<Recommendation>) => void;
  onDelete?: (id: string) => void;
  onConfirm?: (id: string) => void;
}

const RecommendationCard = ({ 
  recommendation, 
  department, 
  userName,
  onStatusChange,
  onUpdate,
  onDelete,
  onConfirm
}: RecommendationCardProps) => {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [editData, setEditData] = useState({
    title: recommendation.title,
    description: recommendation.description,
    deadline: recommendation.deadline ?? ''
  });
  
  const handleConfirm = async () => {
    if (onConfirm && canConfirm) {
      setIsConfirming(true);
      try {
        await onConfirm(recommendation.id);
      } catch (error) {
        console.error('Failed to confirm recommendation:', error);
      } finally {
        setIsConfirming(false);
      }
    }
  };

  const handleStatusChange = async (status: Recommendation['status']) => {
    if (onStatusChange) {
      setIsUpdating(true);
      try {
        const confirmedAt = status === 'confirmed' ? new Date().toISOString() : undefined;
        await onStatusChange(recommendation.id, status, confirmedAt);
      } catch (error) {
        console.error('Failed to update status:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleSave = async () => {
    if (onUpdate && canEdit) {
      setIsUpdating(true);
      try {
        await onUpdate(recommendation.id, editData);
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update recommendation:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleDelete = () => {
    if (onDelete && canEdit && window.confirm('Êtes-vous sûr de vouloir supprimer cette recommandation ?')) {
      onDelete(recommendation.id);
    }
  };
  
  const isOverdue = recommendation.deadline && 
    new Date(recommendation.deadline) < new Date() && 
    recommendation.status === 'in_progress';

  // Permission checks
  const isAdmin = profile?.role === 'admin';
  const isChief = profile?.role === 'chief';
  const canEdit = isAdmin || isChief;
  const canConfirm = (isAdmin || (isChief && recommendation.departmentId === profile?.departmentId)) && 
                     recommendation.status === 'pending';
  
  return (
    <div className={`card transition-all duration-300 hover:shadow-md ${
      isOverdue ? 'border-error-300' : 
      recommendation.status === 'pending' ? 'border-warning-300 bg-warning-50' : ''
    }`}>
      <div className="p-4">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-3">
          {isEditing && canEdit ? (
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="input mb-2 flex-1 mr-2"
              placeholder="Titre de la recommandation"
              disabled={isUpdating}
            />
          ) : (
            <h3 className="text-lg font-semibold text-gray-900 flex-1">
              {recommendation.title}
            </h3>
          )}
          
          <div className="flex items-center space-x-2 ml-2">
            <StatusBadge status={recommendation.status} />
            {canEdit && (
              <div className="flex space-x-1">
                {isEditing ? (
                  <>
                    <button 
                      onClick={handleSave}
                      disabled={isUpdating}
                      className="p-1 text-success-600 hover:text-success-700 disabled:opacity-50"
                      title="Enregistrer les modifications"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      disabled={isUpdating}
                      className="p-1 text-gray-600 hover:text-gray-700 disabled:opacity-50"
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
        
        {/* Department Badge */}
        {department && (
          <div className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-800 mb-3">
            {department.acronym} - {department.name}
          </div>
        )}
        
        {/* Description */}
        {isEditing && canEdit ? (
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="input mb-3 w-full"
            placeholder="Description de la recommandation"
            rows={3}
            disabled={isUpdating}
          />
        ) : (
          <p className="text-gray-600 text-sm mb-3">
            {recommendation.description}
          </p>
        )}
        
        {/* Details Section */}
        <div className="border-t border-gray-100 pt-3 mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
            {/* Deadline */}
            <div className="flex items-center">
              <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
              {isEditing && canEdit ? (
                <input
                  type="date"
                  value={editData.deadline}
                  onChange={(e) => setEditData({ ...editData, deadline: e.target.value })}
                  className="input py-1 px-2 text-sm flex-1"
                  disabled={isUpdating}
                />
              ) : (
                <span className={isOverdue ? 'text-error-600 font-medium' : ''}>
                  Date limite: {recommendation.deadline 
                    ? format(new Date(recommendation.deadline), 'dd/MM/yyyy') 
                    : 'Aucune date limite'}
                </span>
              )}
            </div>
            
            {/* Assigned User */}
            {userName && (
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-400" />
                <span>Assigné à: {userName}</span>
              </div>
            )}
            
            {/* Created By */}
            <div className="flex items-center">
              <Info className="h-4 w-4 mr-2 text-gray-400" />
              <span>Créé par: {recommendation.createdBy}</span>
            </div>
            
            {/* Completion Date */}
            {recommendation.confirmedAt && (
              <div className="flex items-center text-success-600">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <span>Terminé: {format(new Date(recommendation.confirmedAt), 'dd/MM/yyyy')}</span>
              </div>
            )}
            
            {/* Confirmation Details */}
            {recommendation.confirmedAt && recommendation.confirmedBy && (
              <div className="flex items-center text-primary-600 col-span-full">
                <Shield className="h-4 w-4 mr-2" />
                <span>
                  Confirmé par {recommendation.confirmedBy} le {format(new Date(recommendation.confirmedAt), 'dd/MM/yyyy à HH:mm')}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons Section */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {/* Confirm Button - Only for pending recommendations */}
            {canConfirm && (
              <button 
                onClick={handleConfirm}
                disabled={isConfirming || isUpdating}
                className="btn btn-sm btn-primary flex-1 min-w-[120px]"
              >
                <Shield className="h-4 w-4 mr-1" />
                {isConfirming ? 'Confirmation...' : 'Confirmer'}
              </button>
            )}
            
            {/* Status Change Buttons for non-pending recommendations */}
            {!canConfirm && canEdit && recommendation.status !== 'confirmed' && (
              <button 
                onClick={() => handleStatusChange('confirmed')}
                disabled={isUpdating}
                className="btn btn-sm btn-success flex-1 min-w-[120px]"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {isUpdating ? 'Mise à jour...' : 'Marquer terminé'}
              </button>
            )}
            
            {/* Back to In Progress (for confirmed/confirmed items) */}
            {canEdit && (recommendation.status === 'confirmed' || recommendation.status === 'confirmed') && (
              <button 
                onClick={() => handleStatusChange('in_progress')}
                disabled={isUpdating}
                className="btn btn-sm btn-outline flex-1 min-w-[120px]"
              >
                <Clock className="h-4 w-4 mr-1" />
                {isUpdating ? 'Mise à jour...' : 'Réouvrir'}
              </button>
            )}
          </div>
          
          {/* Status Information */}
          {recommendation.status === 'pending' && (
            <div className="mt-2 text-xs text-warning-600 bg-warning-100 px-2 py-1 rounded">
              ⏳ Cette recommandation est en attente de confirmation
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;