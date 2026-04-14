/**
 * Phone auth utilities — shared between LoginPage and RegisterPage.
 *
 * Supabase Auth rejects email local-parts with '+', so we encode
 * Chinese phone numbers as:   13800000000  →  p8613800000000@nextup-rank.phone
 * (stripped of the '+' prefix, 'p' signals "phone" for readability)
 */

const PHONE_DOMAIN = 'nextup-rank.phone'

/**
 * Convert a phone number to a fake email for Supabase Auth storage.
 * Strips spaces/dashes, ensures 86 prefix, never emits a '+' in the local-part.
 */
export function toFakeEmail(phone) {
  const digits = phone.replace(/[\s\-]/g, '').replace(/^\+/, '')
  const normalized = digits.startsWith('86') ? digits : `86${digits}`
  return `p${normalized}@${PHONE_DOMAIN}`
}

/**
 * Returns true if the input looks like a Chinese mobile number.
 * Accepts 10–15 digit strings (with optional +, spaces, dashes).
 * Requires at least 10 chars so 7-digit inputs don't false-positive.
 */
export function isPhoneInput(value) {
  const stripped = value.replace(/[\s\-]/g, '')
  return /^[+\d]{10,15}$/.test(stripped)
}
