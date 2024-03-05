import { CircularProgress, Flex, Text } from '@chakra-ui/react'

import { colors, useColorStyles } from '@/lib/styles/colors'

interface RethSupplyCapProps {
  formatted: {
    available: string
  }
  totalSupplyPercent: number
}

function useColorForProgress(progress: number): string {
  if (progress === 100) {
    return colors.ic.blue[950]
  }
  if (progress > 100) {
    return colors.ic.red
  }
  return colors.ic.blue[900]
}

export const RethSupplyCap = (props: RethSupplyCapProps) => {
  const { styles } = useColorStyles()
  const { formatted, totalSupplyPercent } = props
  const progressColor = useColorForProgress(totalSupplyPercent)
  return (
    <Flex
      align='center'
      border='1px solid'
      borderColor={styles.border}
      borderRadius={'16px'}
      direction='row'
      p={'8px'}
      w='100%'
    >
      <Flex alignItems='center' justifyContent='center' position={'relative'}>
        <CircularProgress
          position={'relative'}
          zIndex={0}
          size='72px'
          color={progressColor}
          thickness='8px'
          value={totalSupplyPercent}
        />
        <Text
          color={colors.ic.gray[600]}
          fontSize='12px'
          fontWeight='700'
          position={'absolute'}
          zIndex={1}
        >
          {`${totalSupplyPercent.toFixed(2)}%`}
        </Text>
      </Flex>
      <Flex align='flex-start' direction={'column'} ml={'16px'}>
        <Text color={colors.ic.gray[600]} fontSize='14px' fontWeight='400'>
          Available to mint
        </Text>
        <Text color={colors.ic.black} fontSize='16px' fontWeight='700'>
          {`${formatted.available} icRETH`}
        </Text>
      </Flex>
    </Flex>
  )
}
