"use client";

import type { ReactNode } from "react";
import MobileHeroShell from "@/components/common/MobileHeroShell";
import { ADMIN_MENU } from "@/lib/navigation";

/** Kerangka halaman admin versi HP (hero merah + konten). Di desktop tetap tampil memakai sidebar admin. */
export default function MobileAdminShell({
  title,
  subtitle,
  backHref,
  backLabel,
  userName,
  userPhoto,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel: string;
  userName: string;
  userPhoto?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <MobileHeroShell role="Admin" menuSections={ADMIN_MENU} eyebrow="Admin" title={title} subtitle={subtitle} backHref={backHref} backLabel={backLabel} userName={userName} userPhoto={userPhoto} action={action}>
      {children}
    </MobileHeroShell>
  );
}
