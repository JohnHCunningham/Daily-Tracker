'use client'

export default function TestButton() {
  console.log('✅ TestButton rendering')
  return (
    <button
      onClick={() => alert('Test button works!')}
      className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-red-500 rounded-full"
      style={{ backgroundColor: 'red' }}
    >
      TEST
    </button>
  )
}
