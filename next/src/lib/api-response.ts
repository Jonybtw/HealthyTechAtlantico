import { NextResponse } from "next/server";

/**
 * Shared Route Handler response helpers.
 * Ensures consistent JSON shape across all API routes.
 *
 * Success shape:  { data: T }
 * Error shape:    { error: string }
 */

export function ok<T>(data: T, status = 200): NextResponse {
    return NextResponse.json({ data }, { status });
}

export function created<T>(data: T): NextResponse {
    return ok(data, 201);
}

export function noContent(): NextResponse {
    return new NextResponse(null, { status: 204 });
}

export function err(message: string, status = 400): NextResponse {
    return NextResponse.json({ error: message }, { status });
}

export function forbidden(message = "Sem permissão"): NextResponse {
    return err(message, 403);
}

export function notFound(message = "Não encontrado"): NextResponse {
    return err(message, 404);
}

export function serverError(message = "Erro interno do servidor"): NextResponse {
    return err(message, 500);
}
