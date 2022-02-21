import { createContext, useContext, useEffect, useState } from 'react'

import { utils } from 'ethers'

import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { useContractCall, useContractFunction, useEthers } from '@usedapp/core'

import {
  dpi2020StakingRewardsAddress,
  dpi2021StakingRewardsAddress,
  gmiStakingRewardsAddress,
  mviStakingRewardsAddress,
} from 'constants/ethContractAddresses'
import { GmiIndex } from 'constants/tokens'
import { useApproval } from 'hooks/useApproval'
import { useMarketData } from 'providers/MarketData/MarketDataProvider'
import { toWei } from 'utils'
import StakeRewardsABI from 'utils/abi/StakingRewards.json'

type LiquidityMiningValues = {
  apy?: string
  isApproved?: boolean
  isApproving?: boolean
  isPoolActive?: boolean
  onApprove: () => void
  onStake: (amount: string) => void
  onHarvest: () => void
  onUnstakeAndHarvest: () => void
}
export type LiquidityMiningProps = {
  uniswapEthDpi2020?: LiquidityMiningValues
  uniswapEthDpi2021?: LiquidityMiningValues
  uniswapEthMvi2021?: LiquidityMiningValues
  gmi2022?: LiquidityMiningValues
}

const stakingInterface = new utils.Interface(StakeRewardsABI)

const LiquidityMiningContext = createContext<LiquidityMiningProps>({})

/**
 * getRewardForDuration for StakingRewardsV2 contracts
 */
const useGetRewardForDuration = (
  stakingAddress?: string
): BigNumber | undefined => {
  const [rewardsForDuration] =
    useContractCall(
      stakingAddress && {
        abi: stakingInterface,
        address: stakingAddress,
        method: 'getRewardForDuration',
        args: [],
      }
    ) ?? []
  return rewardsForDuration
}

/**
 * totalSupply for StakingRewardsV2 contracts
 */
const useTotalSupply = (stakingAddress?: string): BigNumber | undefined => {
  const [totalSupply] =
    useContractCall(
      stakingAddress && {
        abi: stakingInterface,
        address: stakingAddress,
        method: 'totalSupply',
        args: [],
      }
    ) ?? []
  return totalSupply
}

/**
 * Calculate APY for StakingRewardsV2 contracts
 * @returns percent to one decimals places (ex. 94.5)
 */
export const calculateApyStakingRewardV2 = ({
  rewardsForDuration,
  rewardsPrice,
  stakedTotalSupply,
  stakedPrice,
}: {
  rewardsForDuration?: BigNumber
  rewardsPrice?: number
  stakedTotalSupply?: BigNumber
  stakedPrice?: number
}): string => {
  if (
    !rewardsForDuration ||
    !rewardsPrice ||
    !stakedTotalSupply ||
    !stakedPrice
  ) {
    return '0.0'
  }

  const dollarToCents = (dollar: number) => Math.floor(dollar * 100)

  const rewards = rewardsForDuration.mul(
    BigNumber.from(dollarToCents(rewardsPrice))
  )
  const staked = stakedTotalSupply.mul(
    BigNumber.from(dollarToCents(stakedPrice))
  )

  const apy = rewards.mul(BigNumber.from(12000)).div(staked)
  return (apy.toNumber() / 10).toString()
}

export const useLiquidityMining = () => useContext(LiquidityMiningContext)

