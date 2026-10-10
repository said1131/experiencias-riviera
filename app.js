let experiencias = [];
let reservas = [];
let textoBusqueda = "";
let categoriaActual = "todas";
let ordenActual = "normal";
let precioMaxActual = Infinity;

const catalogo = document.querySelector("#catalogo");
const buscador = document.querySelector("#buscador");
const filtroCategoria = document.querySelector("#filtroCategoria");
const filtroPrecioMax = document.querySelector("#filtroPrecioMax");
const ordenPrecio = document.querySelector("#ordenPrecio");
const listaReservas = document.querySelector("#listaReservas");
const total = document.querySelector("#total");
const totalPersonas = document.querySelector("#totalPersonas");
const estado = document.querySelector("#estado");
const btnVaciar = document.querySelector("#btnVaciar");
const contenedorMensajes = document.querySelector("#contenedorMensajes");

const modalConfirmacion = document.querySelector("#modalConfirmacion");
const btnConfirmarVaciar = document.querySelector("#btnConfirmarVaciar");
const btnCancelarVaciar = document.querySelector("#btnCancelarVaciar");

async function cargarExperiencias() {
  try {
    estado.textContent = "Cargando experiencias...";
    const respuesta = await fetch("./data/experiencias.json");
    if (!respuesta.ok) throw new Error("No fue posible cargar las experiencias");
    experiencias = await respuesta.json();
    estado.textContent = `${experiencias.length} experiencias disponibles`;
    actualizarCatalogo();
  } catch (error) {
    estado.textContent = "Error al cargar la información";
    console.error(error);
  }
}

function mostrarMensaje(texto, tipo = "peligro") {
  const div = document.createElement("div");
  div.classList.add("mensaje-alerta");
  
  if (tipo === "exito") {
    div.classList.add("mensaje-exito");
  } else {
    div.classList.add("mensaje-peligro");
  }
  
  div.textContent = texto;
  contenedorMensajes.appendChild(div);
  setTimeout(() => div.remove(), 3500);
}

function obtenerResultados() {
  let resultados = [...experiencias];
  
  if (categoriaActual !== "todas") {
    resultados = resultados.filter(e => e.categoria === categoriaActual);
  }
  if (textoBusqueda !== "") {
    resultados = resultados.filter(e => e.nombre.toLowerCase().includes(textoBusqueda));
  }
  if (precioMaxActual > 0 && precioMaxActual !== Infinity) {
    resultados = resultados.filter(e => e.precio <= precioMaxActual);
  }
  if (ordenActual === "ascendente") resultados.sort((a,b) => a.precio - b.precio);
  if (ordenActual === "descendente") resultados.sort((a,b) => b.precio - a.precio);
  
  return resultados;
}

function actualizarCatalogo() {
  const resultados = obtenerResultados();
  
  if (resultados.length === 0) {
    catalogo.innerHTML = '<p class="sin-resultados">No se encontraron experiencias</p>';
    estado.textContent = "0 resultados";
    return;
  }
  
  catalogo.innerHTML = resultados.map(e => `
    <article class="tarjeta">
      <div class="imagen">${e.icono}</div>
      <div class="informacion">
        <span class="categoria">${e.categoria}</span>
        <h3>${e.nombre}</h3>
        <p>Cupo disponible: ${e.cupo}</p>
        <p class="precio">$${e.precio} MXN</p>
        <label>Personas:
          <input type="number" id="cantidad-${e.id}" min="1" max="${e.cupo}" value="1">
        </label>
        <button class="btn-reservar" data-id="${e.id}">Agregar</button>
      </div>
    </article>
  `).join("");
  
  estado.textContent = `${resultados.length} resultados`;
  agregarEventosReservar();
}

function agregarEventosReservar() {
  document.querySelectorAll(".btn-reservar").forEach(boton => {
    boton.addEventListener("click", () => agregarReserva(Number(boton.dataset.id)));
  });
}

function agregarReserva(id) {
  const experiencia = experiencias.find(e => e.id === id);
  const inputCantidad = document.querySelector(`#cantidad-${id}`);
  const cantidad = Number(inputCantidad.value);
  
  if (cantidad < 1 || cantidad > experiencia.cupo) {
    mostrarMensaje("Cantidad no válida para " + experiencia.nombre, "peligro"); 
    return;
  }
  
  const existente = reservas.find(r => r.experienciaId === id);
  if (existente) {
    const nuevaCantidad = existente.cantidad + cantidad;
    if (nuevaCantidad > experiencia.cupo) {
      mostrarMensaje(`La cantidad supera el cupo disponible (${experiencia.cupo}) en ${experiencia.nombre}`, "peligro"); 
      return;
    }
    existente.cantidad = nuevaCantidad;
    existente.subtotal = nuevaCantidad * experiencia.precio;
  } else {
    reservas.push({ 
      experienciaId: id, nombre: experiencia.nombre, precio: experiencia.precio, 
      cantidad, subtotal: experiencia.precio * cantidad 
    });
  }
  
  mostrarMensaje(`Se agregó ${experiencia.nombre} a tu reserva`, "exito");
  inputCantidad.value = 1;
  mostrarReservas();
}

