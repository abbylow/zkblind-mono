import type { AppProps } from "next/app"
import Head from "next/head"
import { useEffect } from "react"
import { Inter } from "next/font/google"
import { WagmiConfig } from 'wagmi'
import { Box, MantineProvider } from '@mantine/core';

import { Notifications } from "@mantine/notifications"
import { wagmiClient } from '@/config/wagmi'
import SemaphoreContext from "@/context/SemaphoreContext"
import useSemaphore from "@/hooks/useSemaphore"
import AppLayout from "@/components/AppLayout"
import { IdentityProvider } from "@/context/IdentityContext"

const inter = Inter({ subsets: ["latin"] })

export default function App({ Component, pageProps }: AppProps) {
  const semaphore = useSemaphore()

  useEffect(() => {
    semaphore.refreshUsers()
    semaphore.refreshFeedback()
  }, [])

  return (
    <>
      <Head>
        <title>ZkBlind</title>
        {/* TODO: change the icons */}
        <link rel="icon" href="/favicon.ico" />
        {/* <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" /> */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ebedff" />
      </Head>

      <WagmiConfig client={wagmiClient}>
        <MantineProvider
          withGlobalStyles
          withNormalizeCSS
          theme={{
            colorScheme: 'light',
          }}
        >
          <SemaphoreContext.Provider value={semaphore}>
            <IdentityProvider>
              <main className={inter.className}>
                <Notifications />
                <AppLayout>
                  <Box my="70px">
                    <Component {...pageProps} />
                  </Box>
                </AppLayout>
              </main>
            </IdentityProvider>
          </SemaphoreContext.Provider>
        </MantineProvider>
      </WagmiConfig>
    </>
  )
}
