const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "mytube_upload"

function buildCloudinaryUploadUrl() {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error("Missing VITE_CLOUDINARY_CLOUD_NAME")
  }

  return `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`
}

export function uploadToCloudinary(file, onProgress) {
  if (!file) {
    return Promise.reject(new Error("File is required"))
  }

  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.open("POST", buildCloudinaryUploadUrl())

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || typeof onProgress !== "function") return

      const percent = Math.round((event.loaded * 100) / event.total)
      onProgress(percent)
    }

    xhr.onload = () => {
      let response = null

      try {
        response = JSON.parse(xhr.responseText)
      } catch {
        response = null
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(response)
        return
      }

      reject(new Error(response?.error?.message || response?.message || `Cloudinary upload failed with status ${xhr.status}`))
    }

    xhr.onerror = () => {
      reject(new Error("Cloudinary upload failed"))
    }

    xhr.send(formData)
  })
}