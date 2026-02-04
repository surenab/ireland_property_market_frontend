import Link from 'next/link';

export default function Home() {
  const features = [
    {
      href: '/map',
      icon: '🗺️',
      title: 'Interactive Map',
      description: 'Explore properties on an interactive map with multiple clustering modes',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      href: '/statistics',
      icon: '📊',
      title: 'Statistics',
      description: 'View price trends, clustering analysis, and county comparisons',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      href: '/search',
      icon: '🔍',
      title: 'Search',
      description: 'Search properties by address or eircode with autocomplete',
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16 lg:py-24">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
            Ireland Property Data
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
            Explore <span className="font-semibold text-blue-600 dark:text-blue-400">760k+</span> Irish property records with interactive maps and statistical analysis
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto mb-8 sm:mb-12 md:mb-16">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-gray-800 p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2 border border-gray-200 dark:border-gray-700"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-gray-900 dark:text-white">
                  {feature.title}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-4 sm:mt-6 flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-2 transition-transform duration-300 text-sm sm:text-base">
                  Explore →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats Section */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-gray-900 dark:text-white">
              Platform Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1 sm:mb-2">760k+</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Properties</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1 sm:mb-2">26</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Counties</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-1 sm:mb-2">100%</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Free</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-pink-600 dark:text-pink-400 mb-1 sm:mb-2">24/7</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
