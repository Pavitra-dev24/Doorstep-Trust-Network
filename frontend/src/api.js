const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    const message = data?.detail || `Request failed (${res.status})`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return data;
}

export const api = {
  health: () => request("/health"),

  createHousehold: (payload) =>
    request("/households", { method: "POST", body: JSON.stringify(payload) }),

  getHousehold: (plusCode) =>
    request(`/households/${encodeURIComponent(plusCode)}`),

  listHouseholds: (locality) =>
    request(`/households${locality ? `?locality=${encodeURIComponent(locality)}` : ""}`),

  vouch: (plusCode, payload) =>
    request(`/households/${encodeURIComponent(plusCode)}/vouch`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  simulateSms: (message) =>
    request("/sms/simulate", { method: "POST", body: JSON.stringify({ message }) }),
};

export { API_URL };
