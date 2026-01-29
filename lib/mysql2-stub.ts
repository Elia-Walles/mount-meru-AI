// Stub file for mysql2 to prevent import errors when package is not installed
// This allows the application to run with mock database

export const createPool = () => {
  throw new Error('MySQL2 not installed. Please install mysql2 package to use real database.');
};

export default {
  createPool
};
