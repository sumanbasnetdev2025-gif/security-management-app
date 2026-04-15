import { createClient } from './supabase/client'

export async function uploadImage(file: File, folder: string): Promise<string | null> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('uploads')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  const { data } = supabase.storage.from('uploads').getPublicUrl(fileName)
  return data.publicUrl
}