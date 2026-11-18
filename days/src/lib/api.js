import { createSupabaseApi } from './api.supabase'
import { createLocalApi } from './api.local'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Real accounts when Supabase keys are set; otherwise on-device demo mode. */
export const api = url && key ? createSupabaseApi(url, key) : createLocalApi()
