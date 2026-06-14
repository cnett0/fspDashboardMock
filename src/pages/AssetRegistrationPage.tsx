import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { useToast } from '../components/ui/Toast'
import { useApiMutation } from '../hooks/useApi'
import { createAsset } from '../api/assets'
import type { Asset } from '../types/api'
import { CheckCircle, AlertTriangle, MapPin, Zap, Settings2, FileText } from 'lucide-react'

const ASSET_TYPE_OPTIONS = [
  { value: 'ev_charger', label: 'EV Charger' },
  { value: 'ev_fleet', label: 'EV Fleet' },
  { value: 'home_battery', label: 'Home Battery' },
  { value: 'ci_battery', label: 'C&I Battery' },
  { value: 'heat_pump', label: 'Heat Pump' },
  { value: 'thermal_storage', label: 'Thermal Storage' },
  { value: 'pv_coupled', label: 'PV-Coupled Storage' },
  { value: 'industrial_load', label: 'Industrial Load' },
  { value: 'controllable_prosumer', label: 'Controllable Prosumer' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' },
]

const UENB_REGION_OPTIONS = [
  { value: '50hertz', label: '50Hertz Transmission' },
  { value: 'amprion', label: 'Amprion' },
  { value: 'tennet', label: 'TenneT TSO' },
  { value: 'transnetbw', label: 'TransnetBW' },
]

const VNB_OPERATOR_OPTIONS = [
  { value: 'ewe-netz', label: 'EWE Netz GmbH' },
  { value: 'sh-netz', label: 'Schleswig-Holstein Netz GmbH' },
  { value: 'sw-heide', label: 'Stadtwerke Heide GmbH' },
  { value: 'netze-bw', label: 'Netze BW GmbH' },
  { value: 'lew-verteil', label: 'LEW Verteilnetz GmbH' },
  { value: 'sw-weilheim', label: 'Stromnetz Weilheim GmbH' },
  { value: 'westnetz', label: 'Westnetz GmbH' },
  { value: 'wesernetz', label: 'wesernetz Bremen GmbH' },
  { value: 'bad-honnef', label: 'Bad Honnef AG' },
  { value: 'mitnetz', label: 'MITNETZ Strom' },
  { value: 'netz-leipzig', label: 'Netz Leipzig GmbH' },
  { value: 'sw-torgau', label: 'Stadtwerke Torgau GmbH' },
]

const VNB_PLANNING_REGION_OPTIONS = [
  { value: 'nord-west', label: 'Planungsregion Nord-West' },
  { value: 'nord-ost', label: 'Planungsregion Nord-Ost' },
  { value: 'mitte-ost', label: 'Planungsregion Mitte-Ost' },
  { value: 'west-rhein', label: 'Planungsregion West-Rhein' },
  { value: 'sued-west', label: 'Planungsregion Süd-West' },
  { value: 'sued-ost', label: 'Planungsregion Süd-Ost' },
]

const BALANCING_GROUP_OPTIONS = [
  { value: 'BG-FSP-NORD-01', label: 'BG-FSP-NORD-01 (Hamburg/Schleswig-Holstein)' },
  { value: 'BG-FSP-NORD-02', label: 'BG-FSP-NORD-02 (Niedersachsen)' },
  { value: 'BG-FSP-WEST-01', label: 'BG-FSP-WEST-01 (NRW-Süd)' },
  { value: 'BG-FSP-WEST-02', label: 'BG-FSP-WEST-02 (NRW-Nord/Rhein)' },
  { value: 'BG-FSP-OST-01', label: 'BG-FSP-OST-01 (Sachsen/Thüringen)' },
  { value: 'BG-FSP-OST-02', label: 'BG-FSP-OST-02 (Brandenburg/Berlin)' },
  { value: 'BG-FSP-SUED-01', label: 'BG-FSP-SUED-01 (Bayern-West)' },
  { value: 'BG-FSP-SUED-02', label: 'BG-FSP-SUED-02 (Baden-Württemberg)' },
]

type FormData = {
  assetCode: string
  name: string
  assetType: string
  status: string
  ownerName: string
  nominalPowerKw: string
  availableFlexUpKw: string
  availableFlexDownKw: string
  availableEnergyKwh: string
  city: string
  postalCode: string
  federalState: string
  latitude: string
  longitude: string
  gridNode: string
  feederName: string
  uenbRegion: string
  vnbOperator: string
  vnbPlanningRegion: string
  balancingGroup: string
  settlementRelevant: boolean
  controllable: boolean
}

const INITIAL_FORM: FormData = {
  assetCode: '',
  name: '',
  assetType: '',
  status: 'pending',
  ownerName: '',
  nominalPowerKw: '',
  availableFlexUpKw: '',
  availableFlexDownKw: '',
  availableEnergyKwh: '',
  city: '',
  postalCode: '',
  federalState: '',
  latitude: '',
  longitude: '',
  gridNode: '',
  feederName: '',
  uenbRegion: '',
  vnbOperator: '',
  vnbPlanningRegion: '',
  balancingGroup: '',
  settlementRelevant: true,
  controllable: true,
}

type ValidationErrors = Partial<Record<keyof FormData, string>>

function validate(form: FormData): ValidationErrors {
  const errors: ValidationErrors = {}
  if (!form.assetCode.trim()) errors.assetCode = 'Asset-Code ist erforderlich'
  else if (!/^[A-Z0-9\-]{3,20}$/.test(form.assetCode)) errors.assetCode = 'Nur Großbuchstaben, Zahlen und Bindestriche (3–20 Zeichen)'
  if (!form.name.trim()) errors.name = 'Name ist erforderlich'
  if (!form.assetType) errors.assetType = 'Asset-Typ ist erforderlich'
  if (!form.uenbRegion) errors.uenbRegion = 'ÜNB-Region ist erforderlich'
  if (!form.vnbOperator) errors.vnbOperator = 'VNB-Betreiber ist erforderlich'
  if (!form.vnbPlanningRegion) errors.vnbPlanningRegion = 'VNB-Planungsregion ist erforderlich'
  if (!form.nominalPowerKw || isNaN(Number(form.nominalPowerKw)) || Number(form.nominalPowerKw) <= 0)
    errors.nominalPowerKw = 'Nennleistung muss > 0 kW sein'
  if (form.latitude && (isNaN(Number(form.latitude)) || Number(form.latitude) < 47 || Number(form.latitude) > 55))
    errors.latitude = 'Breitengrad: 47–55 (Deutschland)'
  if (form.longitude && (isNaN(Number(form.longitude)) || Number(form.longitude) < 6 || Number(form.longitude) > 15))
    errors.longitude = 'Längengrad: 6–15 (Deutschland)'
  return errors
}

type SectionProps = { title: string; icon: React.ReactNode; children: React.ReactNode }
function Section({ title, icon, children }: SectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-blue-400">{icon}</span>
          <span>{title}</span>
        </div>
      </CardHeader>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </Card>
  )
}

