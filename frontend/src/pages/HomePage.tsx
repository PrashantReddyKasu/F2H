"use client"

import { Link } from "react-router-dom"

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="relative rounded-xl overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: 'url("/1.jpg")',
              }}
            ></div>
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="relative z-10 py-20 px-6 md:px-12">
              <div className="max-w-lg">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Welcome to <span className="text-green-300">F2H</span>
                </h1>
                <p className="text-xl text-white mb-8">
                  Connecting farmers directly with customers, creating a sustainable marketplace for fresh, local
                  produce.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/register"
                    className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-center"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="inline-block bg-white hover:bg-gray-100 text-green-600 font-bold py-3 px-6 rounded-lg border border-green-600 text-center"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Our Core Features</h2>
          <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            Farm-to-Home offers innovative ways to connect farmers and consumers, creating a fair marketplace for
            everyone.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-green-50 p-8 rounded-lg shadow-sm">
              <div className="bg-green-100 w-12 h-12 flex items-center justify-center rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Bargain System</h3>
              <p className="text-gray-600 mb-4">
                Select products from different farmers and send bargain requests. Farmers respond within an hour with
                their best offers.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Compare prices from multiple farmers</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Negotiate for better deals</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Real-time responses from farmers</span>
                </li>
              </ul>
            </div>
            <div className="bg-green-50 p-8 rounded-lg shadow-sm">
              <div className="bg-green-100 w-12 h-12 flex items-center justify-center rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8 8-4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Bundle Deals</h3>
              <p className="text-gray-600 mb-4">
                Purchase larger quantities at discounted prices. Request bundle deals directly from farmers for bulk
                orders.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save on bulk purchases</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Customize your bundle quantities</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Counter-offers from farmers</span>
                </li>
              </ul>
            </div>
            <div className="bg-green-50 p-8 rounded-lg shadow-sm">
              <div className="bg-green-100 w-12 h-12 flex items-center justify-center rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Price Matching</h3>
              <p className="text-gray-600 mb-4">
                Found a better price elsewhere? Ask your preferred farmer to match it and continue supporting them.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Compare prices across farmers</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Request price matches</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Support your favorite farmers</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Farmer Support Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2 relative">
              <img src="/2.jpg" alt="Farmer harvesting crops" className="rounded-lg shadow-lg w-full" />
              <div className="absolute -bottom-5 -right-5 bg-white p-4 rounded-lg shadow-md flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-xl">100+</div>
                  <div className="text-sm text-gray-600">Local Farmers</div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Supporting Local Farmers, <br />
                <span className="text-green-600">Empowering Communities</span>
              </h2>
              <p className="text-gray-600 mb-4">
                Our farmers are the heart of Farm-to-Home. They wake up at dawn, tend to their crops with care, and
                harvest the freshest produce for your table.
              </p>
              <p className="text-gray-600 mb-8">
                By connecting directly with customers, farmers earn fair prices for their hard work while building
                sustainable businesses that support local economies and preserve agricultural traditions.
              </p>
              <div className="flex flex-wrap gap-12">
                <div>
                  <div className="text-4xl font-bold text-green-600">30%</div>
                  <div className="text-gray-600">Higher earnings for farmers</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-600">85%</div>
                  <div className="text-gray-600">Reduction in food waste</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="md:w-1/2 relative">
              <img
                src="/3.jpg"
                alt="Happy customers with fresh produce"
                className="rounded-lg shadow-lg w-full"
              />
              <div className="absolute -bottom-5 -left-5 bg-white p-4 rounded-lg shadow-md flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-xl">10,000+</div>
                  <div className="text-sm text-gray-600">Happy Customers</div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Fresh Food for Families, <br />
                <span className="text-green-600">Straight from the Source</span>
              </h2>
              <p className="text-gray-600 mb-4">
                Our customers enjoy farm-fresh produce delivered directly to their homes. No more wondering where your
                food comes from or how long it's been sitting on a shelf.
              </p>
              <p className="text-gray-600 mb-8">
                With Farm-to-Home, you can chat with farmers, learn about growing practices, and even negotiate
                prices—creating a personal connection to your food that supermarkets simply can't offer.
              </p>
              <div className="flex flex-wrap gap-12">
                <div>
                  <div className="text-4xl font-bold text-green-600">24hr</div>
                  <div className="text-gray-600">From harvest to delivery</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-600">20%</div>
                  <div className="text-gray-600">Average savings on groceries</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Partner Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2 relative">
              <img
                src="/4.webp"
                alt="Delivery partner with fresh produce"
                className="rounded-lg shadow-lg w-full"
              />
              <div className="absolute -bottom-5 -right-5 bg-white p-4 rounded-lg shadow-md flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-xl">50+</div>
                  <div className="text-sm text-gray-600">Delivery Partners</div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Connecting Communities, <br />
                <span className="text-green-600">Delivering Freshness</span>
              </h2>
              <p className="text-gray-600 mb-4">
                Our delivery partners are the vital link between farmers and customers. They ensure that fresh produce
                reaches homes quickly, maintaining quality and freshness every step of the way.
              </p>
              <p className="text-gray-600 mb-8">
                By joining F2H as a delivery partner, you'll enjoy flexible working hours, competitive earnings, and the
                satisfaction of supporting local food systems while building meaningful relationships with farmers and
                customers in your community.
              </p>
              <div className="flex flex-wrap gap-12">
                <div>
                  <div className="text-4xl font-bold text-green-600">40%</div>
                  <div className="text-gray-600">Higher delivery earnings</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-600">95%</div>
                  <div className="text-gray-600">On-time delivery rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-green-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Experience Farm-Fresh Food?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join our community of farmers and food lovers today. Sign up now to start ordering fresh, local produce
            directly from farms near you.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="inline-block bg-white hover:bg-gray-100 text-green-600 font-bold py-3 px-8 rounded-lg text-center"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="inline-block bg-transparent hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg border border-white text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0 md:w-1/3">
              <h2 className="text-2xl font-bold mb-4">F2H</h2>
              <p className="text-gray-400 mb-4">
                Connecting local farmers directly with customers for fresher food and fairer prices.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.5h-2v-4h2v4zm-5 0h-2v-4h2v4zm-5 0h-2v-4h2v4z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="md:w-1/3">
              <h3 className="text-xl font-bold mb-4">Contact Us</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-start">
                  <svg className="h-6 w-6 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-gray-400">123 Farm Lane, Harvest Valley, CA 94123</span>
                </div>
                <div className="flex items-start">
                  <svg className="h-6 w-6 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="text-gray-400">(555) 123-4567</span>
                </div>
                <div className="flex items-start">
                  <svg className="h-6 w-6 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-gray-400">support@farmtohome.com</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; {new Date().getFullYear()} F2H. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-gray-400 hover:text-white">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
