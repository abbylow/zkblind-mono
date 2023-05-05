import { createClient, configureChains } from "wagmi"
import { polygonMumbai } from "wagmi/chains"
import { publicProvider } from "wagmi/providers/public"
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { MetaMaskConnector } from "wagmi/connectors/metaMask"
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet"
import getNextConfig from "next/config"
// import { WalletConnectConnector } from "wagmi/connectors/walletConnect"

const { publicRuntimeConfig: env } = getNextConfig()

export const { chains, provider } = configureChains(
  [polygonMumbai],
  [
    alchemyProvider({ apiKey: env.INFURA_API_KEY }),
    // infuraProvider({ apiKey: 'yourInfuraApiKey' }),
    publicProvider()
  ] // TODO: rate-limit issue in production, pass an alchemyProvider https://wagmi.sh/react/providers/configuring-chains
)

export const wagmiClient = createClient({
  autoConnect: true,
  provider,
  // webSocketProvider,
  connectors: [
    new MetaMaskConnector({ chains }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: "ZkBlind"
      }
    }),
    // new WalletConnectConnector({
    //   chains,
    //   options: {
    //     projectId: "ZkBlind"
    //   }
    // })
  ]
});