import { prisma } from '../../lib/prisma';
import { auth } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function CustomerOrders() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const orders = await prisma.order.findMany({
    where: { customerId: (session.user as any).id },
    include: {
      items: {
        include: {
          window: { include: { product: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-1">Welcome back, {session.user?.name || 'Customer'}</p>
          </div>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Storefront
          </Link>
        </header>

        {orders.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center">
            <p className="text-gray-500 text-lg mb-4">You haven't placed any orders yet.</p>
            <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-4 border-b pb-4">
                  <div>
                    <p className="text-sm text-gray-500">Order Placed</p>
                    <p className="font-semibold">{order.createdAt.toLocaleDateString()} at {order.createdAt.toLocaleTimeString()}</p>
                    <p className="text-sm text-gray-500 mt-2">Order #{order.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{item.window.product.title}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity} × ${item.unitPrice}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          item.fulfillmentStatus === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                          item.fulfillmentStatus === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.fulfillmentStatus}
                        </span>
                        {item.trackingNumber && (
                          <p className="text-xs text-gray-500 mt-1">Tracking: {item.trackingNumber}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}