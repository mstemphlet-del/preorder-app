'use server';

import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';

export async function verifyPayment(formData: FormData) {
  try {
    const orderItemId = formData.get('orderItemId') as string;
    
    if (!orderItemId) throw new Error("Order item ID is missing");

    // 1. Get the order item to find the order ID
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: { order: true },
    });

    if (!orderItem) throw new Error("Order item not found");

    // 2. Update the order's payment status to PAID
    await prisma.order.update({
      where: { id: orderItem.orderId },
      data: { paymentStatus: 'PAID' },
    });

    // 3. Refresh the vendor dashboard to show the updated status
    revalidatePath('/vendor');

    return { success: true };
  } catch (error: any) {
    console.error("Verify Payment Error:", error);
    return { success: false, message: error.message || "Failed to verify payment" };
  }
}

export async function markAsShipped(formData: FormData) {
  try {
    const orderItemId = formData.get('orderItemId') as string;
    const trackingNumber = formData.get('trackingNumber') as string;
    
    if (!orderItemId) throw new Error("Order item ID is missing");

    // 1. Update the order item's fulfillment status to SHIPPED
    await prisma.orderItem.update({
      where: { id: orderItemId },
      data: {
        fulfillmentStatus: 'SHIPPED',
        trackingNumber: trackingNumber || null,
      },
    });

    // 2. Refresh the vendor dashboard
    revalidatePath('/vendor');

    return { success: true };
  } catch (error: any) {
    console.error("Mark as Shipped Error:", error);
    return { success: false, message: error.message || "Failed to mark as shipped" };
  }
}