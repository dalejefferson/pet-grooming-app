export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Sit Pretty Club'
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

// Common dog breeds for breed selection dropdown
export const DOG_BREEDS = [
  'Labrador Retriever',
  'Golden Retriever',
  'German Shepherd',
  'Bulldog',
  'Poodle',
  'Beagle',
  'Rottweiler',
  'Yorkshire Terrier',
  'Boxer',
  'Dachshund',
  'Shih Tzu',
  'Siberian Husky',
  'Great Dane',
  'Doberman Pinscher',
  'Chihuahua',
  'Maltese',
  'Pomeranian',
  'Cocker Spaniel',
  'Border Collie',
  'Pit Bull',
  'Australian Shepherd',
  'Cavalier King Charles Spaniel',
  'Miniature Schnauzer',
  'Havanese',
  'French Bulldog',
  'English Springer Spaniel',
  'Pembroke Welsh Corgi',
  'Shetland Sheepdog',
  'Boston Terrier',
  'Bernese Mountain Dog',
  'Basset Hound',
  'Akita',
  'Shiba Inu',
  'Bichon Frise',
  'Weimaraner',
  'Vizsla',
  'Samoyed',
  'Collie',
  'Papillon',
  'Bloodhound',
  'Mixed Breed',
]

// Common cat breeds for breed selection dropdown
export const CAT_BREEDS = [
  'Persian',
  'Maine Coon',
  'Siamese',
  'Ragdoll',
  'Bengal',
  'Abyssinian',
  'British Shorthair',
  'Scottish Fold',
  'Sphynx',
  'Russian Blue',
  'American Shorthair',
  'Birman',
  'Norwegian Forest Cat',
  'Oriental Shorthair',
  'Devon Rex',
  'Cornish Rex',
  'Exotic Shorthair',
  'Burmese',
  'Tonkinese',
  'Himalayan',
  'Ragamuffin',
  'Turkish Angora',
  'Somali',
  'Egyptian Mau',
  'Chartreux',
  'Manx',
  'Japanese Bobtail',
  'Domestic Shorthair',
  'Domestic Longhair',
  'Mixed Breed',
]

// Mapping of groomer specialties to service categories they can perform
// Groomers can perform services in categories that match their specialties
// If a groomer has no matching specialties, they can still perform basic services (bath, nail)
export const SPECIALTY_TO_SERVICE_CATEGORIES: Record<string, string[]> = {
  // Large dog handling
  'Large Dogs': ['bath', 'haircut', 'nail', 'specialty'],
  // Small dog handling
  'Small Dogs': ['bath', 'haircut', 'nail', 'specialty', 'package'],
  // Cat grooming
  'Cats': ['bath', 'nail', 'specialty'],
  // Specific cut styles
  'Poodle Cuts': ['haircut', 'bath'],
  'Show Cuts': ['haircut', 'bath', 'specialty'],
  'Breed-Specific Styles': ['haircut', 'bath'],
  // Specialty services
  'Dematting': ['specialty', 'bath', 'haircut'],
  'Nail Trimming': ['nail'],
  'Puppy Grooming': ['package', 'bath', 'nail'],
}

// Default service categories that any groomer can perform
export const DEFAULT_GROOMER_SERVICE_CATEGORIES = ['bath', 'nail']
