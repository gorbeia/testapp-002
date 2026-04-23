import { redirect } from 'next/navigation';

export default async function MenuPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  redirect(`/${locale}/t/${slug}`);
}
