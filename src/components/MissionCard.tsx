import { format } from 'date-fns';
import { useState } from 'react';
import { Mission, Department ,useAuth} from '../contexts/AuthContext';
import {
  CalendarDays,
  Pencil,
  Trash2,
  X,
  Save,
  FileText,
} from 'lucide-react';

interface MissionCardProps {
  mission: Mission;
  department?: Department | null;
  userName?: string;
  onUpdate?: (id: string, data: Partial<Mission>) => void;
  onDelete?: (id: string) => void;
  onViewRecommendations?: (missionId: string) => void;
}

const MissionCard = ({
  mission,
  department,
  onUpdate,
  onDelete,
  onViewRecommendations
}: MissionCardProps) => {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: mission.title,
    description: mission.description,
    deadline: mission.deadline ?? ''
  });

  const isAdmin = profile?.role === 'admin' || profile?.role === 'chief';

  const handleSave = () => {
    if (onUpdate && isAdmin) {
      onUpdate(mission.id, editData);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete && isAdmin && window.confirm('Supprimer cette mission ?')) {
      onDelete(mission.id);
    }
  };

  const handleViewRecommendations = () => {
    if (onViewRecommendations) {
      onViewRecommendations(mission.id);
    }
  };

  return (
    <div className="card hover:shadow-md transition-all duration-300">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          {isEditing && isAdmin ? (
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="input mb-2 flex-1 mr-2"
              placeholder="Titre de la mission"
            />
          ) : (
            <h3 className="text-lg font-semibold text-gray-900 mb-1 flex-1">
              {mission.title}
            </h3>
          )}
          {isAdmin && (
            <div className="flex space-x-1">
              {isEditing ? (
                <>
                  <button onClick={handleSave} className="p-1 text-success-600 hover:bg-success-50 rounded" title="Enregistrer">
                    <Save className="h-4 w-4" />
                  </button>
                  <button onClick={() => setIsEditing(false)} className="p-1 text-gray-600 hover:bg-gray-50 rounded" title="Annuler">
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsEditing(true)} className="p-1 text-primary-600 hover:bg-primary-50 rounded" title="Modifier">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={handleDelete} className="p-1 text-error-600 hover:bg-error-50 rounded" title="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {department && (
          <div className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-800 mb-3">
            {department.acronym}
          </div>
        )}

        {isEditing && isAdmin ? (
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="input mb-3 w-full"
            rows={3}
            placeholder="Description de la mission"
          />
        ) : (
          <p className="text-gray-600 text-sm mb-3 leading-relaxed">
            {mission.description}
          </p>
        )}

        <div className="border-t border-gray-100 pt-3 mt-3">
          <div className="flex flex-wrap gap-y-2 mb-3">
            <div className="w-full sm:w-1/2 flex items-center text-sm text-gray-500">
              <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
              {isEditing && isAdmin ? (
                <input
                  type="date"
                  value={editData.deadline}
                  onChange={(e) => setEditData({ ...editData, deadline: e.target.value })}
                  className="input py-1 px-2 text-sm"
                />
              ) : (
                <span>
                  Date limite: {mission.deadline
                    ? format(new Date(mission.deadline), 'dd/MM/yyyy')
                    : 'Non définie'}
                </span>
              )}
            </div>

        
          </div>

          {/* Recommendations Button */}
          <div className="flex justify-end">
            <button
              onClick={handleViewRecommendations}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 hover:border-primary-300 transition-colors duration-200"
            >
              <FileText className="h-4 w-4 mr-2" />
              Voir les recommandations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionCard;