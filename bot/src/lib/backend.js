const fetch = require("node-fetch");

const DEPLOYED_BACKEND_URL = "https://backend-production-a068.up.railway.app";

function getBackendUrl() {
  const configured = process.env.BACKEND_URL?.trim().replace(/^["']|["']$/g, "");
  if (configured) return configured.replace(/\/+$/, "");

  if (process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT) {
    return DEPLOYED_BACKEND_URL;
  }

  return "http://localhost:4000";
}

function backendUrl(path = "") {
  return `${getBackendUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

async function backendJson(path, options = {}) {
  const url = backendUrl(path);
  let res;

  try {
    res = await fetch(url, options);
  } catch (err) {
    throw new Error(`Could not reach backend at ${getBackendUrl()}. ${err.message}`);
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_err) {
      data = { error: text };
    }
  }

  if (!res.ok) {
    throw new Error(data?.error || `Backend returned HTTP ${res.status}`);
  }

  return data;
}

module.exports = { backendJson, backendUrl, getBackendUrl };
