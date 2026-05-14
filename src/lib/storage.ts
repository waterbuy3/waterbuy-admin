import { supabase } from "./supabase";

const BUCKET = "product-images";

async function uploadImage(file: File, path: string): Promise<string> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProductImage(productId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  return uploadImage(file, `products/${productId}/${Date.now()}.${ext}`);
}

export async function uploadCategoryImage(categoryId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  return uploadImage(file, `categories/${categoryId}/${Date.now()}.${ext}`);
}

export async function uploadBannerImage(bannerId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  return uploadImage(file, `banners/${bannerId}/${Date.now()}.${ext}`);
}
