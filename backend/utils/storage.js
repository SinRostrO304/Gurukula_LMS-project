// backend/utils/storage.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  `https://${process.env.SUPABASE_URL}`,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function uploadFile(buffer, filename, mime) {
  const key = `${Date.now()}-${filename}`;
  const { data, error } = await supabase
    .storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(key, buffer, { contentType: mime });
  if (error) throw error;
  // Return the public URL
  const objectPath = data.path || data.Key;
  return `https://${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${objectPath}`;
}

// For private buckets: generate a signed download URL
async function getSignedUrl(key, expires = 60) {
  const { signedURL, error } = await supabase
    .storage
    .from(process.env.SUPABASE_BUCKET)
    .createSignedUrl(key, expires);
  if (error) throw error;
  return signedURL;
}

module.exports = { uploadFile, getSignedUrl };