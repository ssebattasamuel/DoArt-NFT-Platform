import { getToday } from '../utils/helpers';
import supabase from './supabase';

export async function getTrade(id) {
  const { data, error } = await supabase
    .from('trades')
    .select('*, artnfts(*), buyers(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error(error);
    throw new Error('Booking not found');
  }

  return data;
}

// Returns all TRADES that are were created after the given date. Useful to get trades created in the last 30 days, for example.
export async function getTradesAfterDate(date) {
  const { data, error } = await supabase
    .from('trades')
    .select('created_at, purchasePrice')
    .gte('created_at', date)
    .lte('created_at', getToday({ end: true }));

  if (error) {
    console.error(error);
    throw new Error('Trades could not get loaded');
  }

  return data;
}

export async function deleteTrade(id) {
  // REMEMBER RLS POLICIES
  const { data, error } = await supabase.from('trades').delete().eq('id', id);

  if (error) {
    console.error(error);
    throw new Error('Trade could not be deleted');
  }
  return data;
}
