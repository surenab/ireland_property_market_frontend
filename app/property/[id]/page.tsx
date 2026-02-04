'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, Property, PriceHistory } from '@/lib/api';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const PropertyLocationMap = dynamic(() => import('@/components/Map/PropertyLocationMap'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading map...</p>
      </div>
    </div>
  ),
});

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = parseInt(params.id as string);
  const [property, setProperty] = useState<Property | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propertyId) {
      loadProperty();
    }
  }, [propertyId]);

  const loadProperty = async () => {
    setLoading(true);
    try {
      const [prop, history] = await Promise.all([
        api.getProperty(propertyId),
        api.getPropertyHistory(propertyId),
      ]);
      setProperty(prop);
      setPriceHistory(history);
    } catch (error) {
      console.error('Error loading property:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading property details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-6xl mb-4">🏠</div>
          <p className="text-lg">Property not found</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const latestSale = priceHistory.length > 0 
    ? priceHistory.reduce((latest, current) => {
        const latestDate = new Date(latest.date_of_sale.split('/').reverse().join('-'));
        const currentDate = new Date(current.date_of_sale.split('/').reverse().join('-'));
        return currentDate > latestDate ? current : latest;
      })
    : null;

  const averagePrice = priceHistory.length > 0
    ? priceHistory.reduce((sum, ph) => sum + ph.price, 0) / priceHistory.length
    : 0;

  const minPrice = priceHistory.length > 0
    ? Math.min(...priceHistory.map(ph => ph.price))
    : 0;

  const maxPrice = priceHistory.length > 0
    ? Math.max(...priceHistory.map(ph => ph.price))
    : 0;

  // Format date helper
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
      <div className="mb-4 sm:mb-6">
        <a 
          href="/" 
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium mb-3 sm:mb-4 text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </a>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Property Details
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Property ID: #{property.id}</p>
          </div>
          {latestSale && (
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Latest Sale Price</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(latestSale.price)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {priceHistory.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Total Sales</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{priceHistory.length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Average Price</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(averagePrice)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Minimum Price</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(minPrice)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Maximum Price</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(maxPrice)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Address Information */}
      {property.address && (
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Address Information</h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Street Address</label>
                    <p className="text-lg text-gray-900 dark:text-white font-medium">{property.address.address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">County</label>
                    <p className="text-lg text-gray-900 dark:text-white font-medium">{property.address.county}</p>
                  </div>
          {property.address.eircode && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Eircode</label>
                      <p className="text-lg text-gray-900 dark:text-white font-medium">{property.address.eircode}</p>
                    </div>
                  )}
                  {property.address.country && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Country</label>
                      <p className="text-lg text-gray-900 dark:text-white font-medium">{property.address.country}</p>
                    </div>
                  )}
                </div>
                {property.address.formatted_address && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Formatted Address</label>
                    <p className="text-gray-700 dark:text-gray-300">{property.address.formatted_address}</p>
                  </div>
                )}
                {property.address.geocoded_at && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Geocoded At</label>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(property.address.geocoded_at)}</p>
                  </div>
                )}
              </div>
        </div>
      )}

          {/* Property Location Map */}
          {property.address && property.address.latitude && property.address.longitude && (
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg mr-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Property Location</h2>
              </div>
              <PropertyLocationMap
                latitude={property.address.latitude}
                longitude={property.address.longitude}
                address={property.address.address}
                county={property.address.county}
              />
        </div>
      )}

      {/* Price History Table */}
      {priceHistory.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mr-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Sale History</h2>
              </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Description</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Size</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {priceHistory
                  .sort((a, b) => {
                    const dateA = new Date(a.date_of_sale.split('/').reverse().join('-'));
                    const dateB = new Date(b.date_of_sale.split('/').reverse().join('-'));
                    return dateB.getTime() - dateA.getTime();
                  })
                  .map((ph) => (
                        <tr key={ph.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white font-medium">
                            {ph.date_of_sale}
                          </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(ph.price)}
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 dark:text-white max-w-md hidden sm:table-cell">
                            {ph.description}
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">
                            {ph.property_size_description || <span className="text-gray-400">N/A</span>}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm hidden lg:table-cell">
                            <div className="flex flex-col gap-1">
                              {ph.not_full_market_price && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  Not Full Market Price
                                </span>
                              )}
                              {ph.vat_exclusive && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  VAT Exclusive
                                </span>
                              )}
                            </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Daft.ie Information */}
          {(property.daft_url || property.daft_title || property.daft_body) && (
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg mr-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Daft.ie</h2>
              </div>
              <div className="space-y-4">
      {property.daft_url && (
                  <div>
          <a
            href={property.daft_url}
            target="_blank"
            rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
                    >
                      View on Daft.ie
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
                {property.daft_title && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Title</label>
                    <p className="text-gray-900 dark:text-white font-medium">{property.daft_title}</p>
                  </div>
                )}
                {property.daft_body && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Description</label>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {property.daft_body.length > 500 
                        ? `${property.daft_body.substring(0, 500)}...` 
                        : property.daft_body}
                    </p>
                    {property.daft_body.length > 500 && (
                      <button className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        Show more
                      </button>
                    )}
                  </div>
                )}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Scraped Status</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      property.daft_scraped 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {property.daft_scraped ? 'Scraped' : 'Not Scraped'}
                    </span>
                  </div>
          {property.daft_scraped_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Scraped At</label>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">{formatDate(property.daft_scraped_at)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Property Metadata */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Metadata</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Property ID</label>
                <p className="text-gray-900 dark:text-white font-mono">#{property.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Created At</label>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{formatDate(property.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Last Updated</label>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{formatDate(property.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
