import { useState } from 'react'
import { Input, type InputProps } from './Input'
import { sanitizePhoneInput, isValidPhone, PHONE_ERROR, PHONE_MAX_LENGTH } from '@/lib/utils/validation'

export interface PhoneInputProps extends Omit<InputProps, 'type' | 'onChange'> {
  value: string
  onChange: (value: string) => void
}

export function PhoneInput({ value, onChange, error, onBlur, ...props }: PhoneInputProps) {
  const [blurError, setBlurError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizePhoneInput(e.target.value)
    onChange(sanitized)
    if (blurError) setBlurError('')
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (value && !isValidPhone(value)) {
      setBlurError(PHONE_ERROR)
    } else {
      setBlurError('')
    }
    onBlur?.(e)
  }

  return (
    <Input
      type="tel"
      inputMode="numeric"
      maxLength={PHONE_MAX_LENGTH}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      error={error || blurError}
      {...props}
    />
  )
}
