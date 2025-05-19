import supabase, { supabaseUrl } from './supabase';

export async function getArtNfts() {
  const { data, error } = await supabase.from('artnfts').select('*');
  if (error) {
    console.error(error);
    throw new Error('ArtNfts could not be loaded');
  }
  return data;
}
export async function deleteNft(id) {
  const { data, error } = await supabase.from('cabins').delete().eq('id', id);

  if (error) {
    console.error(error);
    throw new Error('ArtNfts could not be deleted');
  }
  return data;
}
export async function createEditNft(newNft, id) {
  const hasImagePath = newNft.image?.startsWith?.(supabaseUrl);
  const imageName = `${Math.random()}-${newNft.image.name}`.replaceAll('/', '');

  const imagePath = hasImagePath
    ? newNft.image
    : `${supabaseUrl}/storage/v1/object/public/artnfts/${imageName}`;
  /*https://bsuyufmblsdloxdxwpbs.supabase.co/storage/v1/object/public/artnfts/cabin-001.jpg*/

  //1. Create/Edit Nft
  let query = supabase.from('artnfts');

  //A. CREATE
  if (!id) query = query.insert([{ ...newNft, image: imagePath }]);

  //B. EDIT
  if (id) query = query.update({ ...newNft, image: imagePath }).eq('id', id);

  const { data, error } = await query.select().single();

  if (error) {
    console.error(error);
    throw new Error('Nft could not be created');
  }
  // 2.Upload image
  const { error: storageError } = await supabase.storage
    .from('artnfts')
    .upload(imageName, newNft.image);
  //Delete the cabin if there was an error Uploading the image
  if (storageError) {
    await supabase.from('artnfts').delete().eq('id', data.id);
    throw new Error(
      'Nft image could not be uploaded and the artnft was not created'
    );
  }
  return data;
}
