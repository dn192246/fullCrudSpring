// js/services/imageService.js
//const IMAGE_API = 'http://localhost:8080/api/image'; // Local
const IMAGE_API = 'http://10.10.0.97:8080/api/image'; // Remoto

// Sube una imagen y devuelve el JSON del backend: { message, url }
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file); // Debe coincidir con @RequestParam("image")

  const res = await fetch(`${IMAGE_API}/upload`, {
    method: 'POST',
    body: formData,
  });

  return res.json();
}

// Sube a una carpeta específica
export async function uploadImageToFolder(file, folder) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);

  const res = await fetch(`${IMAGE_API}/upload-to-folder`, {
    method: 'POST',
    body: formData,
  });

  return res.json();
}
