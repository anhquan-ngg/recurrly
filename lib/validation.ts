const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function getPasswordError(value: string): string | undefined {
  if (value.length < 8) return "Password must be at least 8 characters.";
  return undefined;
}

export function getConfirmPasswordError(password: string, confirmPassword: string): string | undefined {
  if (confirmPassword !== password) return "Passwords don't match.";
  return undefined;
}
