import { SUPABASE_URL, SUPABASE_KEY } from "./supabase.js";

export async function login(email, password) {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY
      },
      body: JSON.stringify({ email, password })
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error_description || data.msg || "Error en login");
  }

  localStorage.setItem("token", data.access_token);
  return data;
}

export async function register(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY
    },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.msg || "Error en registro");
  }
}
