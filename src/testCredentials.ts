// Test credentials for the API
// Note: Passwords are stored as plain text for easy testing
// The API automatically hashes them using btoa(password + '_salt')
export const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@medpro.com',
    password: 'admin123',
    role: 'Admin'
  },
  reviewer: {
    email: 'reviewer@medpro.com', 
    password: 'reviewer123',
    role: 'Reviewer'
  },
  qc: {
    email: 'qc@medpro.com',
    password: 'qc123', 
    role: 'QC'
  },
  john: {
    email: 'john.doe@medpro.com',
    password: 'john123',
    role: 'Reviewer'
  },
  sarah: {
    email: 'sarah.wilson@medpro.com',
    password: 'sarah123',
    role: 'QC'
  },
  mike: {
    email: 'mike.johnson@medpro.com',
    password: 'mike123',
    role: 'Reviewer'
  },
  jane: {
    email: 'jane.smith@medpro.com',
    password: 'jane123',
    role: 'QC'
  }
};

// Available test users
export const AVAILABLE_USERS = [
  { name: 'Admin User', ...TEST_CREDENTIALS.admin },
  { name: 'Reviewer User', ...TEST_CREDENTIALS.reviewer },
  { name: 'QC User', ...TEST_CREDENTIALS.qc },
  { name: 'John Doe', ...TEST_CREDENTIALS.john },
  { name: 'Sarah Wilson', ...TEST_CREDENTIALS.sarah },
  { name: 'Mike Johnson', ...TEST_CREDENTIALS.mike },
  { name: 'Jane Smith', ...TEST_CREDENTIALS.jane }
];
