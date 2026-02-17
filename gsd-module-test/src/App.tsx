import { ItemSection } from './components/ItemSection'
import { PeopleSection } from './components/PeopleSection'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Expense Splitter</h1>
        <div className="space-y-6">
          <PeopleSection />
          <ItemSection />
          {/* AssignSection, TipTaxSection, ResultsSection added in 02-03 */}
        </div>
      </div>
    </div>
  )
}

export default App
