import { useState, useEffect, useCallback, useRef } from 'react'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []): ApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: true, error: null })
  const mountedRef = useRef(true)

  const fetch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = await fetcher()
      if (mountedRef.current) setState({ data, loading: false, error: null })
    } catch (err) {
      if (mountedRef.current) setState({ data: null, loading: false, error: (err as Error).message })
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true
    fetch()
    return () => { mountedRef.current = false }
  }, [fetch])

  return { ...state, refetch: fetch }
}

export function useApiMutation<TInput, TResult>(
  mutator: (input: TInput) => Promise<TResult>,
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = async (input: TInput): Promise<TResult | null> => {
    setLoading(true)
    setError(null)
    try {
      const result = await mutator(input)
      return result
    } catch (err) {
      setError((err as Error).message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { mutate, loading, error }
}