function mostrarReservas() {
  if (reservas.length === 0) {
    listaReservas.innerHTML = "<p>No hay experiencias seleccionadas.</p>";
    total.textContent = "$0 MXN"; 
    totalPersonas.textContent = "0";
    return;
  }
  
  listaReservas.innerHTML = reservas.map(r => `
    <article class="item-reserva">
      <div>
        <strong>${r.nombre}</strong>
        <div class="controles-cantidad">
          <button class="btn-pequeno btn-menos" data-id="${r.experienciaId}">-</button>
          <span>${r.cantidad} persona(s) x $${r.precio}</span>
          <button class="btn-pequeno btn-mas" data-id="${r.experienciaId}">+</button>
        </div>
      </div>
      <div style="text-align: right;">
        <strong>$${r.subtotal} MXN</strong><br>
        <button class="btn-eliminar" data-id="${r.experienciaId}">Eliminar</button>
      </div>
    </article>
  `).join("");
  
  const totalReserva = reservas.reduce((suma, r) => suma + r.subtotal, 0);
  const personasReserva = reservas.reduce((suma, r) => suma + r.cantidad, 0);
  
  total.textContent = `$${totalReserva} MXN`;
  totalPersonas.textContent = personasReserva;
  
  agregarEventosReserva();
}

function agregarEventosReserva() {
  document.querySelectorAll(".btn-eliminar").forEach(boton => {
    boton.addEventListener("click", () => eliminarReserva(Number(boton.dataset.id)));
  });
  
  document.querySelectorAll(".btn-mas").forEach(boton => {
    boton.addEventListener("click", () => cambiarCantidad(Number(boton.dataset.id), 1));
  });

  document.querySelectorAll(".btn-menos").forEach(boton => {
    boton.addEventListener("click", () => cambiarCantidad(Number(boton.dataset.id), -1));
  });
}

function cambiarCantidad(id, cambio) {
  const reserva = reservas.find(r => r.experienciaId === id);
  const experiencia = experiencias.find(e => e.id === id);
  
  const nuevaCantidad = reserva.cantidad + cambio;
  
  if (nuevaCantidad > experiencia.cupo) {
    mostrarMensaje(`Cupo máximo alcanzado para ${experiencia.nombre}`, "peligro");
    return;
  }
  if (nuevaCantidad < 1) {
    eliminarReserva(id);
    return;
  }
  
  reserva.cantidad = nuevaCantidad;
  reserva.subtotal = nuevaCantidad * experiencia.precio;
  mostrarReservas();
}

function eliminarReserva(id) {
  const reservaInfo = reservas.find(r => r.experienciaId === id);
  reservas = reservas.filter(r => r.experienciaId !== id);
  mostrarReservas();
  mostrarMensaje(`Has eliminado ${reservaInfo.nombre} de tu reservación`, "peligro");
}

btnVaciar.addEventListener("click", () => {
  if (reservas.length === 0) {
    mostrarMensaje("La reservación ya está vacía", "peligro");
    return;
  }
  modalConfirmacion.classList.remove("modal-oculto");
  modalConfirmacion.classList.add("modal-visible");
});

btnCancelarVaciar.addEventListener("click", () => {
  modalConfirmacion.classList.remove("modal-visible");
  modalConfirmacion.classList.add("modal-oculto");
});

btnConfirmarVaciar.addEventListener("click", () => {
  reservas = [];
  mostrarReservas();
  modalConfirmacion.classList.remove("modal-visible");
  modalConfirmacion.classList.add("modal-oculto");
  mostrarMensaje("Reservación vaciada completamente", "peligro");
});

buscador.addEventListener("input", () => {
  textoBusqueda = buscador.value.trim().toLowerCase(); 
  actualizarCatalogo();
});
filtroCategoria.addEventListener("change", () => {
  categoriaActual = filtroCategoria.value; 
  actualizarCatalogo();
});
ordenPrecio.addEventListener("change", () => {
  ordenActual = ordenPrecio.value; 
  actualizarCatalogo();
});
filtroPrecioMax.addEventListener("input", () => {
  const val = Number(filtroPrecioMax.value);
  precioMaxActual = val > 0 ? val : Infinity;
  actualizarCatalogo();
});

cargarExperiencias();