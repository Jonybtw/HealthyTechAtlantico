import { NextResponse } from "next/server";

type ApiSuccess<T> = { data: T };
type ApiError<TIssues = unknown> = {
  error: string;
  issues?: TIssues;
};

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T): NextResponse<ApiSuccess<T>> {
  return ok(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function err<TIssues = unknown>(
  message: string,
  status = 400,
  issues?: TIssues,
): NextResponse<ApiError<TIssues>> {
  return NextResponse.json(
    issues === undefined ? { error: message } : { error: message, issues },
    { status },
  );
}

export function badRequest(message = "Pedido inválido") {
  return err(message, 400);
}

export function validationError<TIssues>(
  issues: TIssues,
  message = "Dados inválidos",
) {
  return err(message, 400, issues);
}

export function unauthorized(message = "Não autenticado") {
  return err(message, 401);
}

export function forbidden(message = "Sem permissão") {
  return err(message, 403);
}

export function notFound(message = "Não encontrado") {
  return err(message, 404);
}

export function conflict<TIssues = unknown>(message: string, issues?: TIssues) {
  return err(message, 409, issues);
}

export function serverError(message = "Erro interno do servidor") {
  return err(message, 500);
}
