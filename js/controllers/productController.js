// js/controllers/productController.js

// --- Importaciones de servicios ---
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/productService.js";

import { getCategories } from "../services/categoryService.js";

// Subida de imágenes
import { uploadImage } from "../services/imageService.js";

// --- Estado de paginación ---
let currentPage = 0;
let currentSize = 10;

document.addEventListener("DOMContentLoaded", () => {
  // --- Referencias DOM ---
  const tableBody = document.querySelector("#itemsTable tbody");
  const form = document.getElementById("productForm");
  const modal = new bootstrap.Modal(document.getElementById("itemModal"));
  const modalLabel = document.getElementById("itemModalLabel");
  const btnAdd = document.getElementById("btnAdd");
  const select = document.getElementById("productCategory");

  // Elementos para imagen
  const imageFileInput = document.getElementById("productImageFile");  // <input type="file">
  const imageUrlHidden = document.getElementById("productImageUrl");   // <input type="hidden">
  const imagePreview = document.getElementById("productImagePreview"); // <img>

  // Vista previa al seleccionar archivo
  if (imageFileInput && imagePreview) {
    imageFileInput.addEventListener("change", () => {
      const file = imageFileInput.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => (imagePreview.src = reader.result);
        reader.readAsDataURL(file);
      } else {
        imagePreview.src = imageUrlHidden?.value || "";
      }
    });
  }

  // Selector de tamaño de página
  const sizeSelector = document.getElementById("pageSize");
  sizeSelector.addEventListener("change", () => {
    currentSize = parseInt(sizeSelector.value);
    currentPage = 0;
    cargarProductos();
  });

  // Abrir modal (Agregar)
  btnAdd.addEventListener("click", () => {
    limpiarFormulario();
    modalLabel.textContent = "Agregar Producto";
    modal.show();
  });

  // Envío del formulario (crear/actualizar)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let id = form.productId.value;

    // 1) Subir imagen si hay archivo nuevo
    let finalImageUrl = imageUrlHidden?.value || "";
    const file = imageFileInput?.files?.[0];
    if (file) {
      try {
        const data = await uploadImage(file); // { message, url }
        finalImageUrl = data.url || "";
      } catch (err) {
        console.error("Error subiendo imagen:", err);
        alert("No se pudo subir la imagen. Intenta nuevamente.");
        return;
      }
    }

    // 2) Armar payload (incluye imagen_url)
    const payload = {
      nombre: form.productName.value.trim(),
      precio: Number(form.productPrice.value),
      descripcion: form.productDescription.value.trim(),
      stock: Number(form.productStock.value),
      fechaIngreso: form.productDate.value,
      categoriaId: Number(form.productCategory.value),
      usuarioId: 2, // si aplica en tu API
      imagen_url: finalImageUrl || null, // <-- campo correcto
    };

    try {
      if (id) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }
      modal.hide();
      await cargarProductos();
    } catch (err) {
      console.error("Error guardando:", err);
      alert("Ocurrió un error al guardar el producto.");
    }
  });

  // --- Cargar productos y renderizar tabla ---
  async function cargarProductos() {
    try {
      const data = await getProducts(currentPage, currentSize);
      const items = data.content || [];

      tableBody.innerHTML = "";

      // Render de paginación (una vez por lote)
      renderPagination(data.number, data.totalPages);

      items.forEach((item) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${item.id}</td>
          <td>${ item.imagen_url ? `<img src="${item.imagen_url}" class="thumb" alt="img">` : `<span class="text-muted">Sin imagen</span>` }</td>
          <td>${item.nombre}</td>
          <td>${item.descripcion}</td>
          <td>${item.stock}</td>
          <td>${item.fechaIngreso}</td>
          <td>$${Number(item.precio).toFixed(2)}</td>
          <td>
            <button class="btn btn-sm btn-outline-secondary me-1 edit-btn" title="Editar">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                   class="lucide lucide-square-pen-icon lucide-square-pen">
                <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>
              </svg>
            </button>

            <button class="btn btn-sm btn-outline-danger delete-btn" title="Eliminar">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                   class="lucide lucide-trash-icon lucide-trash">
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                <path d="M3 6h18"/>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </td>
        `;

        tr.querySelector(".edit-btn").addEventListener("click", () =>
          setFormulario(item)
        );

        tr.querySelector(".delete-btn").addEventListener("click", () => {
          if (confirm("¿Eliminar este producto?")) {
            eliminarProducto(item.id);
          }
        });

        tableBody.appendChild(tr);
      });
    } catch (err) {
      console.error("Error cargando productos:", err);
    }
  }

  // --- Llenar <select> categorías ---
  async function cargarCategorias() {
    try {
      const categories = await getCategories();
      select.innerHTML =
        '<option value="" disabled selected hidden>Seleccione...</option>';
      categories.forEach((c) => {
        select.innerHTML += `<option value="${c.idCategoria}" title="${c.descripcion}">${c.nombreCategoria}</option>`;
      });
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  }

  // --- Cargar datos en el formulario (editar) ---
  function setFormulario(item) {
    form.productId.value = item.id;
    form.productName.value = item.nombre;
    form.productPrice.value = item.precio;
    form.productStock.value = item.stock;
    form.productDescription.value = item.descripcion;
    form.productCategory.value = item.categoriaId;
    form.productDate.value = item.fechaIngreso;

    // Imagen existente
    if (imageUrlHidden) imageUrlHidden.value = item.imagen_url || "";
    if (imagePreview) imagePreview.src = item.imagen_url || "";
    if (imageFileInput) imageFileInput.value = ""; // limpiar selección

    modalLabel.textContent = "Editar Producto";
    modal.show();
  }

  // --- Limpiar formulario (nuevo) ---
  function limpiarFormulario() {
    form.reset();
    form.productId.value = "";
    if (imageUrlHidden) imageUrlHidden.value = "";
    if (imagePreview) imagePreview.src = "";
    if (imageFileInput) imageFileInput.value = "";
  }

  // --- Eliminar ---
  async function eliminarProducto(id) {
    try {
      await deleteProduct(id);
      await cargarProductos();
    } catch (err) {
      console.error("Error eliminando:", err);
    }
  }

  // --- Paginación ---
  function renderPagination(current, totalPages) {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    const prev = document.createElement("li");
    prev.className = `page-item ${current === 0 ? "disabled" : ""}`;
    prev.innerHTML = `<a class="page-link" href="#">Anterior</a>`;
    prev.addEventListener("click", (e) => {
      e.preventDefault();
      if (current > 0) {
        currentPage = current - 1;
        cargarProductos();
      }
    });
    pagination.appendChild(prev);

    for (let i = 0; i < totalPages; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === current ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${i + 1}</a>`;
      li.addEventListener("click", (e) => {
        e.preventDefault();
        currentPage = i;
        cargarProductos();
      });
      pagination.appendChild(li);
    }

    const next = document.createElement("li");
    next.className = `page-item ${current >= totalPages - 1 ? "disabled" : ""}`;
    next.innerHTML = `<a class="page-link" href="#">Siguiente</a>`;
    next.addEventListener("click", (e) => {
      e.preventDefault();
      if (current < totalPages - 1) {
        currentPage = current + 1;
        cargarProductos();
      }
    });
    pagination.appendChild(next);
  }

  // --- Arranque ---
  cargarCategorias();
  cargarProductos();
});