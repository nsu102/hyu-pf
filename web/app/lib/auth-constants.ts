export const HANYANG_DOMAIN = "hanyang.ac.kr";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function isHanyangEmail(email: string) {
  return email.trim().toLowerCase().endsWith(`@${HANYANG_DOMAIN}`);
}
