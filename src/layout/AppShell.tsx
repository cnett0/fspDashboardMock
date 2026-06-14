import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'
import { LeftNav } from './LeftNav'
import { DateRangeProvider } from '../context/DateRangeContext'
import { RefreshProvider } from '../context/RefreshContext'

export function AppShell() {
  return (
    <DateRangeProvider>
      <RefreshProvider>
        <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-400 overflow-hidden">
          <TopBar />
          <div className="flex flex-1 overflow-hidden">
            <LeftNav />
            <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900">
              <Outlet />
            </main>
          </div>
        </div>
      </RefreshProvider>
    </DateRangeProvider>
  )
}
