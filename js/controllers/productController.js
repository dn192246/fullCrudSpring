// js/controllers/productController.js

// --- 1. Importamos servicios para comunicación con la API ---
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/productService.js";

import { getCategories } from "../services/categoryService.js";
import { uploadImageToFolder } from "../services/imageService.js";

// --- 2. Variables globales para la paginación ---
let currentPage = 0;
let currentSize = 10;

// --- 3. Se ejecuta cuando el DOM está cargado ---
document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM
  const tableBody = document.querySelector("#itemsTable tbody");
  const form = document.getElementById("productForm");
  const modal = new bootstrap.Modal(document.getElementById("itemModal")); // Bootstrap modal
  const modalLabel = document.getElementById("itemModalLabel");
  const btnAdd = document.getElementById("btnAdd");
  const select = document.getElementById("productCategory");

  // Campos para manejo de imágenes
  const imageFileInput = document.getElementById("productImageFile"); // Input type="file"
  const imageUrlHidden = document.getElementById("productImageUrl"); // Campo hidden
  const imagePreview = document.getElementById("productImagePreview"); // Preview <img>

  // --- 4. Previsualizar imagen seleccionada ---
  if (imageFileInput && imagePreview) {
    imageFileInput.addEventListener("change", () => {
      const file = imageFileInput.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => (imagePreview.src = reader.result); // Mostrar preview
        reader.readAsDataURL(file);
      } else {
        imagePreview.src = imageUrlHidden?.value || "";
      }
    });
  }

  // --- 5. Selector de tamaño de página ---
  const sizeSelector = document.getElementById("pageSize");
  sizeSelector.addEventListener("change", () => {
    currentSize = parseInt(sizeSelector.value);
    currentPage = 0;
    cargarProductos();
  });

  // --- 6. Botón "Agregar" resetea formulario y abre modal ---
  btnAdd.addEventListener("click", () => {
    limpiarFormulario();
    modalLabel.textContent = "Agregar Producto";
    modal.show();
  });

  // --- 7. Submit del formulario (Crear/Actualizar producto) ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let id = form.productId.value;

    // --- 8. Manejo de imagen: usar valor actual o subir nueva ---
    let finalImageUrl = imageUrlHidden?.value || "";
    const file = imageFileInput?.files?.[0];
    if (file) {
      try {
        const data = await uploadImageToFolder(file, "products"); // Subir al backend
        finalImageUrl = data.url || "";
      } catch (err) {
        console.error("Error subiendo imagen:", err);
        alert("No se pudo subir la imagen. Intenta nuevamente.");
        return; // Si falla la subida, no guardamos producto
      }
    }

    // --- 9. Construcción del payload para enviar a API ---
    const payload = {
      nombre: form.productName.value.trim(),
      precio: Number(form.productPrice.value),
      descripcion: form.productDescription.value.trim(),
      stock: Number(form.productStock.value),
      fechaIngreso: form.productDate.value,
      categoriaId: Number(form.productCategory.value),
      usuarioId: 2, // Por ahora fijo
      imagen_url: finalImageUrl || null, // Campo correcto según backend
    };

    // --- 10. Crear o actualizar producto ---
    try {
      if (id) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }
      modal.hide();
      await cargarProductos(); // Refrescar tabla
    } catch (err) {
      console.error("Error guardando:", err);
      alert("Ocurrió un error al guardar el producto.");
    }
  });

  // --- 11. Función para cargar productos con paginación ---
  async function cargarProductos() {
    try {
      const data = await getProducts(currentPage, currentSize);
      const items = data.content || [];

      tableBody.innerHTML = "";
      renderPagination(data.number, data.totalPages);

      // --- 12. Renderizado de filas en la tabla ---
      items.forEach((item) => {
        const tr = document.createElement("tr");

        // ID
        const tdId = document.createElement("td");
        tdId.textContent = item.id;
        tr.appendChild(tdId);

        // Imagen
        const tdImg = document.createElement("td");
        if (item.imagen_url) {
          const img = document.createElement("img");
          img.className = "thumb";
          img.alt = "img";
          img.src = item.imagen_url; // Opcional: validar dominio aquí
          tdImg.appendChild(img);
        } else {
          const span = document.createElement("span");
          span.className = "text-muted";
          span.textContent = "Sin imagen";
          tdImg.appendChild(span);
        }
        tr.appendChild(tdImg);

        // Nombre
        const tdNombre = document.createElement("td");
        tdNombre.textContent = item.nombre;
        tr.appendChild(tdNombre);

        // Descripción
        const tdDesc = document.createElement("td");
        tdDesc.textContent = item.descripcion;
        tr.appendChild(tdDesc);

        // Stock
        const tdStock = document.createElement("td");
        tdStock.textContent = item.stock;
        tr.appendChild(tdStock);

        // Fecha
        const tdFecha = document.createElement("td");
        tdFecha.textContent = item.fechaIngreso;
        tr.appendChild(tdFecha);

        // Precio
        const tdPrecio = document.createElement("td");
        tdPrecio.textContent = `$${Number(item.precio).toFixed(2)}`;
        tr.appendChild(tdPrecio);

        // Botones Editar/Eliminar
        const tdBtns = document.createElement("td");

        const btnEdit = document.createElement("button");
        btnEdit.className = "btn btn-sm btn-outline-secondary me-1 edit-btn";
        btnEdit.title = "Editar";

        //El ícono del botón es sacado de lucide.dev
        btnEdit.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pen-icon lucide-square-pen"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>
          `;
        btnEdit.addEventListener("click", () => setFormulario(item));
        tdBtns.appendChild(btnEdit);

        const btnDel = document.createElement("button");
        btnDel.className = "btn btn-sm btn-outline-danger delete-btn";
        btnDel.title = "Eliminar";

        //El ícono del botón es sacado de lucide.dev
        btnDel.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          `;
        btnDel.addEventListener("click", () => {
          if (confirm("¿Eliminar este producto?")) {
            eliminarProducto(item.id);
          }
        });
        tdBtns.appendChild(btnDel);

        tr.appendChild(tdBtns);
        tableBody.appendChild(tr);
      });
    } catch (err) {
      console.error("Error cargando productos:", err);
    }
  }

  // --- 13. Cargar categorías para <select> ---
  async function cargarCategorias() {
    try {
      const categories = await getCategories();
      select.innerHTML = "";
      const opt = document.createElement("option");
      opt.value = "";
      opt.disabled = true;
      opt.selected = true;
      opt.hidden = true;
      opt.textContent = "Seleccione...";
      select.appendChild(opt);

      categories.forEach((c) => {
        const option = document.createElement("option");
        option.value = c.idCategoria;
        option.textContent = c.nombreCategoria;
        option.title = c.descripcion;
        select.appendChild(option);
      });
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  }

  // --- 14. Rellenar formulario para editar producto ---
  function setFormulario(item) {
    form.productId.value = item.id;
    form.productName.value = item.nombre;
    form.productPrice.value = item.precio;
    form.productStock.value = item.stock;
    form.productDescription.value = item.descripcion;
    form.productCategory.value = item.categoriaId;
    form.productDate.value = item.fechaIngreso;

    if (imageUrlHidden) imageUrlHidden.value = item.imagen_url || "";
    if (imagePreview) imagePreview.src = item.imagen_url || "";
    if (imageFileInput) imageFileInput.value = "";

    modalLabel.textContent = "Editar Producto";
    modal.show();
  }

  // --- 15. Resetear formulario (al agregar nuevo producto) ---
  function limpiarFormulario() {
    form.reset();
    form.productId.value = "";
    if (imageUrlHidden) imageUrlHidden.value = "";
    if (imagePreview) imagePreview.src = "";
    if (imageFileInput) imageFileInput.value = "";
  }

  // --- 16. Eliminar producto por ID ---
  async function eliminarProducto(id) {
    try {
      await deleteProduct(id);
      await cargarProductos();
    } catch (err) {
      console.error("Error eliminando:", err);
    }
  }

  // --- 17. Renderizado de paginación ---
  function renderPagination(current, totalPages) {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    // Botón Anterior
    const prev = document.createElement("li");
    prev.className = `page-item ${current === 0 ? "disabled" : ""}`;
    const prevLink = document.createElement("a");
    prevLink.className = "page-link";
    prevLink.href = "#";
    prevLink.textContent = "Anterior";
    prevLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (current > 0) {
        currentPage = current - 1;
        cargarProductos();
      }
    });
    prev.appendChild(prevLink);
    pagination.appendChild(prev);

    // Números de página
    for (let i = 0; i < totalPages; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === current ? "active" : ""}`;
      const link = document.createElement("a");
      link.className = "page-link";
      link.href = "#";
      link.textContent = i + 1;
      link.addEventListener("click", (e) => {
        e.preventDefault();
        currentPage = i;
        cargarProductos();
      });
      li.appendChild(link);
      pagination.appendChild(li);
    }

    // Botón Siguiente
    const next = document.createElement("li");
    next.className = `page-item ${current >= totalPages - 1 ? "disabled" : ""}`;
    const nextLink = document.createElement("a");
    nextLink.className = "page-link";
    nextLink.href = "#";
    nextLink.textContent = "Siguiente";
    nextLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (current < totalPages - 1) {
        currentPage = current + 1;
        cargarProductos();
      }
    });
    next.appendChild(nextLink);
    pagination.appendChild(next);
  }

  // --- 18. Cargar datos iniciales ---
  cargarCategorias();
  cargarProductos();
});
