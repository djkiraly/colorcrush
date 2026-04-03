import { Storage } from "@google-cloud/storage";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

let storage: Storage | null = null;
let cachedGcsConfig: { bucketName: string; projectId: string } | null = null;

interface GcsSettings {
  projectId: string;
  bucketName: string;
  serviceAccount: Record<string, unknown> | null;
}

async function loadGcsConfig(): Promise<GcsSettings> {
  try {
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "gcs"))
      .limit(1);

    if (row?.value) {
      const val = row.value as GcsSettings;
      return {
        projectId: val.projectId || process.env.GCS_PROJECT_ID || "",
        bucketName: val.bucketName || process.env.GCS_BUCKET_NAME || "",
        serviceAccount: val.serviceAccount || null,
      };
    }
  } catch {
    // DB not available, fall back to env
  }

  return {
    projectId: process.env.GCS_PROJECT_ID || "",
    bucketName: process.env.GCS_BUCKET_NAME || "",
    serviceAccount: null,
  };
}

async function getStorage(): Promise<{ storage: Storage; bucketName: string }> {
  const config = await loadGcsConfig();

  // Invalidate cached storage if config changed
  if (
    cachedGcsConfig &&
    (cachedGcsConfig.bucketName !== config.bucketName ||
      cachedGcsConfig.projectId !== config.projectId)
  ) {
    storage = null;
  }

  if (!storage) {
    const opts: ConstructorParameters<typeof Storage>[0] = {
      projectId: config.projectId,
    };

    if (config.serviceAccount) {
      opts.credentials = config.serviceAccount as {
        client_email: string;
        private_key: string;
      };
    }

    storage = new Storage(opts);
    cachedGcsConfig = {
      bucketName: config.bucketName,
      projectId: config.projectId,
    };
  }

  return { storage, bucketName: config.bucketName };
}

/**
 * Force-reload the Storage client on next call (e.g. after settings change).
 */
export function invalidateGcsClient(): void {
  storage = null;
  cachedGcsConfig = null;
}

export async function getSignedUploadUrl(
  fileName: string,
  contentType: string,
  pathPrefix: string = "products"
): Promise<{ uploadUrl: string; gcsPath: string; publicUrl: string }> {
  const { storage, bucketName } = await getStorage();
  const bucket = storage.bucket(bucketName);
  const gcsPath = `${pathPrefix}/${Date.now()}-${fileName}`;
  const file = bucket.file(gcsPath);

  const [uploadUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

  const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsPath}`;

  return { uploadUrl, gcsPath, publicUrl };
}

export async function deleteFile(gcsPath: string): Promise<void> {
  const { storage, bucketName } = await getStorage();
  const bucket = storage.bucket(bucketName);
  await bucket.file(gcsPath).delete({ ignoreNotFound: true });
}

export async function getSignedReadUrl(gcsPath: string): Promise<string> {
  const { storage, bucketName } = await getStorage();
  const bucket = storage.bucket(bucketName);
  const [url] = await bucket.file(gcsPath).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  return url;
}

/**
 * Test the GCS connection with current settings.
 */
export async function testGcsConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { storage, bucketName } = await getStorage();
    if (!bucketName) {
      return { success: false, error: "No bucket name configured" };
    }
    const [exists] = await storage.bucket(bucketName).exists();
    return exists
      ? { success: true }
      : { success: false, error: `Bucket "${bucketName}" not found` };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
