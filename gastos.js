import { SUPABASE_URL, SUPABASE_KEY } from "./supabase.js";

const token = localStorage.getItem("token");

export async function obtenerGastos(inicio, fin) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/gastos?fecha=gte.${inicio}&fecha=lte.${fin}&order=fecha.desc`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized");
    throw new Error("Error loading expenses");
  }

  return await res.json();
}

export async function agregarIngreso(descripcion, monto, fecha) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/gastos`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    },
    body: JSON.stringify({ descripcion, monto, fecha, tipo: 'ingreso' })
  });

  if (!res.ok) throw new Error("Error saving income");
}

export async function agregarGasto(descripcion, monto, fecha) {
  // 1. Calculate Balance
  // Fetch only necessary columns for all time to ensure correct balance
  const resBalance = await fetch(`${SUPABASE_URL}/rest/v1/gastos?select=monto,tipo`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`
    }
  });

  if (!resBalance.ok) throw new Error("Error checking balance");
  const all = await resBalance.json();

  const balance = all.reduce((acc, item) => {
    // Default to 'gasto' if tipo is null (backward compatibility)
    const isIngreso = item.tipo === 'ingreso';
    return isIngreso ? acc + Number(item.monto) : acc - Number(item.monto);
  }, 0);

  if (Number(monto) > balance) {
    throw new Error("Fondos insuficientes");
  }

  // 2. Insert Gasto
  const res = await fetch(`${SUPABASE_URL}/rest/v1/gastos`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    },
    body: JSON.stringify({ descripcion, monto, fecha, tipo: 'gasto' })
  });

  if (!res.ok) throw new Error("Error saving expense");
}

export async function eliminarGasto(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/gastos?id=eq.${id}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) throw new Error("Error deleting");
}

export async function actualizarGasto(id, descripcion, monto) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/gastos?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ descripcion, monto })
  });

  if (!res.ok) throw new Error("Error updating");
}
