export type { CompletedOrderEntry } from '@/app/(volunteer)/[locale]/counter/_types';

export interface DrinkProduct {
  id: string;
  name: string;
  price: number;
}

export interface DrinksQueueOrder {
  id: string;
  number: number;
  customerName: string | null;
  items: { name: string; qty: number; price: number }[];
  total: number;
  placedAt: number;
}

export type ConfirmState =
  | { type: 'queue'; order: DrinksQueueOrder }
  | {
      type: 'cart';
      items: { name: string; qty: number; price: number }[];
      total: number;
      customerName: string;
    };
