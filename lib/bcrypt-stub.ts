// Stub file for bcryptjs when package is not installed
// This allows the application to compile without bcryptjs dependency

export const hash = async (password: string, saltRounds: number): Promise<string> => {
  throw new Error('Bcryptjs not installed. Please install bcryptjs package to enable password hashing.');
};

export const compare = async (password: string, hash: string): Promise<boolean> => {
  throw new Error('Bcryptjs not installed. Please install bcryptjs package to enable password comparison.');
};

export default {
  hash,
  compare
};
