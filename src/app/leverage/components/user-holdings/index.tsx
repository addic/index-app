import clsx from 'clsx'
import { useState } from 'react'

import { WidgetTab } from '@/app/leverage/types'

import { TransactionHistory } from './components/transaction-history'
import { YourTokens } from './components/your-tokens'

export function UserHoldings() {
  const [activeTab, setActiveTab] = useState(WidgetTab.YOUR_TOKENS)

  return (
    <div className='border-ic-gray-600 w-full rounded-3xl border bg-[#1C2C2E]'>
      <div className='flex'>
        <button
          className={clsx('text-ic-gray-400 p-6 font-bold', {
            'text-ic-white': activeTab === WidgetTab.YOUR_TOKENS,
          })}
          onClick={() => setActiveTab(WidgetTab.YOUR_TOKENS)}
        >
          Your Tokens
        </button>
        <button
          className={clsx('text-ic-gray-400 p-6 font-bold', {
            'text-ic-white': activeTab === WidgetTab.HISTORY,
          })}
          onClick={() => setActiveTab(WidgetTab.HISTORY)}
        >
          History
        </button>
      </div>
      {activeTab === WidgetTab.YOUR_TOKENS && <YourTokens />}
      {activeTab === WidgetTab.HISTORY && <TransactionHistory />}
    </div>
  )
}
