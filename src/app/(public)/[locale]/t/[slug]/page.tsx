import { notFound } from 'next/navigation';
import { txosnaRepo, catalogRepo } from '@/lib/store';
import { MenuClient } from '@/app/(public)/[locale]/[slug]/menu-client';

export default async function MenuPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;

  const txosna = await txosnaRepo.findBySlug(slug);
  if (!txosna || txosna.status === 'CLOSED') notFound();

  const grouped = await catalogRepo.listProductViews(txosna.id);

  const categories = grouped
    .map(({ category, products }) => ({
      id: category.id,
      name: category.name,
      type: category.type,
      displayOrder: category.displayOrder,
      products: products.filter((p) => p.available),
    }))
    .filter((c) => c.products.length > 0);

  return (
    <MenuClient
      txosna={{ name: txosna.name, status: txosna.status, waitMinutes: txosna.waitMinutes }}
      categories={categories}
    />
  );
}
