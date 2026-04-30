import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  ClipboardList,
  FileSearch,
  FileText,
  Heart,
  Home,
  School,
  Settings,
  Shield,
  User,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
  section: "core" | "operations" | "reference" | "admin";
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "nav.dashboard",
    icon: Home,
    roles: ["ADMIN", "PROFESSOR", "ALUNO", "PSICOLOGO", "PAIS"],
    section: "core",
  },
  {
    href: "/biometria",
    label: "nav.biometria",
    icon: Activity,
    roles: ["ADMIN", "PROFESSOR", "PSICOLOGO"],
    section: "core",
  },
  {
    href: "/testes",
    label: "nav.testes",
    icon: ClipboardList,
    roles: ["ADMIN", "PROFESSOR", "PSICOLOGO"],
    section: "core",
  },
  {
    href: "/questionarios",
    label: "nav.questionarios",
    icon: BookOpen,
    roles: ["ALUNO", "PSICOLOGO"],
    section: "core",
  },
  {
    href: "/sos",
    label: "nav.sos",
    icon: AlertTriangle,
    roles: ["ADMIN", "ALUNO", "PROFESSOR", "PSICOLOGO"],
    section: "core",
  },
  {
    href: "/relatorio",
    label: "nav.relatorio",
    icon: FileText,
    roles: ["ADMIN", "ALUNO", "PROFESSOR", "PAIS", "PSICOLOGO"],
    section: "core",
  },
  {
    href: "/analise",
    label: "nav.analise",
    icon: BarChart3,
    roles: ["ADMIN", "PROFESSOR"],
    section: "operations",
  },
  {
    href: "/turma",
    label: "nav.turma",
    icon: School,
    roles: ["ADMIN", "PROFESSOR"],
    section: "operations",
  },
  {
    href: "/dispensas",
    label: "nav.exemptions",
    icon: Shield,
    roles: ["ADMIN", "PROFESSOR"],
    section: "operations",
  },
  {
    href: "/protocolos",
    label: "nav.protocolos",
    icon: Heart,
    roles: ["ADMIN", "ALUNO", "PROFESSOR", "PAIS", "PSICOLOGO"],
    section: "reference",
  },
  {
    href: "/alunos",
    label: "nav.alunos",
    icon: Users,
    roles: ["ADMIN", "PROFESSOR", "PSICOLOGO"],
    section: "operations",
  },
  {
    href: "/guardioes",
    label: "nav.guardioes",
    icon: UserCheck,
    roles: ["ADMIN", "PROFESSOR"],
    section: "operations",
  },
  {
    href: "/perfil",
    label: "nav.perfil",
    icon: User,
    roles: ["ADMIN", "PROFESSOR", "ALUNO", "PSICOLOGO", "PAIS"],
    section: "admin",
  },
  {
    href: "/admin",
    label: "nav.admin",
    icon: Settings,
    roles: ["ADMIN"],
    section: "admin",
  },
  {
    href: "/auditoria",
    label: "nav.auditoria",
    icon: FileSearch,
    roles: ["ADMIN"],
    section: "admin",
  },
];
