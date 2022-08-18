import { useEffect, useState } from 'react'

import debounce from 'lodash/debounce'
import { colors, useICColorMode } from 'styles/colors'
import { useNetwork } from 'wagmi'

import { Box, Flex, useDisclosure } from '@chakra-ui/react'
import { BigNumber } from '@ethersproject/bignumber'
import {
  getExchangeIssuanceLeveragedContractAddress,
  getExchangeIssuanceZeroExContractAddress,
} from '@indexcoop/flash-mint-sdk'

import FlashbotsRpcMessage from 'components/header/FlashbotsRpcMessage'
import { MAINNET, OPTIMISM, POLYGON } from 'constants/chains'
import {
  FlashMintPerp,
  zeroExRouterOptimismAddress,
} from 'constants/ethContractAddresses'
import {
  indexNamesMainnet,
  indexNamesOptimism,
  indexNamesPolygon,
  MNYeIndex,
  Token,
  USDC,
} from 'constants/tokens'
import { useIssuance } from 'hooks/issuance/useIssuance'
import { useIssuanceQuote } from 'hooks/issuance/useIssuanceQuote'
import { useApproval } from 'hooks/useApproval'
import { useBalances } from 'hooks/useBalance'
import { useIsSupportedNetwork } from 'hooks/useIsSupportedNetwork'
import { useTradeTokenLists } from 'hooks/useTradeTokenLists'
import { useWallet } from 'hooks/useWallet'
import { useProtection } from 'providers/Protection'
import { isValidTokenInput, toWei } from 'utils'
import { getBlockExplorerContractUrl } from 'utils/blockExplorer'

import { ContractExecutionView } from './ContractExecutionView'
import DirectIssuance from './DirectIssuance'
import { ProtectionWarning } from './ProtectionWarning'
import { QuickTradeProps } from './QuickTrade'
import {
  formattedBalance,
  getHasInsufficientFunds,
} from './QuickTradeFormatter'
import { getSelectTokenListItems, SelectTokenModal } from './SelectTokenModal'
import { TradeButton } from './TradeButton'

export enum QuickTradeBestOption {
  zeroEx,
  exchangeIssuance,
  leveragedExchangeIssuance,
}

