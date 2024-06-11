import clsx from 'clsx'

type BuySellSelectorProps = {
  isDepositing: boolean
  onClick: () => void
}

export function DepositWithdrawSelector({
  isDepositing,
  onClick,
}: BuySellSelectorProps) {
  return (
    <div className='bg-ic-blue-950 flex flex-row rounded-md'>
      <SelectorButton
        isSelected={isDepositing === true}
        label='Deposit'
        roundedLeft={true}
        onClick={onClick}
      />
      <SelectorButton
        isSelected={isDepositing === false}
        label='Withdraw'
        roundedLeft={false}
        onClick={onClick}
      />
    </div>
  )
}

export function SelectorButton({
  isSelected,
  label,
  roundedLeft,
  onClick,
}: {
  isSelected: boolean
  label: string
  roundedLeft: boolean
  onClick: () => void
}) {
  const textColor = isSelected ? 'text-ic-white' : 'text-ic-gray-500'
  const bgColor = isSelected ? 'bg-ic-blue-600' : 'bg-ic-gray-800'
  return (
    <button
      className={
        'bg-ic-blue-950 flex-grow cursor-pointer select-none rounded-md'
      }
      onClick={onClick}
    >
      <div className={clsx('py-5 text-center text-sm font-bold', textColor)}>
        {label}
      </div>
      <div
        className={clsx(
          'h-1 w-full',
          bgColor,
          roundedLeft ? 'rounded-bl-md' : 'rounded-br-md',
        )}
      />
    </button>
  )
}
