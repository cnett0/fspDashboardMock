import { useState } from 'react'
import { GermanyGridMap } from '../components/map/GermanyGridMap'
import { AssetInspector } from '../components/fsp/AssetInspector'
import { CongestionPanel } from '../components/fsp/CongestionPanel'
import { NodeSummaryTable } from '../components/fsp/NodeSummaryTable'
import { GridRelevancePanel } from '../components/fsp/GridRelevancePanel'
import { RightInspector } from '../layout/RightInspector'
import { Card, CardHeader } from '../components/ui/Card'
import { Tabs } from '../components/ui/Tabs'
import { TSO_REGIONS } from '../lib/constants'
import type { Asset } from '../types/api'

export function GridOperationsPage() {
  const [inspector, setInspector] = useState<Asset | null>(null)
  const [leftTab, setLeftTab] = useState('grid')

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-gray-800 flex flex-col bg-gradient-to-b from-gray-600 to-gray-900 overflow-hidden">
        <div className="p-2 border-b border-gray-700/40">
          <Tabs
            tabs={[
              { id: 'grid', label: 'Grid Relevance' },
              { id: 'congestion', label: 'Congestion' },
              { id: 'nodes', label: 'Nodes' },
              { id: 'regions', label: 'TSO Regions' },
            ]}
            activeTab={leftTab}
            onChange={setLeftTab}
          />
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-2">
          {leftTab === 'grid' && <GridRelevancePanel />}
          {leftTab === 'congestion' && <CongestionPanel />}
          {leftTab === 'nodes' && (
            <Card>
              <CardHeader title="Grid Nodes" />
              <NodeSummaryTable />
            </Card>
          )}
          {leftTab === 'regions' && <RegionList />}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative overflow-hidden">
        <GermanyGridMap
          onAssetSelect={setInspector}
          selectedAssetId={inspector?.id}
          height="100%"
        />
      </div>

      {/* Right inspector */}
      <RightInspector
        open={inspector !== null}
        onClose={() => setInspector(null)}
        title="Asset Details"
      >
        {inspector && <AssetInspector asset={inspector} />}
      </RightInspector>
    </div>
  )
}

function RegionList() {
  return (
    <div className="space-y-2">
      {TSO_REGIONS.map(tso => (
        <Card key={tso.id} className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tso.color }} />
            <span className="text-xs font-semibold text-slate-200">{tso.shortName}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-2xs text-slate-600">Control Center</span>
              <span className="text-2xs font-mono text-slate-400">{tso.controlCenter}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-2xs text-slate-600">States</span>
              <span className="text-2xs text-slate-500 text-right max-w-[60%] truncate">{tso.states.slice(0, 2).join(', ')}{tso.states.length > 2 ? '…' : ''}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
