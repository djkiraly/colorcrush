import { Storage } from "@google-cloud/storage";

let storage: Storage | null = null;

function getStorage(): Storage {
  if (!storage) {
    storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
    });
  }
  return storage;
}

export async function getSignedUploadUrl(
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; gcsPath: string; publicUrl: string }> {
  const bucket = getStorage().bucket(process.env.GCS_BUCKET_NAME!);
  const gcsPath = `products/${Date.now()}-${fileName}`;
  const file = bucket.file(gcsPath);

  const [uploadUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

  const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${gcsPath}`;

  return { uploadUrl, gcsPath, publicUrl };
}

export async function deleteFile(gcsPath: string): Promise<void> {
  const bucket = getStorage().bucket(process.env.GCS_BUCKET_NAME!);
  await bucket.file(gcsPath).delete({ ignoreNotFound: true });
}

export async function getSignedReadUrl(gcsPath: string): Promise<string> {
  const bucket = getStorage().bucket(process.env.GCS_BUCKET_NAME!);
  const [url] = await bucket.file(gcsPath).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  return url;
}
