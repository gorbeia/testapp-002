import { CartProvider } from '@/lib/cart-context';
import { ReactNode } from 'react';

export default function SlugLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <div className="cust-theme">{children}</div>
    </CartProvider>
  );
}
