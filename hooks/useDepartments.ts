import { useState, useEffect } from 'react';
import { apiService, Department } from '@/lib/api-service';

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(true);
        const data = await apiService.getDepartments();
        setDepartments(data);
        setError(null);
      } catch (err) {
        setError('Failed to load departments');
        console.error('Error loading departments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, []);

  const createDepartment = async (departmentData: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newDepartment = await apiService.createDepartment(departmentData);
      if (newDepartment) {
        setDepartments(prev => [...prev, newDepartment]);
        return newDepartment;
      }
      throw new Error('Failed to create department');
    } catch (err) {
      setError('Failed to create department');
      console.error('Error creating department:', err);
      throw err;
    }
  };

  const updateDepartment = async (id: string, updates: Partial<Omit<Department, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const success = await apiService.updateDepartment(id, updates);
      if (success) {
        setDepartments(prev => 
          prev.map(dept => 
            dept.id === id ? { ...dept, ...updates } : dept
          )
        );
        return true;
      }
      throw new Error('Failed to update department');
    } catch (err) {
      setError('Failed to update department');
      console.error('Error updating department:', err);
      throw err;
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      const success = await apiService.deleteDepartment(id);
      if (success) {
        setDepartments(prev => prev.filter(dept => dept.id !== id));
        return true;
      }
      throw new Error('Failed to delete department');
    } catch (err) {
      setError('Failed to delete department');
      console.error('Error deleting department:', err);
      throw err;
    }
  };

  return {
    departments,
    loading,
    error,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    refetch: () => {
      setLoading(true);
      apiService.getDepartments()
        .then(setDepartments)
        .catch(err => {
          setError('Failed to load departments');
          console.error('Error loading departments:', err);
        })
        .finally(() => setLoading(false));
    }
  };
}
