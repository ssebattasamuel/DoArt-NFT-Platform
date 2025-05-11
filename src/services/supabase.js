import { createClient } from '@supabase/supabase-js';
export const supabaseUrl = 'https://bsuyufmblsdloxdxwpbs.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzdXl1Zm1ibHNkbG94ZHh3cGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwMTc1MTYsImV4cCI6MjA1MDU5MzUxNn0.dP_EVeedxSzzOH_xFmpqzsa0G6aWfv-e2AheFKdOkew';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
