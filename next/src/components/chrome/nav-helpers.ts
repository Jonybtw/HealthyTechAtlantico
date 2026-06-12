import type { Role } from "@prisma/client";
import type { NavItem } from "@/lib/nav-items";

export const SECTION_ORDER: NavItem["section"][] = [
  "core",
  "operations",
  "reference",
  "admin",
];

export const SECTION_LABEL_KEYS: Record<NavItem["section"], string> = {
  core: "nav.sectionCore",
  operations: "nav.sectionOperations",
  reference: "nav.sectionReference",
  admin: "nav.sectionAdmin",
};

export const MOBILE_PRIORITIES: Record<Role, string[]> = {
  ADMIN: ["/dashboard", "/alunos", "/analise", "/sos", "/admin"],
  PROFESSOR: ["/dashboard", "/turma", "/biometria", "/testes", "/sos"],
  ALUNO: ["/dashboard", "/questionarios", "/sos", "/relatorio", "/protocolos"],
  PSICOLOGO: ["/dashboard", "/sos", "/perfil"],
  PAIS: ["/dashboard", "/relatorio", "/protocolos", "/perfil"],
};

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getMobileItems(role: Role, items: NavItem[]) {
  const priorities = MOBILE_PRIORITIES[role] ?? [];
  const sorted = [...items].sort((left, right) => {
    const leftPriority = priorities.indexOf(left.href);
    const rightPriority = priorities.indexOf(right.href);

    if (leftPriority === -1 && rightPriority === -1) return 0;
    if (leftPriority === -1) return 1;
    if (rightPriority === -1) return -1;
    return leftPriority - rightPriority;
  });

  return sorted.slice(0, 4);
}

export function getGroupedItems(items: NavItem[]) {
  return items.reduce<Record<NavItem["section"], NavItem[]>>(
    (groups, item) => {
      groups[item.section].push(item);
      return groups;
    },
    { core: [], operations: [], reference: [], admin: [] },
  );
}
