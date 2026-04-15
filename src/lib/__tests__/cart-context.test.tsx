import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider, useCart } from '@/lib/cart-context';
import type { CartItem } from '@/lib/mock-data';

function makeItem(overrides?: Partial<CartItem>): CartItem {
  return {
    productId: 'prod-1',
    productName: 'Burgerra',
    quantity: 1,
    unitPrice: 8.5,
    selectedVariant: null,
    selectedModifiers: [],
    ...overrides,
  };
}

// Test harness component that exposes cart actions via data-testids
function Harness() {
  const cart = useCart();
  return (
    <div>
      <div data-testid="count">{cart.count}</div>
      <div data-testid="total">{cart.total.toFixed(2)}</div>
      <div data-testid="items">{JSON.stringify(cart.items)}</div>
      <button onClick={() => cart.addItem(makeItem())}>add-default</button>
      <button onClick={() => cart.addItem(makeItem({ selectedVariant: 'Grande' }))}>
        add-variant
      </button>
      <button
        onClick={() => cart.addItem(makeItem({ productId: 'prod-2', productName: 'Txorizoa' }))}
      >
        add-other
      </button>
      <button onClick={() => cart.removeItem('prod-1')}>remove-prod1</button>
      <button onClick={() => cart.removeAt(0)}>remove-at-0</button>
      <button onClick={() => cart.updateQty('prod-1', 3)}>update-qty-3</button>
      <button onClick={() => cart.clear()}>clear</button>
    </div>
  );
}

function renderCart() {
  return render(
    <CartProvider>
      <Harness />
    </CartProvider>
  );
}

describe('CartProvider', () => {
  it('starts empty', () => {
    renderCart();
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('total').textContent).toBe('0.00');
  });

  it('addItem: adds a new item', async () => {
    renderCart();
    await userEvent.click(screen.getByText('add-default'));
    expect(screen.getByTestId('count').textContent).toBe('1');
  });

  it('addItem: merges duplicate (same productId + same variant)', async () => {
    renderCart();
    await userEvent.click(screen.getByText('add-default'));
    await userEvent.click(screen.getByText('add-default'));
    const items = JSON.parse(screen.getByTestId('items').textContent!);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('addItem: does NOT merge items with different variants', async () => {
    renderCart();
    await userEvent.click(screen.getByText('add-default'));
    await userEvent.click(screen.getByText('add-variant'));
    const items = JSON.parse(screen.getByTestId('items').textContent!);
    expect(items).toHaveLength(2);
  });

  it('removeItem: removes by productId', async () => {
    renderCart();
    await userEvent.click(screen.getByText('add-default'));
    await userEvent.click(screen.getByText('remove-prod1'));
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('removeAt: removes by index', async () => {
    renderCart();
    await userEvent.click(screen.getByText('add-default'));
    await userEvent.click(screen.getByText('add-other'));
    await userEvent.click(screen.getByText('remove-at-0'));
    const items = JSON.parse(screen.getByTestId('items').textContent!);
    expect(items).toHaveLength(1);
    expect(items[0].productName).toBe('Txorizoa');
  });

  it('updateQty: updates quantity by productId', async () => {
    renderCart();
    await userEvent.click(screen.getByText('add-default'));
    await userEvent.click(screen.getByText('update-qty-3'));
    const items = JSON.parse(screen.getByTestId('items').textContent!);
    expect(items[0].quantity).toBe(3);
  });

  it('clear: empties cart', async () => {
    renderCart();
    await userEvent.click(screen.getByText('add-default'));
    await userEvent.click(screen.getByText('add-other'));
    await userEvent.click(screen.getByText('clear'));
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('total: sum of unitPrice × qty', async () => {
    renderCart();
    await userEvent.click(screen.getByText('add-default')); // 8.5 × 1
    await userEvent.click(screen.getByText('add-default')); // merges → 8.5 × 2
    expect(screen.getByTestId('total').textContent).toBe('17.00');
  });

  it('count: sum of all quantities', async () => {
    renderCart();
    await userEvent.click(screen.getByText('add-default')); // qty 1
    await userEvent.click(screen.getByText('add-other')); // qty 1
    expect(screen.getByTestId('count').textContent).toBe('2');
  });
});

describe('useCart outside provider', () => {
  it('throws when used outside CartProvider', () => {
    const BadComponent = () => {
      useCart();
      return null;
    };
    // Suppress React error boundary console output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<BadComponent />)).toThrow('useCart must be used within CartProvider');
    spy.mockRestore();
  });
});
