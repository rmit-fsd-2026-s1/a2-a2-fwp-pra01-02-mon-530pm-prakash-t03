/**
 * VENUE VENDORS CLIENT APP - VALIDATION.TS
 * 
 * Purpose: Source code for Venue Vendors Client App.
 * 
 * Command lines to execute/build/test this project:
 * - Start Vite Frontend Dev Server: npm run dev
 * - Build Frontend bundle: npm run build
 * - Run Frontend Unit Tests: npm test
 */

// Validation Rules for Venue Vendors
// 
// Email: must contain @ and a domain (e.g. user@example.com)
// Password: min 8 chars, needs uppercase, lowercase, number, special char
// Phone: Australian format only (04XX XXX XXX or +61)
// Date: must be in the future — can't book a venue for yesterday
// ABN: exactly 11 digits, numbers only (Australian Business Number format)

export const validateEmail = (email: string): string | null => {
  if (!email.trim()) return 'Email is required.';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Please enter a valid email address.';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must include a number.';
  if (!/[!@#$%^&*]/.test(password))
    return 'Password must include a special character (!@#$%^&*).';
  return null;
};

export const validateName = (name: string): string | null => {
  if (!name.trim()) return 'Name is required.';
  if (name.trim().length < 2) return 'Name must be at least 2 characters.';
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone.trim()) return 'Phone number is required.';
  const re = /^(\+?61|0)[2-9]\d{8}$|^\d{10}$/;
  if (!re.test(phone.replace(/\s/g, '')))
    return 'Please enter a valid Australian phone number.';
  return null;
};

export const validateRequired = (value: string, label: string): string | null => {
  if (!value.trim()) return `${label} is required.`;
  return null;
};

export const validatePositiveNumber = (value: number | string, label: string): string | null => {
  const n = Number(value);
  if (!value && value !== 0) return `${label} is required.`;
  if (isNaN(n) || n <= 0) return `${label} must be a positive number.`;
  return null;
};

export const validateDate = (date: string): string | null => {
  if (!date) return 'Date is required.';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Please enter a valid date.';
  if (d < new Date()) return 'Event date must be in the future.';
  return null;
};

export const validateABN = (abn: string): string | null => {
  if (!abn.trim()) return 'ABN is required for business applicants.';
  const digits = abn.replace(/\s/g, '');
  if (!/^\d{11}$/.test(digits)) return 'ABN must be 11 digits.';
  return null;
};
