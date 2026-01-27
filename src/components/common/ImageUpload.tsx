import { useRef, type ChangeEvent } from 'react'
import { Camera, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ImageUploadProps {
  currentImage?: string
  onImageChange: (imageUrl: string | null) => void
  placeholder?: string // initials or icon
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-12 w-12 text-sm',
  md: 'h-20 w-20 text-lg',
  lg: 'h-32 w-32 text-2xl',
}

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function ImageUpload({
  currentImage,
  onImageChange,
  placeholder = '?',
  size = 'md',
  className,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      onImageChange(base64)
    }
    reader.readAsDataURL(file)

    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onImageChange(null)
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'relative flex items-center justify-center rounded-xl border-2 border-[#1e293b] bg-[#fef9c3] font-semibold text-[#334155] shadow-[3px_3px_0px_0px_#1e293b] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1e293b] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#1e293b] focus:outline-none focus:ring-2 focus:ring-[#1e293b] focus:ring-offset-2 overflow-hidden',
          sizeClasses[size]
        )}
      >
        {currentImage ? (
          <img
            src={currentImage}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="uppercase">{placeholder}</span>
        )}

        {/* Camera overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
          <Camera className={cn('text-white', iconSizes[size])} />
        </div>
      </button>

      {/* Remove button */}
      {currentImage && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1e293b] bg-danger-500 text-white shadow-[2px_2px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b]"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
