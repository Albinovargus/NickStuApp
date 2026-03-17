import { supabase } from '../lib/supabase.js';

export async function getById(id: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
