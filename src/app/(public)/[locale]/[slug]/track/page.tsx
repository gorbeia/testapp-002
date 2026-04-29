import { notFound } from 'next/navigation';
import { TrackEntryClient } from './track-entry-client';
import { txosnaRepo } from '@/lib/store';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function TrackPage({ params }: Props) {
  const { locale, slug } = await params;
  const txosna = await txosnaRepo.findBySlug(slug);
  if (!txosna || !txosna.mobileTrackingEnabled) notFound();

  return <TrackEntryClient slug={slug} locale={locale} txosnaName={txosna.name} />;
}
