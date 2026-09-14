type ClerkFieldError = {
  code: string;
  message: string;
  longMessage?: string;
} | null | undefined;

const FRIENDLY_MESSAGES: Record<string, string> = {
  form_password_pwned: "That password has appeared in a data breach. Please choose a different one.",
  form_password_length_too_short: "Password must be at least 8 characters.",
  form_password_not_strong_enough: "Please choose a stronger password.",
  form_identifier_exists: "An account with this email already exists.",
  form_code_incorrect: "That code didn't work. Check it and try again.",
  too_many_requests: "Too many attempts. Please wait a moment and try again.",
};

export function getFieldErrorMessage(error: ClerkFieldError): string | undefined {
  if (!error) return undefined;
  // Clerk's own longMessage already reflects the instance's actual configured policy
  // (e.g. the real minimum password length) - prefer it over our static fallback copy.
  return error.longMessage ?? FRIENDLY_MESSAGES[error.code] ?? "Something went wrong. Please try again.";
}

export function getGlobalErrorMessage(errors: readonly ClerkFieldError[] | null | undefined): string | undefined {
  const first = errors?.[0];
  if (!first) return undefined;
  return first.longMessage ?? FRIENDLY_MESSAGES[first.code] ?? "Something went wrong. Please try again.";
}

export const SIGN_IN_FAILED_MESSAGE = "Incorrect email or password.";
