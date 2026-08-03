const MIN_LENGTH = 8;

export const PASSWORD_REQUIREMENTS = [
  "At least 8 characters",
  "Contains a letter",
  "Contains a number",
];

export const validatePassword = (password: string): string | null => {
  if (!password || password.length < MIN_LENGTH) {
    return `Password must be at least ${MIN_LENGTH} characters long`;
  }
  if (!/[a-zA-Z]/.test(password)) {
    return "Password must contain at least one letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  return null;
};
