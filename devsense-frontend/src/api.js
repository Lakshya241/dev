import axios from "axios";

// base url can be configured via VITE_API_URL or default to Render backend
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://devsense1.onrender.com",
});

export async function ingestRepo({ repo_url, project_name }) {
  const res = await API.post("/ingest", { repo_url, project_name });
  return res.data;
}

export async function queryCodebase({ project_name, session_id, query }) {
  const res = await API.post("/query", { project_name, session_id, query });
  return res.data;
}

export async function impactAnalysis({ file_path }) {
  const res = await API.post("/impact-analysis", { file_path });
  return res.data;
}

export async function getArchitecture({ project_name }) {
  const res = await API.get("/generate-architecture", {
    params: { project_name },
  });
  return res.data;
}

export async function getDependencies({ project_name }) {
  const res = await API.get("/dependencies", {
    params: { project_name },
  });
  return res.data;
}

export async function getFileTree({ project_name }) {
  const res = await API.get("/file-tree", {
    params: { project_name },
  });
  return res.data;
}

export async function submitFeedback({ project_name, rating, feedback_text, category }) {
  const res = await API.post("/feedback", { project_name, rating, feedback_text, category });
  return res.data;
}

export async function getSettings() {
  const res = await API.get("/settings");
  return res.data;
}

export async function getLogs({ project_name, limit = 100 }) {
  const res = await API.get("/logs", {
    params: { project_name, limit },
  });
  return res.data;
}
