import { notFound } from 'next/navigation';
import { txosnaRepo } from '@/lib/store';
import { CheckoutClient } from './checkout-client';

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;

  const txosna = await txosnaRepo.findBySlug(slug);
  if (!txosna || txosna.status === 'CLOSED') notFound();

  return (
    <CheckoutClient
      txosna={{
        name: txosna.name,
        status: txosna.status,
        waitMinutes: txosna.waitMinutes,
        enabledPaymentMethods: txosna.enabledPaymentMethods,
      }}
    />
  );
}
