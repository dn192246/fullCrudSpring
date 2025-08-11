// js/controllers/categoryController.js
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/categoryService.js";

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector("#categoriesTable tbody");
  const form = document.getElementById("categoryForm");
  const modal = new bootstrap.Modal(document.getElementById("categoryModal"));
  const lblModal = document.getElementById("categoryModalLabel");
  const btnAdd = document.getElementById("btnAddCategory");

  init();

  btnAdd.addEventListener("click", () => {
    form.reset();
    form.categoryId.value = "";
    lblModal.textContent = "Agregar Categoría";
    modal.show();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = form.categoryId.value;
    const date = new Date();
    const payload = {
      nombreCategoria: form.categoryName.value.trim(),
      descripcion: form.categoryDescription.value.trim(),
      //fechaCreacion: id ? null : date,
    };

    try {
      if (id) {
        await updateCategory(id, payload);
      } else {
        await createCategory(payload);
      }
      modal.hide();
      await loadCategories();
    } catch (err) {
      console.error("Error guardando categoría:", err);
    }
  });

  async function loadCategories() {
    try {
      const data = await getCategories();
      const cats = data.content;
      tableBody.innerHTML = "";

      if (cats.length === 0) {
        tableBody.innerHTML =
          '<td colspan="5">Actualmente no hay registros</td>';
        return;
      }

      cats.forEach((cat) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${cat.idCategoria}</td>
          <td>${cat.nombreCategoria}</td>
          <td>${cat.descripcion || ""}</td>
          <td>${cat.fechaCreacion || ""}</td>
          <td>
            <button class="btn btn-sm btn-outline-secondary edit-btn"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pen-icon lucide-square-pen"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg></button>

            <button class="btn btn-sm btn-outline-danger delete-btn"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-icon lucide-trash"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </td>
        `;

        tr.querySelector(".edit-btn").addEventListener("click", () => {
          form.categoryId.value = cat.idCategoria;
          form.categoryName.value = cat.nombreCategoria;
          form.categoryDescription.value = cat.descripcion;
          lblModal.textContent = "Editar Categoría";
          modal.show();
        });

        tr.querySelector(".delete-btn").addEventListener("click", () => {
          if (confirm("¿Eliminar esta categoría?")) {
            deleteCategory(cat.idCategoria).then(loadCategories);
          }
        });

        tableBody.appendChild(tr);
      });
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  }

  function init() {
    loadCategories();
  }
});
