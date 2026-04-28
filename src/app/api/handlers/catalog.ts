import { txosnaRepo, catalogRepo } from '@/lib/store';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const txosna = await txosnaRepo.findBySlug(slug);

  if (!txosna || txosna.status === 'CLOSED') {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const grouped = await catalogRepo.listProductViews(txosna.id);

  const shaped = grouped
    .map(({ category, products }) => ({
      id: category.id,
      name: category.name,
      type: category.type,
      displayOrder: category.displayOrder,
      products: products.filter((p) => p.available),
    }))
    .filter((c) => c.products.length > 0);

  return Response.json(shaped);
}