type FieldProps = {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  span?: boolean
}
function Field({ label, error, required, children, span }: FieldProps) {
  return (
    <div className={span ? 'md:col-span-2 lg:col-span-3' : ''}>
      <label className="block text-2xs font-medium text-slate-400 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <div className="flex items-center gap-1 mt-1">
          <AlertTriangle size={10} className="text-red-400 flex-shrink-0" />
          <span className="text-2xs text-red-400">{error}</span>
        </div>
      )}
    </div>
  )
}

export function AssetRegistrationPage() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const { success: toastSuccess, error: toastError } = useToast()
  const navigate = useNavigate()
  const { mutate, loading } = useApiMutation((data: Partial<Asset>) => createAsset(data))

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const payload: Partial<Asset> = {
      assetCode: form.assetCode,
      name: form.name,
      assetType: form.assetType as Asset['assetType'],
      status: form.status as Asset['status'],
      ownerName: form.ownerName || undefined,
      nominalPowerKw: Number(form.nominalPowerKw),
      availableFlexUpKw: form.availableFlexUpKw ? Number(form.availableFlexUpKw) : 0,
      availableFlexDownKw: form.availableFlexDownKw ? Number(form.availableFlexDownKw) : 0,
      availableEnergyKwh: form.availableEnergyKwh ? Number(form.availableEnergyKwh) : 0,
      city: form.city || undefined,
      postalCode: form.postalCode || undefined,
      federalState: form.federalState || undefined,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
      gridNode: form.gridNode || undefined,
      feederName: form.feederName || undefined,
      uenbRegion: form.uenbRegion || undefined,
      vnbOperator: form.vnbOperator || undefined,
      vnbPlanningRegion: form.vnbPlanningRegion || undefined,
      balancingGroup: form.balancingGroup || undefined,
      settlementRelevant: form.settlementRelevant,
      controllable: form.controllable,
      telemetryFreshnessSeconds: 0,
    }

    const result = await mutate(payload)
    if (result) {
      setSubmitted(true)
      toastSuccess(`Asset ${result.assetCode} erfolgreich registriert`)
    } else {
      toastError('Registrierung fehlgeschlagen — Backend nicht erreichbar')
    }
  }

  const handleReset = () => {
    setForm(INITIAL_FORM)
    setErrors({})
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-sm">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-900/40 border border-green-700/60 flex items-center justify-center">
              <CheckCircle size={32} className="text-green-400" />
            </div>
          </div>
          <h2 className="text-base font-bold text-slate-100 mb-2">Asset registriert</h2>
          <p className="text-xs text-slate-400 mb-6">
            Das Asset wurde erfolgreich in der Plattform registriert und steht zur weiteren Konfiguration bereit.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={handleReset}>Weiteres Asset registrieren</Button>
            <Button variant="primary" onClick={() => navigate('/assets')}>Asset-Portfolio öffnen</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-gray-800 bg-gradient-to-br from-gray-600 to-gray-900 flex-shrink-0">
        <h1 className="text-sm font-bold text-white">Asset registrieren</h1>
        <p className="text-2xs text-slate-500 mt-0.5">Neues Flexibilitätsobjekt in der FSP-Plattform erfassen</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 space-y-4">
        {/* Identification */}
        <Section title="Identifikation" icon={<FileText size={14} />}>
          <Field label="Asset-Code" required error={errors.assetCode}>
            <Input
              value={form.assetCode}
              onChange={e => set('assetCode', e.target.value.toUpperCase())}
              placeholder="z.B. CIB-099"
              className="font-mono"
            />
          </Field>
          <Field label="Bezeichnung" required error={errors.name}>
            <Input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="z.B. BESS Gewerbepark Berlin-Süd"
            />
          </Field>
          <Field label="Eigentümer / Betreiber">
            <Input
              value={form.ownerName}
              onChange={e => set('ownerName', e.target.value)}
              placeholder="Firma oder Privatperson"
            />
          </Field>
          <Field label="Asset-Typ" required error={errors.assetType}>
            <Select
              value={form.assetType}
              onChange={e => set('assetType', e.target.value)}
              options={[{ value: '', label: '— Typ wählen —' }, ...ASSET_TYPE_OPTIONS]}
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              options={STATUS_OPTIONS}
            />
          </Field>
          <Field label="Flags">
            <div className="flex flex-col gap-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.controllable}
                  onChange={e => set('controllable', e.target.checked)}
                  className="w-3 h-3 accent-blue-500"
                />
                <span className="text-2xs text-slate-300">Fernsteuerbar (Controllable)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.settlementRelevant}
                  onChange={e => set('settlementRelevant', e.target.checked)}
                  className="w-3 h-3 accent-blue-500"
                />
                <span className="text-2xs text-slate-300">Abrechnungsrelevant</span>
              </label>
            </div>
          </Field>
        </Section>

        {/* Technical parameters */}
        <Section title="Technische Parameter" icon={<Zap size={14} />}>
          <Field label="Nennleistung [kW]" required error={errors.nominalPowerKw}>
            <Input
              type="number"
              value={form.nominalPowerKw}
              onChange={e => set('nominalPowerKw', e.target.value)}
              placeholder="0"
              min="0"
              step="0.1"
            />
          </Field>
          <Field label="Verfügb. Flex Hoch [kW]">
            <Input
              type="number"
              value={form.availableFlexUpKw}
              onChange={e => set('availableFlexUpKw', e.target.value)}
              placeholder="0"
              min="0"
            />
          </Field>
          <Field label="Verfügb. Flex Runter [kW]">
            <Input
              type="number"
              value={form.availableFlexDownKw}
              onChange={e => set('availableFlexDownKw', e.target.value)}
              placeholder="0"
              min="0"
            />
          </Field>
          <Field label="Verfügb. Energie [kWh]">
            <Input
              type="number"
              value={form.availableEnergyKwh}
              onChange={e => set('availableEnergyKwh', e.target.value)}
              placeholder="0"
              min="0"
            />
          </Field>
        </Section>

        {/* Location */}
        <Section title="Standort" icon={<MapPin size={14} />}>
          <Field label="Stadt">
            <Input
              value={form.city}
              onChange={e => set('city', e.target.value)}
              placeholder="z.B. Leipzig"
            />
          </Field>
          <Field label="Postleitzahl">
            <Input
              value={form.postalCode}
              onChange={e => set('postalCode', e.target.value)}
              placeholder="z.B. 04109"
              className="font-mono"
            />
          </Field>
          <Field label="Bundesland">
            <Input
              value={form.federalState}
              onChange={e => set('federalState', e.target.value)}
              placeholder="z.B. Sachsen"
            />
          </Field>
          <Field label="Breitengrad" error={errors.latitude}>
            <Input
              type="number"
              value={form.latitude}
              onChange={e => set('latitude', e.target.value)}
              placeholder="51.3400"
              step="0.0001"
              className="font-mono"
            />
          </Field>
          <Field label="Längengrad" error={errors.longitude}>
            <Input
              type="number"
              value={form.longitude}
              onChange={e => set('longitude', e.target.value)}
              placeholder="12.3750"
              step="0.0001"
              className="font-mono"
            />
          </Field>
        </Section>

        {/* Grid / Network */}
        <Section title="Netzanbindung & Bilanzierung" icon={<Settings2 size={14} />}>
          <Field label="ÜNB-Region" required error={errors.uenbRegion}>
            <Select
              value={form.uenbRegion}
              onChange={e => set('uenbRegion', e.target.value)}
              options={[{ value: '', label: '— ÜNB wählen —' }, ...UENB_REGION_OPTIONS]}
            />
          </Field>
          <Field label="VNB-Betreiber" required error={errors.vnbOperator}>
            <Select
              value={form.vnbOperator}
              onChange={e => set('vnbOperator', e.target.value)}
              options={[{ value: '', label: '— VNB-Betreiber wählen —' }, ...VNB_OPERATOR_OPTIONS]}
            />
          </Field>
          <Field label="VNB-Planungsregion" required error={errors.vnbPlanningRegion}>
            <Select
              value={form.vnbPlanningRegion}
              onChange={e => set('vnbPlanningRegion', e.target.value)}
              options={[{ value: '', label: '— Planungsregion wählen —' }, ...VNB_PLANNING_REGION_OPTIONS]}
            />
          </Field>
          <Field label="Netzknoten">
            <Input
              value={form.gridNode}
              onChange={e => set('gridNode', e.target.value)}
              placeholder="z.B. LE-Nord-110kV"
              className="font-mono"
            />
          </Field>
          <Field label="Feeder">
            <Input
              value={form.feederName}
              onChange={e => set('feederName', e.target.value)}
              placeholder="z.B. Feeder-LNO-03"
              className="font-mono"
            />
          </Field>
          <Field label="Bilanzkreis">
            <Select
              value={form.balancingGroup}
              onChange={e => set('balancingGroup', e.target.value)}
              options={[{ value: '', label: '— Bilanzkreis wählen —' }, ...BALANCING_GROUP_OPTIONS]}
            />
          </Field>
        </Section>

        {/* Region info panel */}
        {(form.uenbRegion || form.vnbOperator || form.vnbPlanningRegion) && (
          <Card>
            <div className="p-3">
              <div className="text-2xs text-slate-500 font-medium mb-2 uppercase tracking-wide">Netzeinordnung (Vorschau)</div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xs text-slate-600 mb-0.5">ÜNB-Region</div>
                  <div className="text-xs font-mono text-blue-400">
                    {UENB_REGION_OPTIONS.find(o => o.value === form.uenbRegion)?.label ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-2xs text-slate-600 mb-0.5">VNB-Betreiber</div>
                  <div className="text-xs font-mono text-amber-400">
                    {VNB_OPERATOR_OPTIONS.find(o => o.value === form.vnbOperator)?.label ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-2xs text-slate-600 mb-0.5">VNB-Planungsregion</div>
                  <div className="text-xs font-mono text-purple-400">
                    {VNB_PLANNING_REGION_OPTIONS.find(o => o.value === form.vnbPlanningRegion)?.label ?? '—'}
                  </div>
                </div>
              </div>
              <p className="text-2xs text-slate-600 mt-2 italic">
                Diese drei Felder werden unabhängig voneinander gespeichert und dürfen nicht zusammengeführt werden.
              </p>
            </div>
          </Card>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-4">
          <Button type="button" variant="ghost" onClick={handleReset}>Formular zurücksetzen</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/assets')}>Abbrechen</Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Registrierung läuft…' : 'Asset registrieren'}
          </Button>
        </div>
      </form>
    </div>
  )
}
