import { PeopleSection } from './components/PeopleSection'
import { ItemSection } from './components/ItemSection'
import { AssignSection } from './components/AssignSection'
import { TipTaxSection } from './components/TipTaxSection'
import { ResultsSection } from './components/ResultsSection'
import { HistorySection } from './components/HistorySection'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Expense Splitter</h1>
        <div className="space-y-6">
          <PeopleSection />
          <ItemSection />
          <AssignSection />
          <TipTaxSection />
          <ResultsSection />
          <HistorySection />
        </div>
      </div>
    </div>
  )
}

export default App
