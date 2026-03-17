import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import type { MultipartFile } from '@fastify/multipart';
import { supabase } from '../lib/supabase.js';

const DEFAULT_BUCKET = 'avatars';

export async function upload(file: MultipartFile, bucket = DEFAULT_BUCKET) {
  const buffer = await file.toBuffer();
  const path = `${randomUUID()}${extname(file.filename)}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.mimetype });

  if (error) throw error;

  const { data: signedUrl } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600);

  return { path, url: signedUrl?.signedUrl ?? null };
}

export async function getSignedUrl(path: string, bucket = DEFAULT_BUCKET) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600);

  if (error) throw error;
  return data.signedUrl;
}
