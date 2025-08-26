export const isValidEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const isValidPassword = (password: string) => password.length >= 8;

export const isValidName = (name: string) => name.trim().length >= 2;

// Restrict allowed campus email domain to sjcem.edu.in
export const isSJCEMEmail = (email: string) => /@sjcem\.edu\.in$/i.test(email.trim());
