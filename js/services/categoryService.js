// js/services/categoryService.js
const API_URL = "https://learnapifront-9de8a2348f9a.herokuapp.com/api/category";

export async function getCategories(page = 0, size = 5) {
  const res = await fetch(`${API_URL}/getDataCategory?page=${page}&size=${size}`);
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
