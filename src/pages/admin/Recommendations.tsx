import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RecommendationCard from '../../components/RecommendationCard';
import StatusFilter from '../../components/StatusFilter';
import DepartmentFilter from '../../components/DepartmentFilter';
import { 
  Plus, 
  Filter, 
  Search, 
  X, 
  CalendarDays, 
  AlertTriangle, 
  User 
} from 'lucide-react';
import { format } from 'date-fns';

const AdminRecommendations = () => {
  const { 
    departments, 
    users, 
    addRecommendation,
    updateRecommendation,
    deleteRecommendation,
    updateRecommendationStatus,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    getFilteredRecommendations,
    loading,
   
    profile,
  } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // New recommendation form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    userId: '',
    deadline: format(new Date().setDate(new Date().getDate() + 7), 'yyyy-MM-dd'),
  });
  const [formError, setFormError] = useState('');

  // Debug logs
  console.log('AdminRecommendations - Departments:', departments);
  console.log('AdminRecommendations - Users:', users);
  console.log('AdminRecommendations - Filtered Recommendations:', getFilteredRecommendations());

  // Handle non-admin access
  if (profile?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 text-center py-8">
        <p className="text-error-700">Access denied: This page is for admins only.</p>
      </div>
    );
  }

  // Handle loading states
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 text-center py-8">
        <p className="text-gray-600">Loading data...</p>
      </div>
    );
  }

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Filter recommendations based on search term
  const filteredRecommendations = getFilteredRecommendations().filter(rec =>
    searchTerm === '' ||
    rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.description || !formData.userId || !formData.deadline) {
      setFormError('Please fill in all fields');
      return;
    }
    
    // Get user's departmentId
    const selectedUser = users.find(user => user.id === formData.userId);
    if (!selectedUser) {
      setFormError('Invalid user selected');
      return;
    }
    
    // Add recommendation
    try {
      await addRecommendation({
        title: formData.title,
        description: formData.description,
        userId: formData.userId,
        departmentId: selectedUser.departmentId,
        deadline: formData.deadline,
      });
      
      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        userId: '',
        deadline: format(new Date().setDate(new Date().getDate() + 7), 'yyyy-MM-dd'),
      });
      setFormError('');
      setIsModalOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to add recommendation');
    }
  };
  
  // Helper function to get department by id
  const getDepartmentById = (id: string | null | undefined) => {
    if (!id) return null;
    return departments.find(dept => dept.id === id) || null;
  };
  
  // Helper function to get user name by id
  const getUserNameById = (id: string) => {
    const user = users.find((u: { id: string; }) => u.id === id);
    return user ? user.name : 'Unknown User';
  };
  
  // Get selected user's department for display
  const selectedUserDepartment = formData.userId 
    ? getDepartmentById(users.find(user => user.id === formData.userId)?.departmentId)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Recommendations</h1>
          <p className="text-gray-600">
            Manage and track all department recommendations
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Recommendation
        </button>
      </div>
      
      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative max-w-xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search recommendations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        
        <div className="flex items-center justify-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm font-medium text-primary-600 mr-3"
          >
            <Filter className="h-4 w-4 mr-1" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          {(statusFilter !== 'all' || departmentFilter !== 'all') && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setDepartmentFilter('all');
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear Filters
            </button>
          )}
        </div>
        
        {showFilters && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 p-4 border border-gray-200 rounded-lg bg-gray-50 max-w-3xl mx-auto">
            <StatusFilter 
              currentStatus={statusFilter}
              onStatusChange={setStatusFilter}
            />
            
            <DepartmentFilter 
              departments={departments}
              currentDepartment={departmentFilter}
              onDepartmentChange={setDepartmentFilter}
            />
          </div>
        )}
      </div>
      
      {/* Recommendations Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto">
        {filteredRecommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            department={getDepartmentById(recommendation.departmentId)}
            userName={getUserNameById(recommendation.userId)}
            onStatusChange={updateRecommendationStatus}
            onUpdate={updateRecommendation}
            onDelete={deleteRecommendation}
          />
        ))}
      </div>
      
      {filteredRecommendations.length === 0 && (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200 max-w-3xl mx-auto">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No recommendations found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters or search term</p>
        </div>
      )}
      
      {/* Add Recommendation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Add New Recommendation</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-4 max-h-[70vh] overflow-y-auto">
                {formError && (
                  <div className="mb-4 bg-error-50 text-error-700 p-3 rounded-md text-sm">
                    {formError}
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="title" className="label">
                    Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter recommendation title"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description" className="label">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="input min-h-[100px]"
                    placeholder="Enter detailed description"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="userId" className="label flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Assign User
                    </label>
                    {users.length === 0 ? (
                      <p className="text-error-700 text-sm">No users available. Please add users first.</p>
                    ) : (
                      <select
                        id="userId"
                        name="userId"
                        value={formData.userId}
                        onChange={handleInputChange}
                        className="input"
                      >
                        <option value="">Select User</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="label flex items-center">
                      Department
                    </label>
                    {selectedUserDepartment ? (
                      <p className="text-gray-600">
                        {selectedUserDepartment.acronym} - {selectedUserDepartment.name}
                      </p>
                    ) : formData.userId ? (
                      <p className="text-error-700 text-sm">No department found for selected user.</p>
                    ) : (
                      <p className="text-gray-600">Select a user to see their department</p>
                    )}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="deadline" className="label flex items-center">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    Deadline
                  </label>
                  <input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    className="input"
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
              </div>
              
              <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={users.length === 0} // Disable if no users
                >
                  Add Recommendation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecommendations;