/** @type {import('next').NextConfig} */

const fs = require("fs")
const withPWA = require("next-pwa")

if (!fs.existsSync("./.env")) {
    // eslint-disable-next-line global-require
    require("dotenv").config({ path: "../../.env" })
}

const nextConfig = withPWA({
    dest: "public",
    disable: process.env.NODE_ENV === "development"
})({
    eslint: {
        ignoreDuringBuilds: true
    },
    reactStrictMode: true,
    swcMinify: true,
    env: {
        DEFAULT_NETWORK: process.env.DEFAULT_NETWORK,
        INFURA_API_KEY: process.env.INFURA_API_KEY,
        ETHEREUM_PRIVATE_KEY: process.env.ETHEREUM_PRIVATE_KEY,
        POST_CONTRACT_ADDRESS: process.env.POST_CONTRACT_ADDRESS,
        SEMAPHORE_CONTRACT_ADDRESS: process.env.SEMAPHORE_CONTRACT_ADDRESS
    },
    publicRuntimeConfig: {
        DEFAULT_NETWORK: process.env.DEFAULT_NETWORK,
        POST_CONTRACT_ADDRESS: process.env.POST_CONTRACT_ADDRESS,
        SEMAPHORE_CONTRACT_ADDRESS: process.env.SEMAPHORE_CONTRACT_ADDRESS,
        OPENZEPPELIN_AUTOTASK_WEBHOOK: process.env.OPENZEPPELIN_AUTOTASK_WEBHOOK,
        GROUP_ID: process.env.GROUP_ID
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                fs: false
            }
        }

        return config
    },
    headers: async () => [
      {
        source: '/:all*(zkey|wasm)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000'
          }
        ]
      }
    ]
  })
  
module.exports = nextConfig
  