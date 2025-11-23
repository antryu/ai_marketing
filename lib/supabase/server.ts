import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

export const createServerClient = async () => {
  return createServerComponentClient<Database>({ cookies });
};

// Alias for backward compatibility
export const createClient = createServerClient;
