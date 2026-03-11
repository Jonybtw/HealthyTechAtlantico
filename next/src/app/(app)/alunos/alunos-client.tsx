"use client";

import { useState, useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { PageTransition, FadeIn, AnimatePresence } from "@/components/ui/motion";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PillSelect } from "@/components/ui/pill-select";
import { createStudentAction } from "./actions";

interface StudentRow {
    id: string;
    name: string;
    sex: string;
    birthDate: Date | null;
    className: string | null;
    schoolYear: string | null;
    [key: string]: unknown;
}

interface AlunosClientProps {
    initialStudents: StudentRow[];
}

export function AlunosClient({ initialStudents }: AlunosClientProps) {
    const t = useTranslations("alunos");
    const router = useRouter();

    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({
        name: "",
        sex: "M",
        birthDate: "",
        className: "",
    });

    const [state, formAction, isPending] = useActionState(createStudentAction, null);

    useEffect(() => {
        if (state?.error) {
            toast.error(state.error);
            return;
        }

        if (state?.success) {
            toast.success(t("createSuccess"));
            const frame = requestAnimationFrame(() => {
                setShowCreate(false);
                setForm({ name: "", sex: "M", birthDate: "", className: "" });
                router.refresh();
            });
            return () => cancelAnimationFrame(frame);
        }
    }, [router, state, t]);

    const columns: Column<StudentRow>[] = [
        { key: "name", header: t("colName"), sortable: true },
        { key: "sex", header: t("colSex"), sortable: true, className: "w-16 text-center" },
        {
            key: "birthDate",
            header: t("colBirth"),
            sortable: true,
            render: (r) => (r.birthDate ? new Date(r.birthDate).toLocaleDateString("pt-PT") : "—"),
        },
        {
            key: "className",
            header: t("colClass"),
            render: (r) => r.className ?? "—",
        },
    ];

    return (
        <PageTransition className="flex flex-col gap-5">
            <PageHeader title={t("title")} description={t("description")}>    
                <Button
                    size="sm"
                    icon={<UserPlus className="size-4" />}
                    onClick={() => setShowCreate((v) => !v)}
                >
                    {showCreate ? t("cancel") : t("new")}
                </Button>
            </PageHeader>

            <AnimatePresence>
            {showCreate && (
                <FadeIn key="create-form" className="bg-card glass rounded-xl border border-border p-5 flex flex-col gap-4 max-w-lg shadow-card">
                <form
                    action={formAction}
                    className="flex flex-col gap-4"
                >
                    <Input
                        name="name"
                        label={t("colName")}
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        required
                        autoFocus
                    />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">{t("colSex")}</label>
                        <input type="hidden" name="sex" value={form.sex} />
                        <PillSelect
                            options={[
                                { value: "M", label: "Masculino" },
                                { value: "F", label: "Feminino" },
                            ]}
                            value={form.sex}
                            onChange={(v) => setForm((f) => ({ ...f, sex: v }))}
                        />
                    </div>
                    <Input
                        name="birthDate"
                        label="Data de nascimento"
                        type="date"
                        value={form.birthDate}
                        onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
                        required
                    />
                    <Button type="submit" loading={isPending} className="self-start">
                        {t("create")}
                    </Button>
                </form>
                </FadeIn>
            )}
            </AnimatePresence>

            <DataTable
                columns={columns}
                data={initialStudents}
                rowKey={(r) => r.id}
                onRowClick={(r) => router.push(`/alunos/${r.id}`)}
                emptyMessage={t("emptyMessage")}
            />
        </PageTransition>
    );
}
