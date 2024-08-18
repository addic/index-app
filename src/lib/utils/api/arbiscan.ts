import { Address } from 'viem'

import { ArbiscanApiBaseUrl, ArbiscanApiKey } from '@/constants/server'
import { Token } from '@/constants/tokens'

export type Transfer = {
  blockNumber: number
  timeStamp: number
  hash: string
  nonce: number
  blockHash: string
  from: Address
  contractAddress: Address
  to: Address
  value: bigint
  tokenName: string
  tokenSymbol: string
  tokenDecimal: number
  transactionIndex: number
  gas: bigint
  gasPrice: bigint
  gasUsed: bigint
  cumulativeGasUsed: bigint
  input: string
  confirmations: number
}

export const fetchTokenTransfers = async (
  token: Token,
  address?: string,
): Promise<Transfer[]> => {
  if (!token.arbitrumAddress || !address) return []

  const params = new URLSearchParams({
    module: 'account',
    action: 'tokentx',
    contractaddress: String(token.arbitrumAddress),
    address,
    page: '1',
    offset: '100',
    startblock: '0',
    endblock: '99999999',
    sort: 'asc',
    apikey: String(ArbiscanApiKey),
  })

  try {
    const res = await fetch(`${ArbiscanApiBaseUrl}?${params}`)
    const data = await res.json()

    return data.result as Transfer[]
  } catch (err) {
    console.error(err)
    return []
  }
}
