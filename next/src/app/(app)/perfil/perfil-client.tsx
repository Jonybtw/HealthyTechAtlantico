"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  Lock,
  ShieldCheck,
  Share2,
  User,
  Check,
  X,
  Save,
  Key,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { changePasswordFormSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { readApiResponse } from "@/lib/api-client";

type PasswordValues = z.infer<typeof changePasswordFormSchema>;
type UserProfile = {
  name: string | null;
  email: string;
  role: string;
  consentRgpd: boolean;
  consentShare: boolean;
};

export default function PerfilPage() {
  const t = useTranslations("perfil");
  const auth = useTranslations("auth");
  const common = useTranslations("common");
  const roles = useTranslations("roles");
  const { data: session, update } = useSession();
  const user = session?.user;

  const [updatingConsent, setUpdatingConsent] = useState<
    "rgpd" | "share" | null
  >(null);

  const pwForm = useForm<PasswordValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onPasswordSubmit = async (values: PasswordValues) => {
    try {
      const response = await fetch("/api/users/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });
      await readApiResponse(response);

      toast.success(t("passwordSuccess"));
      pwForm.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : common("connectionError"),
      );
    }
  };

  const syncConsent = async (
    field: "consentRgpd" | "consentShare",
    value: boolean,
  ) => {
    setUpdatingConsent(field === "consentRgpd" ? "rgpd" : "share");

    try {
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const body = await readApiResponse<UserProfile>(response);

      await update({
        name: body.name,
        email: body.email,
        role: body.role,
        consentRgpd: body.consentRgpd,
        consentShare: body.consentShare,
      });

      if (field === "consentRgpd") {
        toast.success(value ? t("rgpdGrant") : t("rgpdRevoke"));
      } else {
        toast.success(value ? t("activate") : t("deactivate"));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : common("connectionError"),
      );
    } finally {
      setUpdatingConsent(null);
    }
  };

  return (
    <PageScaffold
      headerProps={{
        title: t("title"),
        description: t("description"),
        eyebrow: "CONTA · PERFIL",
      }}
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <PageSection
          tone="secondary"
          layout="default"
          eyebrow={t("activeAccount")}
          title={user?.name || user?.email || "-"}
          description={user?.email}
          actions={
            <div className="flex size-9 items-center justify-center rounded-xl bg-navy-900 text-white shadow-card">
              <User className="size-4" />
            </div>
          }
        >
          <div className="surface-utility rounded-2xl p-3">
            <p className="section-kicker">{t("roleLabel")}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {roles(user?.role ?? "ALUNO")}
            </p>
          </div>

          <div className="surface-utility rounded-2xl p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card">
            <div className="flex items-start gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-gold-100 text-gold-700 dark:bg-gold-400/10 dark:text-gold-300">
                <ShieldCheck className="size-4" />
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">
                    {t("rgpdTitle")}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-sm">
                    {t("rgpdDescription")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={user?.consentRgpd ? "primary" : "ghost"}
                    loading={updatingConsent === "rgpd"}
                    icon={<Check className="size-4" />}
                    onClick={() => syncConsent("consentRgpd", true)}
                  >
                    {t("rgpdGrant")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!user?.consentRgpd ? "danger" : "ghost"}
                    loading={updatingConsent === "rgpd"}
                    icon={<X className="size-4" />}
                    onClick={() => syncConsent("consentRgpd", false)}
                  >
                    {t("rgpdRevoke")}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="surface-utility rounded-2xl p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card">
            <div className="flex items-start gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-navy-100 text-navy-700 dark:bg-navy-500/10 dark:text-navy-200">
                <Share2 className="size-4" />
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">
                    {t("shareTitle")}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-sm">
                    {t("shareDescription")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={user?.consentShare ? "secondary" : "ghost"}
                    loading={updatingConsent === "share"}
                    icon={<Check className="size-4" />}
                    onClick={() => syncConsent("consentShare", true)}
                  >
                    {t("activate")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!user?.consentShare ? "ghost" : "danger"}
                    loading={updatingConsent === "share"}
                    icon={<X className="size-4" />}
                    onClick={() => syncConsent("consentShare", false)}
                  >
                    {t("deactivate")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PageSection>

        <Form {...pwForm}>
          <form onSubmit={pwForm.handleSubmit(onPasswordSubmit)}>
            <PageSection
              tone="secondary"
              layout="form"
              eyebrow={t("securityTitle")}
              title={t("changePassword")}
              description={t("passwordDescription")}
              actions={
                <div className="flex size-9 items-center justify-center rounded-xl bg-danger-100 text-danger-700 dark:bg-danger-500/10 dark:text-danger-300">
                  <Lock className="size-4" />
                </div>
              }
            >
              <input
                type="email"
                name="email"
                autoComplete="username"
                value={user?.email ?? ""}
                readOnly
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
              />
              <div className="grid gap-3.5">
                <FormField
                  control={pwForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          label={t("currentPassword")}
                          type="password"
                          autoComplete="current-password"
                          showPasswordLabel={auth("showPassword")}
                          hidePasswordLabel={auth("hidePassword")}
                          leftIcon={<Lock className="size-4" />}
                          error={
                            pwForm.formState.errors.currentPassword?.message
                          }
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={pwForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          label={t("newPassword")}
                          type="password"
                          autoComplete="new-password"
                          showPasswordLabel={auth("showPassword")}
                          hidePasswordLabel={auth("hidePassword")}
                          leftIcon={<Key className="size-4" />}
                          error={pwForm.formState.errors.newPassword?.message}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={pwForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          label={t("confirmPassword")}
                          type="password"
                          autoComplete="new-password"
                          showPasswordLabel={auth("showPassword")}
                          hidePasswordLabel={auth("hidePassword")}
                          leftIcon={<Shield className="size-4" />}
                          error={
                            pwForm.formState.errors.confirmPassword?.message
                          }
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  loading={pwForm.formState.isSubmitting}
                  icon={<Save className="size-4" />}
                  className="rounded-full px-6 font-semibold shadow-lg transition-all hover:scale-[1.03]"
                  style={{
                    background: "linear-gradient(135deg, #1E3A8A, #10243a)",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  {t("savePassword")}
                </Button>
              </div>
            </PageSection>
          </form>
        </Form>
      </div>
    </PageScaffold>
  );
}
