import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

export async function uploadPieImage(file: File): Promise<{ url: string; path: string }> {
  const path = `pies/${Date.now()}-${file.name}`
  const r = ref(storage, path)
  await uploadBytes(r, file)
  const url = await getDownloadURL(r)
  return { url, path }
}

export async function deletePieImage(opts: { path?: string; url?: string }) {
  const r = opts.path ? ref(storage, opts.path) : ref(storage, opts.url!)
  await deleteObject(r)
}

