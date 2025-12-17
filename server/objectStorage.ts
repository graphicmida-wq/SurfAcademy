// Reference: blueprint:javascript_object_storage - Core object storage service
import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }

  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
      });

      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async getObjectEntityUploadURL(): Promise<{ uploadUrl: string; objectPath: string }> {
    // Use PUBLIC directory for production-compatible images
    const publicPaths = this.getPublicObjectSearchPaths();
    if (!publicPaths || publicPaths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var."
      );
    }

    const publicDir = publicPaths[0]; // Use first public directory
    const objectId = randomUUID();
    const fullPath = `${publicDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    const uploadUrl = await signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });

    // In development: use /objects/ path for proxy (works with sidecar)
    // In production: use public GCS URL (works without sidecar)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const objectPath = isDevelopment 
      ? `/objects/uploads/${objectId}`
      : `https://storage.googleapis.com/${bucketName}/${objectName}`;

    return {
      uploadUrl,
      objectPath,
    };
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    
    // Try public directory first (new uploads)
    const publicPaths = this.getPublicObjectSearchPaths();
    if (publicPaths && publicPaths.length > 0) {
      let publicDir = publicPaths[0];
      if (!publicDir.endsWith("/")) {
        publicDir = `${publicDir}/`;
      }
      const publicObjectPath = `${publicDir}${entityId}`;
      const { bucketName: publicBucket, objectName: publicObject } = parseObjectPath(publicObjectPath);
      const bucket = objectStorageClient.bucket(publicBucket);
      const publicFile = bucket.file(publicObject);
      const [publicExists] = await publicFile.exists();
      if (publicExists) {
        return publicFile;
      }
    }
    
    // Fall back to private directory (old uploads)
    let privateDir = this.getPrivateObjectDir();
    if (!privateDir.endsWith("/")) {
      privateDir = `${privateDir}/`;
    }
    const privateObjectPath = `${privateDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(privateObjectPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const privateFile = bucket.file(objectName);
    const [privateExists] = await privateFile.exists();
    if (!privateExists) {
      throw new ObjectNotFoundError();
    }
    return privateFile;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }

    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;

    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }

    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }

    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }

  // Convert /objects/ path to public GCS URL for production access
  convertToPublicUrl(objectPath: string): string {
    // If already a public URL, return as is
    if (objectPath.startsWith("https://")) {
      return objectPath;
    }

    // Convert /objects/uploads/... to public GCS URL
    if (objectPath.startsWith("/objects/")) {
      const privateDir = this.getPrivateObjectDir();
      const { bucketName } = parseObjectPath(privateDir);
      const entityId = objectPath.replace("/objects/", "");
      // Images were uploaded to .private, but we need to access them
      return `https://storage.googleapis.com/${bucketName}/.private/${entityId}`;
    }

    return objectPath;
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }

  // Copy a file from private to public directory and return the public URL
  async copyToPublic(fileId: string): Promise<string> {
    const privateDir = this.getPrivateObjectDir();
    const publicPaths = this.getPublicObjectSearchPaths();
    
    if (!publicPaths || publicPaths.length === 0) {
      throw new Error("PUBLIC_OBJECT_SEARCH_PATHS not configured");
    }
    
    const { bucketName } = parseObjectPath(privateDir);
    const bucket = objectStorageClient.bucket(bucketName);
    
    const sourceObjectName = `.private/uploads/${fileId}`;
    const destObjectName = `public/uploads/${fileId}`;
    
    const sourceFile = bucket.file(sourceObjectName);
    const destFile = bucket.file(destObjectName);
    
    // Check if source exists
    const [sourceExists] = await sourceFile.exists();
    if (!sourceExists) {
      throw new Error(`Source file not found: ${sourceObjectName}`);
    }
    
    // Check if destination already exists
    const [destExists] = await destFile.exists();
    if (!destExists) {
      // Copy the file
      await sourceFile.copy(destFile);
      console.log(`Copied ${sourceObjectName} to ${destObjectName}`);
    } else {
      console.log(`File already exists: ${destObjectName}`);
    }
    
    // Return the public URL
    return `https://storage.googleapis.com/${bucketName}/${destObjectName}`;
  }
}

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return { bucketName, objectName };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}