const LiquidityMiningProvider = (props: { children: any }) => {
  const { account, library } = useEthers()
  const { index, gmi, selectLatestMarketData } = useMarketData()

  const [uniswapEthDpi2020, setUniswapEthDpi2020] =
    useState<LiquidityMiningValues>({
      onApprove: () => {},
      onStake: () => {},
      onHarvest: () => {},
      onUnstakeAndHarvest: () => {},
    })
  const [uniswapEthDpi2021, setUniswapEthDpi2021] =
    useState<LiquidityMiningValues>({
      onApprove: () => {},
      onStake: () => {},
      onHarvest: () => {},
      onUnstakeAndHarvest: () => {},
    })
  const [uniswapEthMvi2021, setUniswapEthMvi2021] =
    useState<LiquidityMiningValues>({
      onApprove: () => {},
      onStake: () => {},
      onHarvest: () => {},
      onUnstakeAndHarvest: () => {},
    })
  const [gmi2022, setGmi2022] = useState<LiquidityMiningValues>({
    onApprove: () => {},
    onStake: () => {},
    onHarvest: () => {},
    onUnstakeAndHarvest: () => {},
  })

  if (
    !GmiIndex.address ||
    !stakingInterface ||
    !dpi2020StakingRewardsAddress ||
    !dpi2021StakingRewardsAddress ||
    !gmiStakingRewardsAddress ||
    !mviStakingRewardsAddress
  ) {
    throw new Error(
      'A token address is not defined. Please check your .env to confirm all token addresses are defined.'
    )
  }

  /**
   * DPI 2020
   */
  const dpi2020Contract = new Contract(
    dpi2020StakingRewardsAddress,
    stakingInterface
  )
  const { send: exitDpi2020 } = useContractFunction(dpi2020Contract, 'exit')

  /**
   * DPI 2021
   */
  const dpi2021Contract = new Contract(
    dpi2021StakingRewardsAddress,
    stakingInterface
  )
  const { send: exitDpi2021 } = useContractFunction(dpi2021Contract, 'exit')

  /**
   * MVI 2021
   */
  const mvi2021Contract = new Contract(
    mviStakingRewardsAddress,
    stakingInterface
  )
  const { send: exitMvi2021 } = useContractFunction(mvi2021Contract, 'exit')

  /**
   * GMI 2022
   */
  // March 06, 2022 05:00:00 UTC (timestamp copied from index-ui)
  const gmi2022minigEndTime = 1646542800 * 1000
  const isPoolActiveGmi = gmi2022minigEndTime > Date.now()

  const {
    isApproved: isApprovedGmi,
    isApproving: isApprovingGmi,
    onApprove: onApproveGmi,
  } = useApproval(GmiIndex.address, gmiStakingRewardsAddress)

  useEffect(() => {
    setGmi2022((prev) => ({
      ...prev,
      isApproved: isApprovedGmi,
      isApproving: isApprovingGmi,
    }))
  }, [isApprovedGmi, isApprovingGmi])

  const gmiContract = new Contract(gmiStakingRewardsAddress, stakingInterface)

  const { send: stakeGmi } = useContractFunction(gmiContract, 'stake')
  const { send: claimGmi } = useContractFunction(gmiContract, 'getReward')
  const { send: exitGmi } = useContractFunction(gmiContract, 'exit')

  const apyGmi = calculateApyStakingRewardV2({
    rewardsForDuration: useGetRewardForDuration(gmiStakingRewardsAddress),
    rewardsPrice: selectLatestMarketData(index?.hourlyPrices),
    stakedTotalSupply: useTotalSupply(gmiStakingRewardsAddress),
    stakedPrice: selectLatestMarketData(gmi?.hourlyPrices),
  })

  useEffect(() => {
    setGmi2022((prev) => ({
      ...prev,
      apy: apyGmi,
    }))
  }, [apyGmi])

  useEffect(() => {
    if (
      account &&
      library &&
      dpi2020StakingRewardsAddress &&
      dpi2021StakingRewardsAddress &&
      gmiStakingRewardsAddress &&
      mviStakingRewardsAddress
    ) {
      setUniswapEthDpi2020({
        onApprove: () => {},
        onStake: () => {},
        onHarvest: () => {},
        onUnstakeAndHarvest: exitDpi2020,
      })
      setUniswapEthDpi2021({
        onApprove: () => {},
        onStake: () => {},
        onHarvest: () => {},
        onUnstakeAndHarvest: exitDpi2021,
      })
      setUniswapEthMvi2021({
        onApprove: () => {},
        onStake: () => {},
        onHarvest: () => {},
        onUnstakeAndHarvest: exitMvi2021,
      })
      setGmi2022({
        apy: apyGmi,
        isApproved: isApprovedGmi,
        isApproving: isApprovingGmi,
        isPoolActive: isPoolActiveGmi,
        onApprove: onApproveGmi,
        onStake: async (token: string) => {
          await stakeGmi(toWei(token))
        },
        onHarvest: claimGmi,
        onUnstakeAndHarvest: exitGmi,
      })
    }
  }, [account, library])

  return (
    <LiquidityMiningContext.Provider
      value={{
        uniswapEthDpi2020,
        uniswapEthDpi2021,
        uniswapEthMvi2021,
        gmi2022,
      }}
    >
      {props.children}
    </LiquidityMiningContext.Provider>
  )
}

export default LiquidityMiningProvider
