import { CartProvider } from '@/lib/cart-context';
import { PrototypeNav } from '@/components/prototype-nav';
import { ReactNode } from 'react';

export default function SlugLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <div className="cust-theme">
        {children}
        <PrototypeNav />
      </div>
    </CartProvider>
  );
}
