import axios, { AxiosInstance } from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
      withCredentials: true,  // send/receive httpOnly cookies
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("user");
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /* Auth */
  login(email: string, password: string) {
    return this.client.post("/api/auth/login", { email, password });
  }

  register(email: string, password: string, display_name: string) {
    return this.client.post("/api/auth/register", { email, password, display_name });
  }

  logout() {
    return this.client.post("/api/auth/logout");
  }

  getMe() {
    return this.client.get("/api/auth/me");
  }

  /* Experiences (public) */
  getExperiences() {
    return this.client.get("/api/experiences");
  }

  /* Projects (public) */
  getProjects() {
    return this.client.get("/api/projects");
  }

  /* Blog (public read, admin write) */
  getBlogPosts() {
    return this.client.get("/api/blog");
  }

  getBlogPost(id: string) {
    return this.client.get(`/api/blog/${id}`);
  }

  createBlogPost(data: any) {
    return this.client.post("/api/blog", data);
  }

  updateBlogPost(id: string, data: any) {
    return this.client.put(`/api/blog/${id}`, data);
  }

  deleteBlogPost(id: string) {
    return this.client.delete(`/api/blog/${id}`);
  }

  /* Admin CRUD for experiences */
  createExperience(data: any) {
    return this.client.post("/api/experiences", data);
  }

  updateExperience(id: string, data: any) {
    return this.client.put(`/api/experiences/${id}`, data);
  }

  deleteExperience(id: string) {
    return this.client.delete(`/api/experiences/${id}`);
  }

  /* Admin CRUD for projects */
  createProject(data: any) {
    return this.client.post("/api/projects", data);
  }

  updateProject(id: string, data: any) {
    return this.client.put(`/api/projects/${id}`, data);
  }

  deleteProject(id: string) {
    return this.client.delete(`/api/projects/${id}`);
  }

  /* Comments */
  getComments(postId: string) {
    return this.client.get(`/api/blog/${postId}/comments`);
  }

  createComment(postId: string, content: string) {
    return this.client.post(`/api/blog/${postId}/comments`, { content });
  }

  deleteComment(postId: string, commentId: string) {
    return this.client.delete(`/api/blog/${postId}/comments/${commentId}`);
  }

  /* Health */
  healthCheck() {
    return this.client.get("/api/health");
  }
}

const apiClient = new ApiClient();
export default apiClient;

export function extractErrorMessage(err: any, fallback = "Something went wrong."): string {
  const detail = err?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ");
  }
  return fallback;
}
