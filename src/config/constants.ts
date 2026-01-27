export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Pet Grooming Pro'
export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173'

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  requested: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
  checked_in: 'bg-purple-100 text-purple-800 border-purple-300',
  in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
  no_show: 'bg-red-100 text-red-800 border-red-300',
}

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  requested: 'Requested',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

export const BEHAVIOR_LEVEL_LABELS: Record<number, string> = {
  1: 'Very Calm',
  2: 'Calm',
  3: 'Moderate',
  4: 'Anxious',
  5: 'Difficult',
}

export const COAT_TYPE_LABELS: Record<string, string> = {
  short: 'Short',
  medium: 'Medium',
  long: 'Long',
  curly: 'Curly',
  double: 'Double Coat',
  wire: 'Wire/Rough',
}

export const WEIGHT_RANGE_LABELS: Record<string, string> = {
  small: 'Small (0-15 lbs)',
  medium: 'Medium (16-40 lbs)',
  large: 'Large (41-80 lbs)',
  xlarge: 'X-Large (81+ lbs)',
}

export const SERVICE_CATEGORIES: Record<string, string> = {
  bath: 'Bath & Dry',
  haircut: 'Haircut',
  nail: 'Nail Services',
  specialty: 'Specialty',
  package: 'Packages',
}

export const CALENDAR_BUSINESS_HOURS = {
  start: 8, // 8 AM
  end: 18, // 6 PM
}
