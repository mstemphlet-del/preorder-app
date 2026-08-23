"use client"; // This tells Next.js this file can use useState and hooks

import { useState } from 'react';
import { useCart } from '../lib/cart-context';

export function AddToCartButton({ windowId, productTitle, vendorName, unitPrice }: {
  windowId: string;
  productTitle: string;
  vendorName: string;
  unitPrice: number;
}) {
  const { addItem, itemCount } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({ windowId, productTitle, vendorName, unitPrice });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500); // Reset after 1.5 seconds
  };

  return (
    <div className="flex items-center gap-4">
      <button 
        onClick={handleAdd}
        className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
          added ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {added ? '✓ Added!' : 'Add to Cart'}
      </button>
      {itemCount > 0 && (
        <span className="bg-gray-900 text-white text-sm font-bold px-3 py-1 rounded-full">
          {itemCount} in cart
        </span>
      )}
    </div>
  );
}