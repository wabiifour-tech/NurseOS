import { createRouteHandler } from "uploadthing/next"
import { createUploadthing } from "uploadthing/server"

const f = createUploadthing()

// File route configuration for UploadThing
export const { GET, POST } = createRouteHandler({
  router: {
    // Course materials upload — allows PDFs, PowerPoints, Documents, Images, Videos
    // Max file size: 512 MB
    courseMaterialUploader: f({
      "application/pdf": { maxFileSize: "512MB" },
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": { maxFileSize: "512MB" },
      "application/vnd.ms-powerpoint": { maxFileSize: "512MB" },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "512MB" },
      "application/msword": { maxFileSize: "512MB" },
      "text/plain": { maxFileSize: "512MB" },
      "image/png": { maxFileSize: "512MB" },
      "image/jpeg": { maxFileSize: "512MB" },
      "image/jpg": { maxFileSize: "512MB" },
      "application/octet-stream": { maxFileSize: "512MB" },
      "video/mp4": { maxFileSize: "512MB" },
    })
      .middleware(async ({ req }) => {
        const { getAuthenticatedUser } = await import("@/lib/auth")
        const authUser = await getAuthenticatedUser(req as any)

        if (!authUser) {
          throw new Error("Unauthorized — please log in to upload files")
        }

        if (authUser.academicRole !== 'LECTURER' && authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
          throw new Error("Only lecturers or institution admins can upload materials")
        }

        return {
          userId: authUser.id,
          facilityId: authUser.facilityId,
        }
      })
      .onUploadComplete(async ({ metadata, file }) => {
        console.log("[UploadThing] Upload complete:", file.name, "→", file.url)
      }),
  },
})
