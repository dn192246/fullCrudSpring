import {
  getCategories,
  updateCategory,
  deleteCategory,
  createCategory,
} from "../services/categoryService.js";

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector("#categoriesTable tbody");
  const form = document.getElementById("categoryForm");
  const modal = new bootstrap.Modal(document.getElementById("categoryModal"));
  const lbModal = document.getElementById("categoryModalLabel");
  const btnAdd = document.getElementById("btnAddCategory");

  loadCategories();

  btnAdd.addEventListener("click", () => {
    form.reset();
    form.categoryId.value = "";
    lbModal.textContent = "Agregar Categoría";
    modal.show();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = form.categoryId.value;

    const data = {
      nombreCategoria: form.categoryName.value.trim(),
      descripcion: form.categoryDescription.value.trim(),
    };

    try {
      if (id) {
        await updateCategory(id, data);
      } else {
        await createCategory(data);
      }
      modal.hide();
      await loadCategories();
    } catch (err) {
      console.error("Error al guardar la categoría: ", err);
    }
  });

  async function loadCategories() {
    try {
      const categories = await getCategories();
      tableBody.innerHTML = "";

      if (!categories || categories.length == 0) {
        tableBody.innerHTML =
          '<td colspan="5">Actualmente no hay registros</td>';
        return;
      }

      categories.forEach((cat) => {
        const tr = document.createElement("tr");

        // Columna ID
        const tdId = document.createElement("td");
        tdId.textContent = cat.idCategoria;

        // Columna Nombre
        const tdNombre = document.createElement("td");
        tdNombre.textContent = cat.nombreCategoria;

        // Columna Descripción
        const tdDesc = document.createElement("td");
        tdDesc.textContent =
          cat.descripcion || "Descripción no asignada";

        // Columna Fecha
        const tdFecha = document.createElement("td");
        tdFecha.textContent = cat.fechaCreacion || "";

        // Columna Botones (aquí sí usamos innerHTML, pero con contenido fijo/seguro)
        const tdBtns = document.createElement("td");
        tdBtns.innerHTML = `
          <button class="btn btn-sm btn-outline-secondary edit-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" 
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
              class="lucide lucide-square-pen">
              <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>
              </svg>
          </button>
          <button class="btn btn-sm btn-outline-danger delete-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
              class="lucide lucide-trash">
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
              <path d="M3 6h18"/>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
          </button>
        `;

        // Eventos
        tdBtns.querySelector(".edit-btn").addEventListener("click", () => {
          form.categoryId.value = cat.idCategoria;
          form.categoryName.value = cat.nombreCategoria;
          form.categoryDescription.value = cat.descripcion;
          lbModal.textContent = "Editar Categoría";
          modal.show();
        });

        tdBtns.querySelector(".delete-btn").addEventListener("click", async () => {
          if (confirm("¿Desea eliminar la categoría?")) {
            await deleteCategory(cat.idCategoria);
            await loadCategories();
          }
        });

        // Agregar todo al tr
        tr.appendChild(tdId);
        tr.appendChild(tdNombre);
        tr.appendChild(tdDesc);
        tr.appendChild(tdFecha);
        tr.appendChild(tdBtns);

        tableBody.appendChild(tr);
      });
    } catch (err) {
      console.error("Error cargando categorías: ", err);
    }
  }
});
