import { redirect } from "next/navigation";

export default function TxosnaVolunteersRedirect({ params }: { params: { locale: string; txosnaId: string } }) {
  // Volunteer management is association-level only
  redirect(`/${params.locale}/volunteers`);
}
