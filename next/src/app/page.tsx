import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Rota: /
 *
 * Página de entrada da aplicação. Não apresenta interface própria: apenas
 * verifica se existe sessão e encaminha o utilizador para o dashboard ou para
 * o login. Mantém a decisão inicial concentrada num único ponto.
 */
export default async function Home() {
  const session = await auth();
  redirect(session?.user?.id ? "/dashboard" : "/login");
}
