/**
 * UploadThing client-side utilities.
 * Used by the lecturer materials page to upload large files directly to UploadThing storage.
 */

import { generateUploadButton } from "@uploadthing/react"

// Define the file router type to match the server-side route
type FileRouter = {
  courseMaterialUploader: {
    input: void
    output: {
      url: string
      key: string
      name: string
      size: number
      type: string
    }
  }
}

// Generate a typed upload button component
export const UTButton = generateUploadButton<FileRouter>()

/**
 * Upload a file to UploadThing programmatically and return the resulting URL.
 *
 * @param file — The File object to upload
 * @returns — The public URL of the uploaded file
 */
export async function uploadToUploadThing(file: File): Promise<string> {
  // Step 1: Get presigned URL from UploadThing route
  const presignRes = await fetch("/api/uploadthing", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-uploadthing-package": "uploadthing/client",
    },
    body: JSON.stringify({
      "courseMaterialUploader": {},
    }),
  })

  if (!presignRes.ok) {
    const errorText = await presignRes.text()
    throw new Error(`UploadThing presign failed (${presignRes.status}): ${errorText}`)
  }

  const presignData = await presignRes.json()

  // UploadThing returns an array of presigned URLs
  if (!Array.isArray(presignData) || presignData.length === 0) {
    throw new Error("UploadThing returned no upload URLs")
  }

  const { url, key } = presignData[0]

  // Step 2: Upload the file directly to UploadThing's storage via PUT
  const uploadRes = await fetch(url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  })

  if (!uploadRes.ok) {
    throw new Error(`Upload failed with status ${uploadRes.status}`)
  }

  // Step 3: Return the public URL
  // UploadThing files are accessible at https://utfs.io/f/<key>
  return `https://utfs.io/f/${key}`
}
