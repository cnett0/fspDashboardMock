export interface FlexbandResource {
  selector: string
  selectorType: string
}

export interface FlexbandPoint {
  ts: string
  powerMinKw: number
  powerMaxKw: number
}

export interface FlexbandResponse {
  data: FlexbandPoint[]
  meta: { count: number; resource: string }
}

export interface ResourcesResponse {
  data: FlexbandResource[]
  meta: { count: number }
}

export function getFlexbandResources(): Promise<ResourcesResponse> {
  return Promise.resolve({ data: [], meta: { count: 0 } })
}

export function getFlexband(_params: {
  resource: string
  from?: string
  to?: string
  limit?: number
}): Promise<FlexbandResponse> {
  return Promise.resolve({ data: [], meta: { count: 0, resource: _params.resource } })
}
