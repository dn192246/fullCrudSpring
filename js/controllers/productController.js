// js/controllers/productController.js

// --- Importaciones de servicios ---
// Funciones para consumir la API de productos (listar, crear, actualizar, eliminar)
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/productService.js";

// Función para obtener categorías (para llenar el <select>)
import { getCategories } from "../services/categoryService.js";

// --- Estado de paginación (página actual y tamaño de página) ---
let currentPage = 0;
let currentSize = 10;

// Esperar a que el DOM esté listo para consultar elementos y asignar eventos
document.addEventListener("DOMContentLoaded", () => {
  // --- Referencias a elementos del DOM ---
  const tableBody = document.querySelector("#itemsTable tbody"); // Cuerpo de la tabla de productos
  const form = document.getElementById("productForm");            // Formulario del modal
  const modal = new bootstrap.Modal(document.getElementById("itemModal")); // Instancia del modal Bootstrap
  const modalLabel = document.getElementById("itemModalLabel");   // Título del modal
  const btnAdd = document.getElementById("btnAdd");               // Botón "Agregar"
  const select = document.getElementById("productCategory");      // <select> de categorías

  // Selector de tamaño de página (control de paginación en UI)
  const sizeSelector = document.getElementById("pageSize");
  sizeSelector.addEventListener("change", () => {
    // Al cambiar el tamaño de página, reiniciar a la primera página y recargar
    currentSize = parseInt(sizeSelector.value);
    currentPage = 0;
    cargarProductos();
  });

  // --- Abrir modal en modo "Agregar" ---
  btnAdd.addEventListener("click", () => {
    limpiarFormulario();                 // Quita valores previos del formulario
    modalLabel.textContent = "Agregar Producto"; // Cambia el título del modal
    modal.show();                        // Muestra el modal
  });

  // --- Envío del formulario (crear o actualizar) ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();                  // Evita el submit por defecto del navegador
    let id = form.productId.value;       // ID del producto (si existe, es edición)

    // Objeto con los datos que se enviarán al backend
    const payload = {
      nombre: form.productName.value.trim(),
      precio: Number(form.productPrice.value),        // Asegurar número
      descripcion: form.productDescription.value.trim(),
      stock: form.productStock.value.trim(),
      fechaIngreso: form.productDate.value,
      categoriaId: form.productCategory.value,        // ID de categoría seleccionada
      usuarioId: 2,                                   // Ejemplo de usuario fijo
    };

    // alert(JSON.stringify(payload) + " ,id:" + id); // Debug opcional

    try {
      if (id) {
        // Si hay ID -> actualizar
        await updateProduct(id, payload);
        id = null; // Limpia variable local de ID
      } else {
        // Si no hay ID -> crear nuevo
        await createProduct(payload);
      }
      modal.hide();         // Cierra el modal después de guardar
      await cargarProductos(); // Refresca la lista
    } catch (err) {
      console.error("Error guardando:", err);
    }
  });

  // --- Obtener y renderizar productos desde la API ---
  async function cargarProductos() {
    try {
      // Llama a la API con paginación (página y tamaño actuales)
      let data = await getProducts(currentPage, currentSize);
      // El backend devuelve un Page<T>: extraer el arreglo en "content"
      let items = data.content;

      // Limpia la tabla antes de dibujar
      tableBody.innerHTML = "";

      // Recorre cada producto y crea su fila en la tabla
      items.forEach((item) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${item.id}</td>
          <td>${item.nombre}</td>
          <td>${item.descripcion}</td>
          <td>${item.stock}</td>
          <td>${item.fechaIngreso}</td>
          <td>$${item.precio.toFixed(2)}</td>
          <td>
            <button class="btn btn-sm btn-outline-secondary me-1 edit-btn">
              <!-- SVG ícono Editar -->
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                   class="lucide lucide-square-pen-icon lucide-square-pen">
                <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>
              </svg>
            </button>

            <button class="btn btn-sm btn-outline-danger delete-btn">
              <!-- SVG ícono Eliminar -->
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

        // Evento Editar: carga el producto en el formulario y abre el modal
        tr.querySelector(".edit-btn").addEventListener("click", () =>
          setFormulario(item)
        );

        // Evento Eliminar: confirma y borra el producto por ID
        tr.querySelector(".delete-btn").addEventListener("click", () => {
          if (confirm("¿Eliminar este producto?")) {
            eliminarProducto(item.id);
          }
        });

        // Renderiza/actualiza los controles de paginación
        // (Nota: aquí se llama dentro del forEach, tal como en tu código original)
        renderPagination(data.number, data.totalPages);

        // Agrega la fila lista al <tbody>
        tableBody.appendChild(tr);
      });
    } catch (err) {
      console.error("Error cargando productos:", err);
    }
  }

  // --- Llenar el <select> con categorías desde la API ---
  async function cargarCategorias() {
    try {
      const categories = await getCategories(); // Se espera un array de categorías
      // Opción placeholder deshabilitada
      select.innerHTML =
        '<option value="" disabled selected hidden>Seleccione...</option>';
      // Agregar cada categoría como <option>
      categories.forEach((c) => {
        select.innerHTML += `<option value="${c.idCategoria}" title="${c.descripcion}">${c.nombreCategoria}</option>`;
      });
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  }

  // --- Cargar datos del producto en el formulario para edición ---
  function setFormulario(item) {
    form.productId.value = item.id;
    form.productName.value = item.nombre;
    form.productPrice.value = item.precio;
    form.productStock.value = item.stock;
    form.productDescription.value = item.descripcion;
    form.productCategory.value = item.categoriaId;
    form.productDate.value = item.fechaIngreso;
    modalLabel.textContent = "Editar Producto";
    modal.show();
  }

  // --- Dejar el formulario en blanco (modo "nuevo") ---
  function limpiarFormulario() {
    form.reset();
    form.productId.value = ""; // Limpia el ID para que sea "crear"
  }

  // --- Eliminar producto por ID y recargar lista ---
  async function eliminarProducto(id) {
    try {
      await deleteProduct(id);
      await cargarProductos();
    } catch (err) {
      console.error("Error eliminando:", err);
    }
  }

  // --- Crear la barra de paginación (Anterior, números, Siguiente) ---
  function renderPagination(current, totalPages) {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = ""; // Limpia la paginación previa

    // Botón "Anterior"
    const prev = document.createElement("li");
    prev.className = `page-item ${current === 0 ? "disabled" : ""}`;
    prev.innerHTML = `<a class="page-link" href="#">Anterior</a>`;
    prev.addEventListener("click", (e) => {
      e.preventDefault();
      if (current > 0) {
        currentPage = current - 1; // Retrocede una página
        cargarProductos();
      }
    });
    pagination.appendChild(prev);

    // Números de página (1..totalPages)
    for (let i = 0; i < totalPages; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === current ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${i + 1}</a>`;
      li.addEventListener("click", (e) => {
        e.preventDefault();
        currentPage = i; // Salta a la página seleccionada
        cargarProductos();
      });
      pagination.appendChild(li);
    }

    // Botón "Siguiente"
    const next = document.createElement("li");
    next.className = `page-item ${current >= totalPages - 1 ? "disabled" : ""}`;
    next.innerHTML = `<a class="page-link" href="#">Siguiente</a>`;
    next.addEventListener("click", (e) => {
      e.preventDefault();
      if (current < totalPages - 1) {
        currentPage = current + 1; // Avanza una página
        cargarProductos();
      }
    });
    pagination.appendChild(next);
  }

  // --- Arranque inicial: cargar categorías y productos ---
  cargarCategorias();
  cargarProductos();
});
