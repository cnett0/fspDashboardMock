import { MapPin, Cpu, Activity, ShieldCheck, BarChart2, HelpCircle } from 'lucide-react'
import { Badge, TelemetryBadge, ControllabilityBadge } from '../ui/Badge'
import type { Asset } from '../../types/api'
import { assetControllability, assetTelemetryFreshness } from '../../types/api'
import { fmtPower, fmtEnergy, fmtAge } from '../../lib/format'
import { getTsoById, getVnbById } from '../../lib/region'
import { ASSET_TYPE_LABELS } from '../../lib/constants'
import { useApi } from '../../hooks/useApi'
import { getAssetAccuracy } from '../../api/accuracy'
import type {
  AssetAccuracyResult, AccuracyDetails, DenomMethod,
  DiagnosticEntry, DiagnosticSeverity,
} from '../../api/accuracy'
import { isLegacyDiagnostics, isStructuredDiagnostics } from '../../api/accuracy'

interface AssetInspectorProps {
  asset: Asset
}

export function AssetInspector({ asset }: AssetInspectorProps) {
  const tso = asset.uenbRegion ? getTsoById(asset.uenbRegion) : undefined
  const vnb = asset.vnbOperator ? getVnbById(asset.vnbOperator) : undefined

  const { data: accuracyData, loading: accuracyLoading } = useApi(
    () => getAssetAccuracy(asset.id),
    [asset.id],
  )

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-blue-400 text-xs font-bold">{asset.assetCode}</span>
          <ControllabilityBadge status={assetControllability(asset)} />
        </div>
        <h3 className="text-sm font-semibold text-slate-100 mt-1 leading-snug">{asset.name}</h3>
        <div className="flex items-center gap-1 mt-1 text-2xs text-slate-500">
          <MapPin size={10} />
          <span>{asset.city}, {asset.federalState} · {asset.postalCode}</span>
        </div>
      </div>

      {/* Type & status */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="slate">{ASSET_TYPE_LABELS[asset.assetType] ?? asset.assetType}</Badge>
        <TelemetryBadge freshness={assetTelemetryFreshness(asset)} />
      </div>

      {/* Grid placement */}
      <Section icon={<Cpu size={12} />} title="Netzanschluss">
        <Row label="ÜNB" value={tso?.name ?? asset.uenbRegion ?? '—'} />
        <Row label="VNB" value={vnb?.name ?? asset.vnbOperator ?? '—'} />
        <Row label="Planungsregion" value={asset.vnbPlanningRegion ?? '—'} />
        <Row label="Gridknoten" value={asset.gridNode ?? '—'} />
        <Row label="Feeder" value={asset.feederName ?? '—'} />
        <Row label="Bilanzkreis" value={asset.balancingGroup ?? '—'} />
      </Section>

      {/* Flexibility */}
      <Section icon={<Activity size={12} />} title="Flexibilitätsprofil">
        <Row label="Nennleistung" value={fmtPower(asset.nominalPowerKw)} />
        <Row label="Flex hoch ↑" value={fmtPower(asset.availableFlexUpKw)} valueColor="text-green-400" />
        <Row label="Flex runter ↓" value={fmtPower(asset.availableFlexDownKw)} valueColor="text-blue-400" />
        <Row label="Energie verfügbar" value={fmtEnergy(asset.availableEnergyKwh)} />
      </Section>

      {/* Forecast Accuracy */}
      <AccuracySection loading={accuracyLoading} data={accuracyData ?? null} />

      {/* Meta */}
      <Section icon={<ShieldCheck size={12} />} title="Meta">
        <Row label="Settlement" value={asset.settlementRelevant ? 'Relevant' : 'Nicht relevant'} />
        <Row label="Besitzer" value={asset.ownerName ?? '—'} />
        <Row label="Aktualisiert" value={fmtAge(asset.updatedAt)} />
      </Section>
    </div>
  )
}

// ── Accuracy section ──────────────────────────────────────────────────────────

const RMS_THRESHOLD_HIGH = 20  // % — flag as high error

