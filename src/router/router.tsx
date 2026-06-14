import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../layout/AppShell'
import { OverviewPage } from '../pages/OverviewPage'
import { GridOperationsPage } from '../pages/GridOperationsPage'
import { MarketIntelligencePage } from '../pages/MarketIntelligencePage'
import { AssetsPage } from '../pages/AssetsPage'
import { AssetRegistrationPage } from '../pages/AssetRegistrationPage'
import { AssetManagePage } from '../pages/AssetManagePage'
import { PoolManagementPage } from '../pages/PoolManagementPage'
import { RegionalPoolExplorerPage } from '../pages/RegionalPoolExplorerPage'
import { DispatchPage } from '../pages/DispatchPage'
import { CbpAlignmentPage } from '../pages/CbpAlignmentPage'
import { BalancingGroupPage } from '../pages/BalancingGroupPage'
import { PricingSignalsPage } from '../pages/PricingSignalsPage'
import { AnalyticsPage } from '../pages/AnalyticsPage'
import { SettingsPage } from '../pages/SettingsPage'
import { EnvelioPage } from '../pages/EnvelioPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/overview" replace /> },
      { path: 'overview', element: <OverviewPage /> },
      { path: 'grid', element: <GridOperationsPage /> },
      { path: 'markets', element: <MarketIntelligencePage /> },
      { path: 'assets', element: <AssetsPage /> },
      { path: 'assets/register', element: <AssetRegistrationPage /> },
      { path: 'assets/manage', element: <AssetManagePage /> },
      { path: 'pools', element: <PoolManagementPage /> },
      { path: 'pools/regions', element: <RegionalPoolExplorerPage /> },
      { path: 'dispatch', element: <DispatchPage /> },
      { path: 'cbp', element: <CbpAlignmentPage /> },
      { path: 'balancing', element: <BalancingGroupPage /> },
      { path: 'pricing', element: <PricingSignalsPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'envelio', element: <EnvelioPage /> },
    ],
  },
])
