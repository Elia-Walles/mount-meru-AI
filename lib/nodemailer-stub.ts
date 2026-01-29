// Stub file for nodemailer when package is not installed
// This allows the application to compile without nodemailer dependency

export const createTransport = () => {
  throw new Error('Nodemailer not installed. Please install nodemailer package to enable email functionality.');
};

export default {
  createTransport
};
