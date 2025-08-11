// js/services/categoryService.js
const API_URL = "http://10.10.0.97:8080/api/category";

export async function getCategories() {
  const res = await fetch(`${API_URL}/getDataCategories`);
  return res.json();
}

export async function createCategory(payload) {
  await fetch(`${API_URL}/newCategory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(id, payload) {
  await fetch(`${API_URL}/updateCategory/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(id) {
  await fetch(`${API_URL}/deleteCategory/${id}`, {
    method: "DELETE",
  });
}
