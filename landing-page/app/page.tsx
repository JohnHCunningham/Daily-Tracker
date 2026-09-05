export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          One Click Coaching
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          The execution layer beneath your sales framework.
        </p>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">Test the Chatbot</h2>
          <p className="text-gray-700 mb-4">
            Look for the chat button in the bottom-right corner!
          </p>
          <p className="text-gray-600">
            Try asking:
          </p>
          <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
            <li>"What is One Click Coaching?"</li>
            <li>"Do you support MEDDIC?"</li>
            <li>"How much does it cost?"</li>
            <li>"I'm interested in learning more"</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
