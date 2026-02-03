import { supabase } from './client'

export type BucketName = 'avatars' | 'pet-images' | 'client-images' | 'vaccination-documents'

interface UploadOptions {
  bucket: BucketName
  file: File
  path?: string
  organizationId?: string
}

export const storageApi = {
  async uploadFile({ bucket, file, path, organizationId }: UploadOptions): Promise<string> {
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = path ?? `${organizationId ?? 'public'}/${timestamp}-${sanitizedName}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw new Error(`Upload failed: ${error.message}`)

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
    return urlData.publicUrl
  },

  async deleteFile(bucket: BucketName, url: string): Promise<void> {
    // Extract path from full URL
    const path = url.split(`/storage/v1/object/public/${bucket}/`)[1]
    if (!path) return

    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) throw new Error(`Delete failed: ${error.message}`)
  },

  async getSignedUrl(bucket: BucketName, path: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) throw new Error(`Failed to create signed URL: ${error.message}`)
    return data.signedUrl
  },
}
