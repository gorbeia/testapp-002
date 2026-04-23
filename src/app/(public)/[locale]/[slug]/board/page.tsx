import OrderBoard from '@/components/order-board/order-board';

export default async function BoardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <OrderBoard slug={slug} />;
}
