'use server';

import { prisma } from '../../lib/prisma';

export async function placeOrder(formData: FormData) {
  try {
    const cartData = formData.get('cartData') as string;
    const paymentMethod = formData.get('paymentMethod') as string;
    const transactionRef = formData.get('transactionRef') as string;
    
    if (!cartData) throw new Error("Cart is empty");

    const items = JSON.parse(cartData);
    if (!Array.isArray(items) || items.length === 0) throw new Error("Cart is empty");

    // Get the guest customer ID from the database
    const guestCustomer = await prisma.user.findFirst({ where: { email: 'guest@example.com' } });
    if (!guestCustomer) throw new Error("Guest customer not found. Please re-seed the database.");

    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData = [];

      for (const item of items) {
        const window = await tx.inventoryWindow.findUnique({
          where: { id: item.windowId },
          include: { product: true }
        });

        if (!window) throw new Error(`Product not found.`);
        
        const now = new Date();
        if (now < window.startTime || now > window.endTime) {
          throw new Error(`The preorder window for "${window.product.title}" has closed.`);
        }

        const availableStock = window.maxQuantity - window.currentSold;
        if (availableStock < item.quantity) {
          throw new Error(`Not enough stock for "${window.product.title}".`);
        }

        const lineTotal = window.product.basePrice * item.quantity;
        totalAmount += lineTotal;

        orderItemsData.push({
          windowId: window.id,
          vendorId: window.product.vendorId,
          quantity: item.quantity,
          unitPrice: window.product.basePrice,
        });
      }

      const newOrder = await tx.order.create({
        data: {
          customerId: guestCustomer.id, 
          totalAmount: totalAmount,
          paymentMethod: paymentMethod || 'Unknown',
          transactionRef: transactionRef || null,
          paymentStatus: 'PENDING_VERIFICATION',
          items: { create: orderItemsData },
        },
      });

      for (const item of items) {
        await tx.inventoryWindow.update({
          where: { id: item.windowId },
          data: { currentSold: { increment: item.quantity } },
        });
      }

      return newOrder.id;
    });

    return { success: true, orderId: result };
  } catch (error: any) {
    console.error("Checkout Error:", error);
    return { success: false, message: error.message || "Checkout failed" };
  }
}