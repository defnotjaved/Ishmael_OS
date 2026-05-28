import { ComingSoon } from "@/components/layout/coming-soon";
import { sidebarNav, mobileNav } from "@/config/nav";

const navIndex = [...sidebarNav, ...mobileNav];

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const href = `/${slug.join("/")}`;
  const match = navIndex.find((item) => item.href === href);

  const title =
    match?.label ??
    slug[slug.length - 1]
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return <ComingSoon title={title} icon={match?.icon} />;
}
