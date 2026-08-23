"use client";

import { useCart } from '../../lib/cart-context';
import { placeOrder } from '../actions/checkout';
import { useState } from 'react';
import Link from 'next/link';

export default function CartPage() {
  const { items, clearCart, itemCount } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const total = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setMessage("Processing your order...");
    
    const result = await placeOrder(formData);
    
    if (result.success) {
      setMessage(`✅ Success! Your order #${result.orderId?.slice(-6).toUpperCase()} has been placed.`);
      clearCart();
    } else {
      setMessage(`❌ Error: ${result.message}`);
    }
    setIsSubmitting(false);
  }

  if (itemCount === 0 && !message) {
    return (
      <main className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
        <Link href="/" className="text-blue-600 hover:underline text-lg">
          ← Back to Preorders
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.includes('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        {itemCount > 0 && !message.includes('Success') && (
          <form action={handleSubmit} className="space-y-6">
            <input type="hidden" name="cartData" value={JSON.stringify(items)} />

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center border-b pb-4">
                  <div>
                    <p className="font-semibold text-lg">{item.productTitle}</p>
                    <p className="text-sm text-gray-500">{item.vendorName}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity} × ${item.unitPrice}</p>
                  </div>
                  <p className="font-bold">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 flex justify-between items-center text-xl font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-sm text-gray-700">Payment Details (Off-platform)</p>
              <input name="paymentMethod" placeholder="Payment Method (e.g., Zelle, Bank Transfer)" className="w-full border rounded p-2" required />
              <input name="transactionRef" placeholder="Transaction Reference / Receipt #" className="w-full border rounded p-2" />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400">
              {isSubmitting ? 'Processing...' : 'Place Preorder'}
            </button>
            
            <Link href="/" className="block text-center text-gray-600 hover:text-gray-900">
              ← Keep Shopping
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}