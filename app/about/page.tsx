'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        {/* Back Button */}
        <div className="mb-6 sm:mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto mb-6 sm:mb-8 rounded-full overflow-hidden shadow-2xl border-4 border-blue-500 dark:border-blue-400">
            <Image
              src="/me.jpeg"
              alt="Suren Abrahamyan"
              fill
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
            Suren Abrahamyan
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Full-Stack Developer & Data Enthusiast
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Story Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
              My Story
            </h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Hello! I&apos;m <strong className="text-blue-600 dark:text-blue-400">Suren Abrahamyan</strong>, a passionate full-stack developer with a deep love for data, technology, and creating meaningful digital experiences. My journey in software development has been driven by curiosity, innovation, and the desire to solve complex problems through elegant solutions.
              </p>
              
              <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                I specialize in building modern web applications using cutting-edge technologies like <strong>Next.js</strong>, <strong>React</strong>, <strong>TypeScript</strong>, and <strong>Python</strong>. My expertise spans from frontend user interface design to backend API development, database management, and data processing pipelines.
              </p>

              <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                This <strong>Ireland Property Data</strong> platform represents one of my most ambitious projects. It showcases my ability to work with large-scale datasets (760k+ property records), implement sophisticated data visualization techniques, and create intuitive user interfaces that make complex data accessible to everyone.
              </p>

              <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                What excites me most about this project is the intersection of technology and real-world data. I&apos;ve built comprehensive data scraping systems, implemented advanced geocoding solutions, created interactive map visualizations with multiple clustering algorithms, and developed statistical analysis tools that provide valuable insights into the Irish property market.
              </p>

              <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                Beyond coding, I&apos;m passionate about continuous learning, open-source contributions, and sharing knowledge with the developer community. I believe in writing clean, maintainable code and building applications that not only function well but also provide exceptional user experiences.
              </p>
            </div>
          </div>

          {/* Skills & Technologies */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
              Skills & Technologies
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-blue-600 dark:text-blue-400">Frontend</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <span className="mr-2">⚛️</span>
                    React & Next.js
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">📘</span>
                    TypeScript
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">🎨</span>
                    Tailwind CSS
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">🗺️</span>
                    Leaflet Maps
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-purple-600 dark:text-purple-400">Backend</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <span className="mr-2">🐍</span>
                    Python & FastAPI
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">🗄️</span>
                    SQLite & Database Design
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">🕷️</span>
                    Web Scraping
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">🌐</span>
                    RESTful APIs
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-green-600 dark:text-green-400">Data & Analytics</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <span className="mr-2">📊</span>
                    Data Processing
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">📍</span>
                    Geocoding & GIS
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">📈</span>
                    Statistical Analysis
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">🔍</span>
                    Data Visualization
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-pink-600 dark:text-pink-400">Tools & Practices</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <span className="mr-2">🔧</span>
                    Git & Version Control
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">🐳</span>
                    Docker & Deployment
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">✅</span>
                    Testing & Quality Assurance
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">📱</span>
                    Responsive Design
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Project Highlights */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
              About This Project
            </h2>
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-blue-900 dark:text-blue-100">
                  🗺️ Interactive Map Visualization
                </h3>
                <p className="text-sm sm:text-base text-blue-800 dark:text-blue-200">
                  Built with Leaflet.js, featuring multiple clustering modes, spatial pattern analysis, hotspot detection, and real-time filtering capabilities.
                </p>
              </div>
              
              <div className="p-4 sm:p-5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-purple-900 dark:text-purple-100">
                  📊 Advanced Statistics Dashboard
                </h3>
                <p className="text-sm sm:text-base text-purple-800 dark:text-purple-200">
                  Comprehensive analytics including price trends, county comparisons, and interactive charts with customizable time periods.
                </p>
              </div>
              
              <div className="p-4 sm:p-5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-green-900 dark:text-green-100">
                  🔍 Intelligent Search System
                </h3>
                <p className="text-sm sm:text-base text-green-800 dark:text-green-200">
                  Address autocomplete, eircode search, and advanced filtering with real-time property count updates.
                </p>
              </div>
              
              <div className="p-4 sm:p-5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-orange-900 dark:text-orange-100">
                  🕷️ Data Scraping & Processing
                </h3>
                <p className="text-sm sm:text-base text-orange-800 dark:text-orange-200">
                  Automated data collection from multiple sources, geocoding integration, and efficient database management for 760k+ records.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">
              Let&apos;s Connect
            </h2>
            <p className="text-base sm:text-lg text-blue-100 mb-6 max-w-2xl mx-auto">
              I&apos;m always open to discussing new projects, creative ideas, or opportunities to collaborate. Feel free to reach out!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/surenab"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/suren-abrahamyan/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

