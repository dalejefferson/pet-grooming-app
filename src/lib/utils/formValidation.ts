import { isValidPhone, PHONE_ERROR } from '@/lib/utils/validation'

export const validators = {
  email: (v: string) =>
    !v
      ? undefined
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        ? undefined
        : 'Please enter a valid email address',
  phone: (v: string) =>
    !v
      ? undefined
      : isValidPhone(v)
        ? undefined
        : PHONE_ERROR,
  required: (v: string) => (v?.trim() ? undefined : 'This field is required'),
}

export function validateForm(
  values: Record<string, string>,
  rules: Record<string, ((v: string) => string | undefined)[]>
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const [field, fieldRules] of Object.entries(rules)) {
    for (const rule of fieldRules) {
      const error = rule(values[field] || '')
      if (error) {
        errors[field] = error
        break
      }
    }
  }
  return errors
}
