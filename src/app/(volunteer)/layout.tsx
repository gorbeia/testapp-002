import { PrototypeNav } from '@/components/prototype-nav';
import { ReactNode } from 'react';

export default function VolunteerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PrototypeNav />
    </>
  );
}
