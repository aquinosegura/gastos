import { obtenerGastos, agregarGasto, eliminarGasto, actualizarGasto, agregarIngreso } from "./gastos.js";

const lista = document.getElementById("lista");
const totalSpan = document.getElementById("total");
const form = document.getElementById("form");
const logoutBtn = document.getElementById("logout");
const btnAction = document.getElementById("btn-action");
const btnCancel = document.getElementById("btn-cancel");

// Toast Config
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#1e293b',
  color: '#fff'
});

// State
let editId = null;
let isIngresoMode = false;
let filtroActual = 'dia';
let filtroTipo = 'todos'; // todos, ingreso, gasto

const btnIngreso = document.getElementById("btn-ingreso");
btnIngreso.onclick = () => {
  isIngresoMode = true;
  form.descripcion.placeholder = "Descripción del Ingreso (Ej: Nómina)";
  btnAction.textContent = "Guardar Ingreso";
  btnAction.classList.add("btn-update");
  btnAction.style.backgroundColor = "var(--primary)";
  btnCancel.style.display = "block";
  form.monto.focus();
};

logoutBtn.onclick = () => {
  localStorage.removeItem("token");
  location.href = "index.html";
};

function hoy() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function rango(tipo) {
  const now = new Date();
  let inicio, fin;

  if (tipo === "dia") {
    inicio = new Date();
    fin = new Date();
  }

  if (tipo === "semana") {
    const d = now.getDay() || 7;
    inicio = new Date(now.setDate(now.getDate() - d + 1));
    fin = new Date();
  }

  if (tipo === "mes") {
    inicio = new Date(now.getFullYear(), now.getMonth(), 1);
    fin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  return {
    inicio: inicio.toISOString().split("T")[0],
    fin: fin.toISOString().split("T")[0]
  };
}

// Ensure filters highlight visually
function updateFilterStyles() {
  document.querySelectorAll('[data-filtro]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filtro === filtroActual);
  });
  document.querySelectorAll('[data-tipo]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tipo === filtroTipo);
  });
}

async function cargar() {
  const { inicio, fin } = rango(filtroActual);
  updateFilterStyles();

  try {
    const gastosRaw = await obtenerGastos(inicio, fin);

    // Client-side filtering by "Tipo"
    const gastos = gastosRaw.filter(g => {
      if (filtroTipo === 'todos') return true;
      // Default null type to 'gasto'
      const tipo = g.tipo || 'gasto';
      return tipo === filtroTipo;
    });

    lista.innerHTML = "";
    let total = 0;

    // Calculate total based on what is SHOWN
    gastos.forEach(g => {
      const isIngreso = g.tipo === 'ingreso';
      if (isIngreso) total += Number(g.monto);
      else total -= Number(g.monto);

      // Create Item
      const li = document.createElement("li");
      if (isIngreso) li.classList.add('ingreso');
      else li.classList.add('gasto');

      // Date Format
      const [year, month, day] = g.fecha.split('-');
      const dateObj = new Date(year, month - 1, day);
      const dateStr = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

      // Icon
      const icon = isIngreso ? '💰' : '🛒';

      li.innerHTML = `
        <div style="font-size: 1.2rem; margin-right: 10px;">${icon}</div>
        <div style="display:flex; flex-direction:column; flex:1">
            <span>${g.descripcion}</span>
            <small style="color:var(--text-secondary); font-size:0.8rem;">${dateStr}</small>
        </div>
        <strong>$${g.monto} MXN</strong>
        <div style="display:flex; gap: 5px; align-items: center;">
           <button class="btn-edit" data-id="${g.id}" style="color:var(--primary)">✏️</button>
           <button class="btn-delete" data-id="${g.id}" style="color:var(--danger)">❌</button>
        </div>
      `;

      // Edit Logic
      li.querySelector(".btn-edit").onclick = () => {
        editId = g.id;
        form.descripcion.value = g.descripcion;
        form.monto.value = g.monto;
        btnAction.textContent = "Actualizar";
        btnAction.classList.add("btn-update");
        btnCancel.style.display = "block";
        form.monto.focus();
      };

      // Delete Logic
      li.querySelector(".btn-delete").onclick = async () => {
        const result = await Swal.fire({
          title: '¿Estás seguro?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#10b981',
          cancelButtonColor: '#ef4444',
          confirmButtonText: 'Sí, borrar',
          cancelButtonText: 'Cancelar',
          background: '#1e293b',
          color: '#fff'
        });

        if (result.isConfirmed) {
          await eliminarGasto(g.id);
          Toast.fire({ icon: 'success', title: 'Eliminado correctamente' });
          cargar();
        }
      };

      lista.appendChild(li);
    });

    // If filter is 'gasto' only, standard showing negative total might be confusing?
    // User wants to see "How much I spent".
    // If 'gasto' filter on, maybe show total as positive number but label "Gastado"?
    // For now, keep math consistent.
    totalSpan.textContent = `$${total} MXN`; // Shows saldo remaining in view

  } catch (e) {
    if (e.message === "Unauthorized") {
      location.href = "index.html";
    } else {
      console.error(e);
      Toast.fire({ icon: 'error', title: 'Error al cargar gastos' });
    }
  }
}

// Cancel
btnCancel.onclick = () => {
  editId = null;
  isIngresoMode = false;
  form.reset();
  form.descripcion.placeholder = "Descripción";
  btnAction.textContent = "Agregar Gasto";
  btnAction.classList.remove("btn-update");
  btnAction.style.backgroundColor = "";
  btnCancel.style.display = "none";
};

form.onsubmit = async e => {
  e.preventDefault();

  const desc = form.descripcion.value;
  const mont = form.monto.value;

  try {
    if (editId) {
      await actualizarGasto(editId, desc, mont);
      Toast.fire({ icon: 'success', title: 'Actualizado' });

      // Reset
      editId = null;
      isIngresoMode = false;
      btnAction.textContent = "Agregar Gasto";
      btnAction.classList.remove("btn-update");
      btnAction.style.backgroundColor = "";
      btnCancel.style.display = "none";
    } else if (isIngresoMode) {
      await agregarIngreso(desc, mont, hoy());
      Toast.fire({ icon: 'success', title: 'Dinero ingresado' });

      isIngresoMode = false;
      btnAction.textContent = "Agregar Gasto";
      btnAction.style.backgroundColor = "";
      btnCancel.style.display = "none";
    } else {
      await agregarGasto(desc, mont, hoy());
      Toast.fire({ icon: 'success', title: 'Gasto agregado' });
    }

    form.reset();
    cargar();
  } catch (e) {
    Toast.fire({ icon: 'error', title: e.message || 'Error al guardar' });
  }
};

// Filter Listeners
document.querySelectorAll("[data-filtro]").forEach(btn => {
  btn.onclick = () => {
    filtroActual = btn.dataset.filtro;
    cargar();
  };
});

document.querySelectorAll("[data-tipo]").forEach(btn => {
  btn.onclick = () => {
    filtroTipo = btn.dataset.tipo;
    cargar();
  };
});

cargar();
