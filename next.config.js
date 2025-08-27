/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  },
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin', 'firebase'],
  },
  webpack: (config, { isServer, webpack }) => {
    // undici 패키지를 완전히 무시
    config.externals = config.externals || {}
    if (isServer) {
      config.externals.undici = 'commonjs undici'
    }
    
    // undici 모듈 교체
    config.resolve.alias = {
      ...config.resolve.alias,
      'undici': false,
    }
    
    // Firebase 관련 Node.js 모듈 fallback 설정
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      dns: false,
      tls: false,
      assert: false,
      path: false,
      url: false,
      util: false,
      stream: false,
      querystring: false,
      crypto: false,
      http: false,
      https: false,
      os: false,
      child_process: false,
      'node:crypto': false,
      'node:fs': false,
      'node:http': false,
      'node:https': false,
      'node:net': false,
      'node:path': false,
      'node:stream': false,
      'node:url': false,
      'node:util': false,
    }

    // Firebase auth 관련 모듈들을 external로 처리
    if (isServer) {
      config.externals.push(
        'firebase/auth',
        'firebase/firestore',
        '@firebase/auth',
        '@firebase/firestore'
      )
    }

    return config
  },
}

module.exports = nextConfig