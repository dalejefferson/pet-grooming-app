import { useRef, useState, type ChangeEvent } from 'react'
import { Upload, FileText, X, ExternalLink, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { storageApi, type BucketName } from '@/lib/supabase/storage'

export interface DocumentUploadProps {
  currentDocument?: string
  onDocumentChange: (documentUrl: string | null) => void
  label?: string
  accept?: string
  maxSizeMB?: number
  bucket?: BucketName
  className?: string
}

// Helper to determine file type from URL or data URL
function getFileType(url: string): 'pdf' | 'image' | 'unknown' {
  if (url.startsWith('data:application/pdf')) return 'pdf'
  if (url.startsWith('data:image/')) return 'image'
  if (url.match(/\.pdf(\?|$)/i)) return 'pdf'
  if (url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) return 'image'
  return 'unknown'
}

// Helper to get file name from URL (for display purposes)
function getDisplayName(url: string): string {
  const type = getFileType(url)
  if (type === 'pdf') return 'PDF Document'
  if (type === 'image') return 'Image Document'
  return 'Document'
}

export function DocumentUpload({
  currentDocument,
  onDocumentChange,
  label = 'Document',
  accept = 'image/*,.pdf,application/pdf',
  maxSizeMB = 5,
  bucket = 'vaccination-documents',
  className,
}: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleClick = () => {
    if (!uploading) fileInputRef.current?.click()
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      alert('Please select an image (JPG, PNG, GIF, WebP) or PDF file')
      return
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File must be less than ${maxSizeMB}MB`)
      return
    }

    setUploading(true)
    try {
      // Delete previous document if it's a Supabase URL
      if (currentDocument && currentDocument.includes('supabase')) {
        storageApi.deleteFile(bucket, currentDocument).catch(() => {})
      }

      const publicUrl = await storageApi.uploadFile({ bucket, file })
      onDocumentChange(publicUrl)
    } catch (err) {
      alert('Upload failed. Please try again.')
      console.error('Document upload error:', err)
    } finally {
      setUploading(false)
    }

    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDocumentChange(null)
  }

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentDocument) {
      // For Supabase URLs and regular URLs, open directly
      if (!currentDocument.startsWith('data:')) {
        window.open(currentDocument, '_blank')
        return
      }

      // For base64 data URLs (legacy), build DOM safely without document.write()
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        const doc = newWindow.document
        doc.title = 'Vaccination Document'

        const fileType = getFileType(currentDocument)
        if (fileType === 'pdf') {
          doc.body.style.cssText = 'margin:0;padding:0;'
          const iframe = doc.createElement('iframe')
          iframe.src = currentDocument
          iframe.style.cssText = 'width:100%;height:100vh;border:none;'
          doc.body.appendChild(iframe)
        } else {
          doc.body.style.cssText = 'margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#1e293b;'
          const img = doc.createElement('img')
          img.src = currentDocument
          img.alt = 'Uploaded vaccination document'
          img.style.cssText = 'max-width:100%;max-height:100vh;object-fit:contain;'
          doc.body.appendChild(img)
        }
      }
    }
  }

  return (
    <div className={cn('', className)}>
      {label && (
        <label className="mb-1 block text-sm font-semibold text-[#1e293b]">
          {label} (Optional)
        </label>
      )}

      {currentDocument ? (
        // Document is uploaded - show preview/info
        <div className="flex items-center gap-3 rounded-xl border-2 border-[#1e293b] bg-[#f0fdf4] p-3 shadow-[2px_2px_0px_0px_#1e293b]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#22c55e] text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[#1e293b] truncate">{getDisplayName(currentDocument)}</p>
            <p className="text-xs text-[#64748b]">Document uploaded</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleView}
              className="text-[#64748b] hover:text-[#1e293b]"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-[#64748b] hover:text-[#ef4444]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        // No document - show upload area
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="w-full rounded-xl border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-center transition-all hover:border-[#1e293b] hover:bg-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#1e293b] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="mx-auto h-6 w-6 text-[#64748b] animate-spin" />
              <p className="mt-1 text-sm text-[#64748b]">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="mx-auto h-6 w-6 text-[#94a3b8]" />
              <p className="mt-1 text-sm text-[#64748b]">Upload vaccination certificate</p>
              <p className="text-xs text-[#94a3b8]">PDF, JPG, or PNG (max {maxSizeMB}MB)</p>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
