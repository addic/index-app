import { useCallback, useEffect, useState } from 'react'

import { Token } from '@/constants/tokens'
import { fetchTokenTransfers, Transfer } from '@/lib/utils/api/arbiscan'

export function useTokenTransfers(token: Token, address?: string) {
  const [transfers, setTransfers] = useState<Transfer[]>([])

  const fetchTransfers = useCallback(async () => {
    const transfers = await fetchTokenTransfers(token, address)
    setTransfers(transfers)
  }, [token, address])

  useEffect(() => {
    fetchTransfers()
  }, [fetchTransfers])

  return transfers
}
