"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Old dashboard redirects to the new association overview
export default function DashboardRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/eu/txosnak"); }, [router]);
  return null;
}
