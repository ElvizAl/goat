"use server"

import { put, del } from "@vercel/blob"
import { imageUploadSchema } from "@/validasi/validasi"

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      return { error: "No file provided" }
    }

    // Validate the file
    const validation = imageUploadSchema.safeParse({ file })
    if (!validation.success) {
      return { error: validation.error.errors[0].message }
    }

    // Generate a unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop()
    const filename = `fruits/${timestamp}-${randomString}.${fileExtension}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    return {
      success: true,
      data: {
        url: blob.url,
        filename: filename,
      },
    }
  } catch (error) {
    console.error("Error uploading image:", error)
    return { error: "Failed to upload image" }
  }
}

export async function deleteImage(url: string) {
  try {
    await del(url)
    return { success: true }
  } catch (error) {
    console.error("Error deleting image:", error)
    return { error: "Failed to delete image" }
  }
}
