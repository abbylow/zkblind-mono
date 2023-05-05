export type IWallet = 'MetaMask' | 'Coinbase' | 'WalletConnect';

export const CONNECTOR_ID_TO_IMAGE_MAP: { [key: string]: string } = {
	metaMask: 'metamask.svg',
	coinbaseWallet: 'coinbase-wallet.svg',
	walletConnect: 'wallet-connect.svg',
};