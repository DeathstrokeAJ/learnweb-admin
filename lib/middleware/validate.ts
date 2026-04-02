import { type ZodSchema, ZodError } from "zod"
import { NextResponse } from "next/server"

export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data, error: null }
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          {
            error: "Validation failed",
            details: err.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      }
    }
    return {
      data: null,
      error: NextResponse.json({ error: "Invalid request body" }, { status: 400 }),
    }
  }
}

export function validateQuery<T>(
  params: URLSearchParams,
  schema: ZodSchema<T>
): { data: T; error: null } | { data: null; error: NextResponse } {
  try {
    const obj: Record<string, string> = {}
    params.forEach((value, key) => {
      obj[key] = value
    })
    const data = schema.parse(obj)
    return { data, error: null }
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          {
            error: "Invalid query parameters",
            details: err.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      }
    }
    return {
      data: null,
      error: NextResponse.json({ error: "Invalid query parameters" }, { status: 400 }),
    }
  }
}
