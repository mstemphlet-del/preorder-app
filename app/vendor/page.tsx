import { prisma } from '../../lib/prisma';
import { verifyPayment, markAsShipped } from './actions';
import { auth } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import LogoutButton from "../../components/LogoutButton";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function VendorDashboard() {
  const session = await auth();

  if (!session || (session.user as any).role !== 'VENDOR') {
    redirect('/login');
  }

  const vendor = await prisma.vendor.findFirst({
    where: { userId: (session.user as any).id },
  });

  if (!vendor) {
    return (
      <main className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <p className="text-red-600 text-lg">Vendor profile not found.</p>
      </main>
    );
  }

  const orderItems = await prisma.orderItem.findMany({
    where: { vendorId: vendor.id },
    include: {
      order: { include: { customer: true } },
      window: { include: { product: true } },
    },
    orderBy: { order: { createdAt: 'desc' } },
  });

  const pendingVerification = orderItems.filter(
    (item) => item.order.paymentStatus === 'PENDING_VERIFICATION'
  );
  const paidOrders = orderItems.filter(
    (item) => item.order.paymentStatus === 'PAID' && item.fulfillmentStatus !== 'SHIPPED' && item.fulfillmentStatus !== 'DELIVERED'
  );
  const completedOrders = orderItems.filter(
    (item) => item.fulfillmentStatus === 'SHIPPED' || item.fulfillmentStatus === 'DELIVERED'
  );

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Vendor Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {session.user?.name || vendor.name}</p>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/" className="text-blue-600 hover:underline">
              ← Back to Storefront
            </Link>
            <LogoutButton />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-700">Awaiting Payment Verification</p>
            <p className="text-3xl font-bold text-yellow-900">{pendingVerification.length}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">Ready to Ship</p>
            <p className="text-3xl font-bold text-blue-900">{paidOrders.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">Completed</p>
            <p className="text-3xl font-bold text-green-900">{completedOrders.length}</p>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-yellow-900">Awaiting Payment Verification ({pendingVerification.length})</h2>
          {pendingVerification.length === 0 ? (
            <p className="text-gray-500 bg-white p-6 rounded-lg">No orders waiting for verification.</p>
          ) : (
            <div className="space-y-4">
              {pendingVerification.map((item) => <OrderCard key={item.id} item={item} action="verify" />)}
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-blue-900">Ready to Ship ({paidOrders.length})</h2>
          {paidOrders.length === 0 ? (
            <p className="text-gray-500 bg-white p-6 rounded-lg">No orders ready to ship.</p>
          ) : (
            <div className="space-y-4">
              {paidOrders.map((item) => <OrderCard key={item.id} item={item} action="ship" />)}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-green-900">Completed ({completedOrders.length})</h2>
          {completedOrders.length === 0 ? (
            <p className="text-gray-500 bg-white p-6 rounded-lg">No completed orders yet.</p>
          ) : (
            <div className="space-y-4">
              {completedOrders.map((item) => <OrderCard key={item.id} item={item} action="none" />)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function OrderCard({ item, action }: { item: any; action: 'verify' | 'ship' | 'none' }) {
  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="font-bold text-lg">{item.window.product.title}</p>
          <p className="text-sm text-gray-600">
            Customer: <span className="font-semibold">{item.order.customer.name}</span> ({item.order.customer.email})
          </p>
          <p className="text-sm text-gray-500">
            Order #{item.order.id.slice(-6).toUpperCase()} • {item.order.createdAt.toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">${(item.unitPrice * item.quantity).toFixed(2)}</p>
          <p className="text-sm text-gray-500">Qty: {item.quantity} × ${item.unitPrice}</p>
        </div>
      </div>

      {item.order.paymentMethod && (
        <div className="bg-gray-50 rounded p-3 mb-4">
          <p className="text-sm"><span className="font-semibold">Payment Method:</span> {item.order.paymentMethod}</p>
          {item.order.transactionRef && <p className="text-sm"><span className="font-semibold">Transaction Ref:</span> {item.order.transactionRef}</p>}
        </div>
      )}

      {action === 'verify' && (
        <form action={verifyPayment}>
          <input type="hidden" name="orderItemId" value={item.id} />
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700">Verify Payment</button>
        </form>
      )}

      {action === 'ship' && (
        <form action={markAsShipped} className="space-y-3">
          <input type="hidden" name="orderItemId" value={item.id} />
          <input type="text" name="trackingNumber" placeholder="Tracking Number (optional)" className="w-full border rounded p-2" />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">Mark as Shipped</button>
        </form>
      )}

      {action === 'none' && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-sm text-green-800">
            {item.fulfillmentStatus === 'SHIPPED' ? 'Shipped' : 'Delivered'}
            {item.trackingNumber && ` - Tracking: ${item.trackingNumber}`}
          </p>
        </div>
      )}
    </div>
  );
}
