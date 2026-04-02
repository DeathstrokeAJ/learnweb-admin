const BASE_URL = ""

interface ApiError {
  error: string
  details?: { field: string; message: string }[]
}

class ApiClientError extends Error {
  status: number
  details?: { field: string; message: string }[]

  constructor(message: string, status: number, details?: { field: string; message: string }[]) {
    super(message)
    this.name = "ApiClientError"
    this.status = status
    this.details = details
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    // Try to refresh the token
    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, { method: "POST" })
    if (refreshRes.ok) {
      // Retry might be needed; throw to let caller retry
      throw new ApiClientError("Token refreshed, please retry", 401)
    }
    // Redirect to login if not already on a public page
    if (typeof window !== "undefined") {
      const publicPaths = ["/login", "/register", "/"]
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = "/login"
      }
    }
    throw new ApiClientError("Unauthorized", 401)
  }

  if (!response.ok) {
    const data: ApiError = await response.json().catch(() => ({ error: "Request failed" }))
    throw new ApiClientError(data.error, response.status, data.details)
  }

  return response.json()
}

export const api = {
  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, { credentials: "include" })
    return handleResponse<T>(res)
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    })
    return handleResponse<T>(res)
  },

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    })
    return handleResponse<T>(res)
  },

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      credentials: "include",
    })
    return handleResponse<T>(res)
  },
}

export { ApiClientError }
export default api