function AccuracySection({ loading, data }: { loading: boolean; data: AssetAccuracyResult | null }) {
  return (
    <div className="panel p-2.5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500"><BarChart2 size={12} /></span>
          <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wide">Prognosegenauigkeit</span>
          <span
            className="text-slate-600 cursor-help"
            title="RMS % vergleicht 15-Min-Prognose mit gemessener 1-Min-Telemetrie (aggregiert auf 15 Min). Bias % zeigt systematische Über- oder Unterprognose."
          >
            <HelpCircle size={10} />
          </span>
        </div>
        {!loading && data && (
          <span className={`text-2xs px-1.5 py-0.5 rounded ${data.serviceAvailable ? 'text-green-400 bg-green-400/10' : 'text-slate-400 bg-gray-800/60'}`}>
            {data.serviceAvailable ? 'Live' : 'Flex-Engine offline'}
          </span>
        )}
      </div>

      {loading && (
        <div className="text-2xs text-slate-600 py-1">Berechne…</div>
      )}

      {!loading && data && (
        <div className="space-y-2">
          {/* Accuracy window metadata */}
          {data.accuracy && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-2xs mb-1">
              <span className="text-slate-600">Fenster</span>
              <span className="font-mono text-slate-400 text-right truncate" title={`${data.accuracy.windowStart} – ${data.accuracy.windowEnd}`}>
                {data.accuracy.windowStart?.slice(0, 10)} – {data.accuracy.windowEnd?.slice(0, 10)}
              </span>
              <span className="text-slate-600">Auflösung</span>
              <span className="font-mono text-slate-400 text-right">{data.accuracy.resolution ?? 'PT15M'}</span>
              <span className="text-slate-600">Stichproben</span>
              <span className="font-mono text-slate-400 text-right">{data.accuracy.sampleCount}</span>
            </div>
          )}

          {/* Excluded slots warning */}
          {isLegacyDiagnostics(data.diagnostics) && (data.diagnostics.accuracy_slots_excluded ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-2xs text-amber-400">
              <span>⚠</span>
              <span>
                {data.diagnostics.accuracy_slots_excluded} Slot
                {data.diagnostics.accuracy_slots_excluded !== 1 ? 's' : ''} ausgeschlossen (geringe Abdeckung)
              </span>
            </div>
          )}

          {/* RMS% signal gauges */}
          <div className="space-y-1.5">
            {buildSignalRows(data).map(sig => (
              <RmsGauge
                key={sig.label}
                label={sig.label}
                rmsPct={sig.rms ?? null}
                biasPct={sig.bias ?? null}
                rmseKw={sig.rmseKw ?? null}
                denomMethod={sig.denom ?? null}
                highThreshold={RMS_THRESHOLD_HIGH}
              />
            ))}
          </div>

          {/* Flex offer model stats */}
          {data.flexOfferStats.sampleCount > 0 && (
            <div className="border-t border-gray-700/40 pt-1.5 space-y-1">
              <Row
                label="Ø Modell-Konfidenz"
                value={data.flexOfferStats.avgConfidence !== null
                  ? `${(data.flexOfferStats.avgConfidence * 100).toFixed(0)}%`
                  : '—'}
                valueColor={confidenceColor(data.flexOfferStats.avgConfidence)}
              />
              <Row
                label="Ø Risiko-Score"
                value={data.flexOfferStats.avgRiskScore !== null
                  ? `${(data.flexOfferStats.avgRiskScore * 100).toFixed(0)}%`
                  : '—'}
                valueColor={riskColor(data.flexOfferStats.avgRiskScore)}
              />
              <Row label="Basis (Slots)" value={String(data.flexOfferStats.sampleCount)} />
            </div>
          )}

          {/* Data quality flags */}
          {data.dataQualityFlags.length > 0 && (
            <div className="border-t border-gray-700/40 pt-1.5">
              <div className="text-2xs text-slate-600 mb-1">Datenqualität</div>
              <div className="flex flex-wrap gap-1">
                {data.dataQualityFlags.map(f => (
                  <span key={f} className="text-2xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Diagnostics — structured (new format) */}
          {isStructuredDiagnostics(data.diagnostics) && data.diagnostics.length > 0 && (
            <DiagnosticsPanel entries={data.diagnostics} />
          )}

          {/* Diagnostics — legacy format */}
          {isLegacyDiagnostics(data.diagnostics) && (data.diagnostics.active_diagnostics ?? []).length > 0 && (
            <div className="border-t border-gray-700/40 pt-1.5">
              <div className="text-2xs text-slate-600 mb-1">Diagnosen</div>
              <div className="flex flex-wrap gap-1">
                {data.diagnostics.active_diagnostics.map(d => (
                  <span key={d} className="text-2xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono leading-tight">
                    {d.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Build the ordered list of signal rows, preferring daylight-split PV when present
function buildSignalRows(data: AssetAccuracyResult) {
  const acc = data.accuracy
  const det = acc?.details as AccuracyDetails | undefined

  const pvDaylight = acc?.pvRmsPctDaylightOnly ?? null
  const pvAllDay   = acc?.pvRmsPctAllDay ?? null
  const pvLegacy   = acc?.pvRmsPct ?? null

  // Show daylight-only PV if the new field is present; otherwise fall back
  const pvRows = pvDaylight !== null
    ? [
        { label: 'PV (Tag)',    rms: pvDaylight, bias: acc?.pvBiasPct ?? null, rmseKw: det?.pv_rmse_kw ?? det?.pvRmseKw ?? null, denom: det?.pv_denominator_method ?? null },
        { label: 'PV (Gesamt)', rms: pvAllDay,   bias: acc?.pvBiasPct ?? null, rmseKw: null,                                      denom: null },
      ]
    : [
        { label: 'PV', rms: pvLegacy, bias: acc?.pvBiasPct ?? null, rmseKw: det?.pv_rmse_kw ?? det?.pvRmseKw ?? null, denom: det?.pv_denominator_method ?? null },
      ]

  return [
    ...pvRows,
    { label: 'Last',            rms: acc?.loadRmsPct    ?? null, bias: acc?.loadBiasPct    ?? null, rmseKw: det?.load_rmse_kw    ?? det?.loadRmseKw    ?? null, denom: det?.load_denominator_method    ?? null },
    { label: 'Netz-Baseline',   rms: acc?.gridRmsPct    ?? null, bias: acc?.gridBiasPct    ?? null, rmseKw: det?.grid_rmse_kw    ?? det?.gridRmseKw    ?? null, denom: det?.grid_denominator_method    ?? null },
    { label: 'Batterie',        rms: acc?.batteryRmsPct ?? null, bias: acc?.batteryBiasPct ?? null, rmseKw: det?.battery_rmse_kw ?? det?.batteryRmseKw ?? null, denom: det?.battery_denominator_method ?? null },
    { label: 'PROD (Einspeis)', rms: acc?.prodRmsPct    ?? null, bias: acc?.prodBiasPct    ?? null, rmseKw: det?.prod_rmse_kw    ?? det?.prodRmseKw    ?? null, denom: det?.prod_denominator_method    ?? null },
    { label: 'VERB (Bezug)',    rms: acc?.verbRmsPct    ?? null, bias: acc?.verbBiasPct    ?? null, rmseKw: det?.verb_rmse_kw    ?? det?.verbRmseKw    ?? null, denom: det?.verb_denominator_method    ?? null },
  ]
}

// ── Structured diagnostics panel ──────────────────────────────────────────────

const DIAG_LABEL: Partial<Record<string, string>> = {
  PV_NIGHT_CLAMPED:                   'PV Nacht → 0 gesetzt',
  OUTSIDE_SUNRISE_SUNSET:             'Außerhalb Auf-/Untergang',
  WEATHER_MISSING:                    'Wetterdaten fehlen',
  IRRADIANCE_MISSING:                 'Strahlungsdaten fehlen',
  HISTORY_DAYLIGHT_FILTERED:          'Tagstunden gefiltert',
  STALE_TELEMETRY:                    'Telemetrie veraltet',
  SIGN_CONVENTION_ASSUMED:            'Vorzeichen angenommen',
  PHYSICAL_LIMIT_CLAMPED:             'Physikalisches Limit',
  HIGH_FORECAST_UNCERTAINTY:          'Hohe Prognose-Unsicherheit',
  BATTERY_ENERGY_LIMIT_BINDING:       'Batterie-Energielimit bindend',
  GRID_LIMIT_BINDING:                 'Netzlimit bindend',
  INSUFFICIENT_60_MIN_DELIVERABILITY: '60-Min-Lieferbarkeit unzureichend',
}

const SEVERITY_STYLE: Record<DiagnosticSeverity, string> = {
  info:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error:   'bg-red-500/10 text-red-400 border-red-500/20',
}

function DiagnosticsPanel({ entries }: { entries: DiagnosticEntry[] }) {
  return (
    <div className="border-t border-gray-700/40 pt-1.5">
      <div className="text-2xs text-slate-600 mb-1">Diagnosen</div>
      <div className="flex flex-wrap gap-1">
        {entries.map((d, i) => (
          <span
            key={`${d.code}-${i}`}
            className={`text-2xs px-1.5 py-0.5 rounded border font-mono leading-tight cursor-help ${SEVERITY_STYLE[d.severity] ?? SEVERITY_STYLE.info}`}
            title={[d.message, d.affectedSignal && `Signal: ${d.affectedSignal}`, d.timestamp].filter(Boolean).join('\n')}
          >
            {DIAG_LABEL[d.code] ?? d.code.replace(/_/g, ' ')}
          </span>
        ))}
      </div>
      {/* Show full message for errors */}
      {entries.filter(e => e.severity === 'error').map((e, i) => (
        <div key={`msg-${e.code}-${i}`} className="mt-1 text-2xs text-red-400/80 pl-1">
          {e.message}
        </div>
      ))}
    </div>
  )
}

// ── RMS gauge ─────────────────────────────────────────────────────────────────

const DENOM_BADGE: Record<string, { label: string; color: string; title: string }> = {
  mean_abs_measured: { label: 'M',  color: 'text-slate-500',  title: 'Nenner: Mittelwert |gemessen|' },
  rated_kw:          { label: 'R',  color: 'text-amber-500',  title: 'Nenner: Nennleistung (Fallback)' },
  epsilon:           { label: 'ε',  color: 'text-red-500',    title: 'Nenner: Epsilon (Signal nahe Null)' },
}

function RmsGauge({
  label, rmsPct, biasPct, rmseKw, denomMethod, highThreshold = 20,
}: {
  label: string
  rmsPct: number | null
  biasPct: number | null
  rmseKw?: number | null
  denomMethod?: DenomMethod | null
  highThreshold?: number
}) {
  const hasValue = rmsPct !== null
  const isHigh   = hasValue && rmsPct! >= highThreshold
  const barWidth = hasValue ? Math.min(rmsPct!, 100) : 0
  const color = !hasValue ? 'bg-slate-700'
    : rmsPct! < 10  ? 'bg-green-500'
    : rmsPct! < highThreshold ? 'bg-amber-500'
    : 'bg-red-500'
  const textColor = !hasValue ? 'text-slate-600'
    : rmsPct! < 10  ? 'text-green-400'
    : rmsPct! < highThreshold ? 'text-amber-400'
    : 'text-red-400'
  const denom = denomMethod ? DENOM_BADGE[denomMethod] : null

  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-2xs text-slate-500 w-[5.5rem] flex items-center gap-1">
          {label}
          {isHigh && <span className="text-red-400" title="Hoher RMS-Fehler (≥ 20 %)">⚠</span>}
        </span>
        <div className="flex items-center gap-2 flex-1 mx-2">
          <div className="flex-1 h-1 bg-gray-700/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${color}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5 justify-end" style={{ minWidth: '7.5rem' }}>
          <span className={`text-2xs font-mono tabular-nums ${textColor}`}>
            {hasValue ? `${rmsPct!.toFixed(1)}%` : '—'}
          </span>
          {rmseKw !== null && rmseKw !== undefined && (
            <span className="text-2xs font-mono tabular-nums text-slate-600">
              {rmseKw.toFixed(2)} kW
            </span>
          )}
          {biasPct !== null && (
            <span
              className={`text-2xs font-mono tabular-nums ${biasPct > 0 ? 'text-orange-400' : 'text-cyan-400'}`}
              title={biasPct > 0 ? 'Überprognose' : 'Unterprognose'}
            >
              {biasPct > 0 ? '+' : ''}{biasPct.toFixed(1)}%
            </span>
          )}
          {denom && (
            <span className={`text-2xs font-mono font-bold ${denom.color}`} title={denom.title}>
              {denom.label}
            </span>
          )}
        </div>
      </div>
      {!hasValue && (
        <div className="text-2xs text-slate-700 pl-[5.5rem] -mt-0.5">nicht verfügbar</div>
      )}
    </div>
  )
}

function confidenceColor(v: number | null): string {
  if (v === null) return 'text-slate-500'
  if (v >= 0.7)  return 'text-green-400'
  if (v >= 0.4)  return 'text-amber-400'
  return 'text-red-400'
}

function riskColor(v: number | null): string {
  if (v === null) return 'text-slate-500'
  if (v <= 0.3)  return 'text-green-400'
  if (v <= 0.6)  return 'text-amber-400'
  return 'text-red-400'
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="panel p-2.5">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-slate-500">{icon}</span>
        <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wide">{title}</span>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Row({ label, value, valueColor = 'text-slate-300' }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-2xs text-slate-600">{label}</span>
      <span className={`text-2xs font-mono ${valueColor} text-right max-w-[60%] truncate`}>{value}</span>
    </div>
  )
}
