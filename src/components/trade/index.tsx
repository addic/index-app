import { useState } from 'react'

import { colors, useICColorMode } from 'styles/colors'

import { Button, Flex, Text } from '@chakra-ui/react'

import { useSlippage } from 'hooks/useSlippage'

import QuickTrade, { QuickTradeProps } from './QuickTrade'
import { QuickTradeSettingsPopover } from './QuickTradeSettingsPopover'

enum TradeType {
  flashMint,
  swap,
}

const QuickTradeContainer = (props: QuickTradeProps) => {
  const { isDarkMode } = useICColorMode()

  const paddingX = props.isNarrowVersion ? '16px' : '40px'

  return (
    <Flex
      border='2px solid #F7F1E4'
      borderColor={isDarkMode ? colors.icWhite : colors.black}
      borderRadius='16px'
      direction='column'
      py='20px'
      px={['16px', paddingX]}
      height={'100%'}
    >
      <Navigation />
      <QuickTrade {...props} />
    </Flex>
  )
}

const useTradeType = () => {
  const [selectedType, setSelectedType] = useState(TradeType.swap)

  const onSelectType = (type: TradeType) => {
    if (type !== selectedType) setSelectedType(type)
  }

  return { selectedType, onSelectType }
}

type NavigationButtonProps = {
  isSelected: boolean
  onClick: () => void
  title: string
}

const NavigationButton = (props: NavigationButtonProps) => {
  const { isDarkMode } = useICColorMode()
  return (
    <Text
      borderBottom={props.isSelected ? '2px solid' : '0'}
      borderColor={isDarkMode ? colors.white : colors.black}
      color={props.isSelected ? 'inherit' : colors.icGray3}
      cursor='pointer'
      fontSize='20px'
      fontWeight='700'
      mr='16px'
      onClick={props.onClick}
    >
      {props.title}
    </Text>
  )
}

const Navigation = () => {
  const { isDarkMode } = useICColorMode()
  const {
    auto: autoSlippage,
    isAuto: isAutoSlippage,
    set: setSlippage,
    slippage,
  } = useSlippage()
  const { selectedType, onSelectType } = useTradeType()

  const flashMintIsSelected = selectedType === TradeType.flashMint
  const swapIsSelected = selectedType === TradeType.swap

  return (
    <Flex align='center' justify='space-between'>
      <Flex>
        <NavigationButton
          isSelected={swapIsSelected}
          onClick={() => onSelectType(TradeType.swap)}
          title='Swap'
        />
        <NavigationButton
          isSelected={flashMintIsSelected}
          onClick={() => onSelectType(TradeType.flashMint)}
          title='Flash Mint'
        />
      </Flex>
      <QuickTradeSettingsPopover
        isAuto={isAutoSlippage}
        isDarkMode={isDarkMode}
        onChangeSlippage={setSlippage}
        onClickAuto={autoSlippage}
        slippage={slippage}
      />
    </Flex>
  )
}

export default QuickTradeContainer
