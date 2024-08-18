import { useEffect, useState } from 'react'

import { useTokenTransfers } from '@/app/leverage/use-token-transfers'
import { formatDate, formatPrice } from '@/app/products/utils/formatters'
import { ARBITRUM } from '@/constants/chains'
import { IndexCoopEthereum2xIndex } from '@/constants/tokens'
import { getTokenPrice } from '@/lib/hooks/use-token-price'
import { useWallet } from '@/lib/hooks/use-wallet'
import { formatAmountFromWei, shortenAddress } from '@/lib/utils'
import { getBlockExplorerUrl } from '@/lib/utils/block-explorer'

export function TransactionHistory() {
  const { address } = useWallet()

  const [price, setPrice] = useState<number>()
  const transfers = useTokenTransfers(IndexCoopEthereum2xIndex, address)

  useEffect(() => {
    const fetchPrice = async () => {
      const priceUsd = await getTokenPrice(
        IndexCoopEthereum2xIndex,
        ARBITRUM.chainId,
      )
      setPrice(priceUsd)
    }
    fetchPrice()
  }, [address])

  function valueToUsd(value: bigint, decimals: number) {
    if (!price) return

    return formatPrice(
      parseFloat(formatAmountFromWei(value, decimals, 3)) * price,
    )
  }

  return (
    <>
      <div className='border-ic-gray-600 flex w-full border-b px-6 pb-3'>
        <div className='text-ic-gray-400 w-3/12 md:w-2/12'>Date</div>
        <div className='text-ic-gray-400 w-3/12 md:w-2/12'>Action</div>
        <div className='text-ic-gray-400 w-3/12 md:w-2/12'>Size</div>
        <div className='text-ic-gray-400 w-3/12 md:w-2/12'>Position</div>
        <div className='text-ic-gray-400 hidden md:flex md:w-4/12'>Tx</div>
      </div>
      <div className='divide-ic-gray-900/20 divide-y-4 py-2'>
        {transfers.length === 0 ? (
          <div className='text-ic-white px-2 py-4 text-center'>
            You have not completed any transactions yet
          </div>
        ) : (
          transfers.map((transfer) => (
            <div
              key={transfer.hash}
              className='text-ic-white flex h-14 w-full px-6'
            >
              <div className='flex w-3/12 items-center md:w-2/12'>
                {formatDate(transfer.timeStamp * 1000)}
              </div>
              <div className='flex w-3/12 items-center md:w-2/12'>
                {transfer.to === address?.toLowerCase() ? 'Open' : 'Close'}
              </div>
              <div className='flex w-3/12 items-center md:w-2/12'>
                {valueToUsd(transfer.value, IndexCoopEthereum2xIndex.decimals)}
              </div>
              <div className='flex w-3/12 items-center md:w-2/12'>ETH2X</div>
              <div className='hidden items-center md:flex md:w-4/12'>
                <a
                  href={getBlockExplorerUrl(transfer.hash, ARBITRUM.chainId)}
                  target='_blank'
                  rel='noopener nofollow'
                >
                  {shortenAddress(transfer.hash)}
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