const FlashMint = (props: QuickTradeProps) => {
  const { address } = useWallet()
  const { chain } = useNetwork()
  const chainId = chain?.id
  const { isDarkMode } = useICColorMode()
  const {
    isOpen: isSelectInputTokenOpen,
    onOpen: onOpenSelectInputToken,
    onClose: onCloseSelectInputToken,
  } = useDisclosure()
  const {
    isOpen: isIndexTokenModalOpen,
    onOpen: onOpenIndexTokenModal,
    onClose: onCloseIndexTokenModal,
  } = useDisclosure()

  const protection = useProtection()

  const supportedNetwork = useIsSupportedNetwork(chainId ?? -1)

  const {
    buyToken,
    buyTokenList: indexTokenList,
    sellToken,
    sellTokenList,
    changeBuyToken: changeIndexToken,
    changeSellToken,
  } = useTradeTokenLists(chainId, props.singleToken)
  const { getBalance } = useBalances()

  const [bestOption, setBestOption] = useState<QuickTradeBestOption | null>(
    null
  )
  const [buyTokenAmountFormatted, setBuyTokenAmountFormatted] = useState('0.0')
  const [buyTokenAmount, setBuyTokenAmount] = useState('0')
  const [isIssue, setIssue] = useState(true)

  const spenderAddress0x = getExchangeIssuanceZeroExContractAddress(chain?.id)
  const spenderAddressLevEIL = getExchangeIssuanceLeveragedContractAddress(
    chain?.id
  )

  const buyTokenAmountInWei = toWei(buyTokenAmount, buyToken.decimals)

  const { estimatedUSDC, getQuote } = useIssuanceQuote(
    isIssue,
    buyToken,
    buyTokenAmountInWei
  )

  const {
    isApproved: isAppovedForUSDC,
    isApproving: isApprovingForUSDC,
    onApprove: onApproveForUSDC,
  } = useApproval(USDC, FlashMintPerp, estimatedUSDC)

  const {
    isApproved: isApprovedForMnye,
    isApproving: isApprovingForMnye,
    onApprove: onApproveForMnye,
  } = useApproval(buyToken, FlashMintPerp, buyTokenAmountInWei)

  const { handleTrade, isTrading } = useIssuance(
    isIssue,
    buyToken,
    buyTokenAmountInWei,
    estimatedUSDC
  )

  const hasInsufficientUSDC = getHasInsufficientFunds(
    false,
    BigNumber.from(estimatedUSDC),
    getBalance(USDC.symbol)
  )

  const hasInsufficientMNYe = getHasInsufficientFunds(
    false,
    buyTokenAmountInWei,
    getBalance(MNYeIndex.symbol)
  )

  const getContractForBestOption = (
    bestOption: QuickTradeBestOption | null
  ): string => {
    switch (bestOption) {
      case QuickTradeBestOption.exchangeIssuance:
        return spenderAddress0x
      case QuickTradeBestOption.leveragedExchangeIssuance:
        return spenderAddressLevEIL
      default:
        return zeroExRouterOptimismAddress
    }
  }
  const contractBestOption = getContractForBestOption(bestOption)
  const contractBlockExplorerUrl = getBlockExplorerContractUrl(
    contractBestOption,
    chain?.id
  )

  const resetTradeData = () => {
    setBestOption(null)
    setBuyTokenAmountFormatted('0.0')
  }

  /**
   * Issuance Contract
   */
  const getEstimatedBalance = () => {
    getQuote()
  }

  useEffect(() => {
    getEstimatedBalance()
  }, [buyTokenAmount, isIssue])

  // Does user need protecting from productive assets?
  const [requiresProtection, setRequiresProtection] = useState(false)
  useEffect(() => {
    if (
      protection.isProtectable &&
      (sellToken.isDangerous || buyToken.isDangerous)
    ) {
      setRequiresProtection(true)
    } else {
      setRequiresProtection(false)
    }
  }, [protection, sellToken, buyToken])

  const getIsApproved = () => {
    if (isIssue) return isAppovedForUSDC
    return isApprovedForMnye
  }

  const getIsApproving = () => {
    if (isIssue) return isApprovingForUSDC
    return isApprovingForMnye
  }

  const getOnApprove = () => {
    if (isIssue) return onApproveForUSDC()
    return onApproveForMnye()
  }

  const isNotTradable = (token: Token | undefined) => {
    if (token && chain?.id === MAINNET.chainId)
      return (
        indexNamesMainnet.filter((t) => t.symbol === token.symbol).length === 0
      )
    if (token && chain?.id === POLYGON.chainId)
      return (
        indexNamesPolygon.filter((t) => t.symbol === token.symbol).length === 0
      )
    // if (token && chain?.id === OPTIMISM.chainId)
    //   return (
    //     indexNamesOptimism.filter((t) => t.symbol === token.symbol).length === 0
    //   )
    return false
  }

  /**
   * Get the correct trade button label according to different states
   * @returns string label for trade button
   */
  const getTradeButtonLabel = () => {
    if (!address) return 'Connect Wallet'
    if (!supportedNetwork) return 'Wrong Network'

    if (isNotTradable(props.singleToken)) {
      let chainName = 'This Network'
      switch (chain?.id) {
        case MAINNET.chainId:
          chainName = 'Mainnet'
          break
        case POLYGON.chainId:
          chainName = 'Polygon'
          break
        case OPTIMISM.chainId:
          chainName = 'Optimism'
          break
      }

      return `Not Available on ${chainName}`
    }

    if (buyTokenAmount === '0') {
      return 'Enter an amount'
    }

    if (isIssue && hasInsufficientUSDC) {
      return 'Insufficient funds'
    }

    if (!isIssue && hasInsufficientMNYe) {
      return 'Insufficient funds'
    }

    if (getIsApproving()) {
      return 'Approving...'
    }

    if (!getIsApproved()) {
      return 'Approve Tokens'
    }
    if (isTrading) {
      return 'Trading...'
    }

    return 'Trade'
  }

  const onChangeBuyTokenAmount = debounce((token: Token, input: string) => {
    if (input === '') {
      resetTradeData()
      return
    }
    if (!isValidTokenInput(input, token.decimals)) return
    setBuyTokenAmount(input || '0')
  }, 1000)

  const onClickTradeButton = async () => {
    if (!address) {
      // Open connect wallet modal
      //openConnectModal()
      return
    }

    if (isIssue && hasInsufficientUSDC) return
    if (!isIssue && hasInsufficientMNYe) return

    if (!getIsApproved()) {
      await getOnApprove()
      return
    }
    await handleTrade()
  }

  const getButtonDisabledState = () => {
    if (!supportedNetwork) return true
    if (!address) return true
    return (
      buyTokenAmount === '0' ||
      (isIssue && hasInsufficientUSDC) ||
      (!isIssue && hasInsufficientMNYe) ||
      isTrading ||
      isNotTradable(props.singleToken)
    )
  }

  const buttonLabel = getTradeButtonLabel()
  const isButtonDisabled = getButtonDisabledState()
  const isLoading = getIsApproving()

  const isNarrow = props.isNarrowVersion ?? false

  const inputTokenBalances = sellTokenList.map(
    (sellToken) => getBalance(sellToken.symbol) ?? BigNumber.from(0)
  )
  const outputTokenBalances = indexTokenList.map(
    (indexToken) => getBalance(indexToken.symbol) ?? BigNumber.from(0)
  )
  const inputTokenItems = getSelectTokenListItems(
    sellTokenList,
    inputTokenBalances
  )
  const indexTokenItems = getSelectTokenListItems(
    indexTokenList,
    outputTokenBalances
  )

  return (
    <Box mt='32px'>
      <DirectIssuance
        buyToken={buyToken}
        buyTokenList={indexTokenList}
        buyTokenAmountFormatted={buyTokenAmountFormatted}
        formattedBalance={formattedBalance(USDC, estimatedUSDC)}
        formattedUSDCBalance={formattedBalance(USDC, getBalance(USDC.symbol))}
        isDarkMode={isDarkMode}
        isIssue={isIssue}
        isNarrow={isNarrow}
        onChangeBuyTokenAmount={onChangeBuyTokenAmount}
        onSelectedToken={() => {
          if (inputTokenItems.length > 1) onOpenIndexTokenModal()
        }}
        onToggleIssuance={(isIssuance) => setIssue(isIssuance)}
        priceImpact={undefined}
      />
      <Flex direction='column'>
        {requiresProtection && <ProtectionWarning isDarkMode={isDarkMode} />}
        <Flex my='8px'>{chain?.id === 1 && <FlashbotsRpcMessage />}</Flex>
        {!requiresProtection && (
          <TradeButton
            label={buttonLabel}
            background={isDarkMode ? colors.icWhite : colors.icBlue}
            isDisabled={isButtonDisabled}
            isLoading={isLoading}
            onClick={onClickTradeButton}
          />
        )}
        {bestOption !== null && (
          <ContractExecutionView
            blockExplorerUrl={contractBlockExplorerUrl}
            contractAddress={contractBestOption}
            name=''
          />
        )}
      </Flex>
      <SelectTokenModal
        isOpen={isSelectInputTokenOpen}
        onClose={onCloseSelectInputToken}
        onSelectedToken={(tokenSymbol) => {
          changeSellToken(tokenSymbol)
          onCloseSelectInputToken()
        }}
        items={inputTokenItems}
      />
      <SelectTokenModal
        isOpen={isIndexTokenModalOpen}
        onClose={onCloseIndexTokenModal}
        onSelectedToken={(tokenSymbol) => {
          changeIndexToken(tokenSymbol)
          onCloseIndexTokenModal()
        }}
        items={indexTokenItems}
      />
    </Box>
  )
}

export default FlashMint
