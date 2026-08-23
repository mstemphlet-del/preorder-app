import { prisma } from '../lib/prisma';
import { AddToCartButton } from '../components/AddToCartButton';
import Link from 'next/link';

export default async function Home() {
  const now = new Date();

  const activeWindows = await prisma.inventoryWindow.findMany({
    where: {
      startTime: { lte: now },
      endTime: { gte: now },
    },
    include: {
      product: {
        include: { vendor: true },
      },
    },
    orderBy: { endTime: 'asc' },
  });

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Live Preorders</h1>
          <p className="text-gray-600">
            Limited-time drops from our vendors. Order before the window closes!
          </p>
          <Link href="/cart" className="inline-block mt-4 bg-gray-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800">
            View Cart
          </Link>
          <Link href="/orders" className="inline-block mt-2 text-blue-600 hover:underline text-sm">
            View My Orders
          </Link>
        </header>

        {activeWindows.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No active preorders right now.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {activeWindows.map((window) => {
              const available = window.maxQuantity - window.currentSold;
              const stockPercent = (available / window.maxQuantity) * 100;

              return (
                <div
                  key={window.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row"
                >
                  {window.product.imageUrl && (
                    <img
                      src={window.product.imageUrl}
                      alt={window.product.title}
                      className="w-full md:w-48 h-48 object-cover"
                    />
                  )}
                  
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">
                          {window.product.title}
                        </h2>
                        <span className="text-xl font-bold text-green-600">
                          ${window.product.basePrice}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 mb-3">
                        by <span className="font-semibold text-gray-700">{window.product.vendor.name}</span> • {window.windowName}
                      </p>

                      <p className="text-gray-600 mb-4">{window.product.description}</p>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className={available < 10 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                            {available} left in stock
                          </span>
                          <span className="text-gray-500">of {window.maxQuantity}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${stockPercent < 20 ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${stockPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">Window closes:</span>{' '}
                        {window.endTime.toLocaleDateString()} at {window.endTime.toLocaleTimeString()}
                      </div>
                      
                      <AddToCartButton 
                        windowId={window.id}
                        productTitle={window.product.title}
                        vendorName={window.product.vendor.name}
                        unitPrice={window.product.basePrice}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}