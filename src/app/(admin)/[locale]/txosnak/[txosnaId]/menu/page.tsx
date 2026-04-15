import { redirect } from "next/navigation";

export default async function TxosnaMenuRedirect({
  params,
}: {
  params: Promise<{ locale: string; txosnaId: string }>;
}) {
  const { locale, txosnaId } = await params;
  redirect(`/${locale}/txosnak/${txosnaId}/products`);
}
