// Department types and management
export interface Department {
  id: string;
  name: string;
  icon: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type DepartmentCreate = Omit<Department, 'id' | 'createdAt' | 'updatedAt'>;
