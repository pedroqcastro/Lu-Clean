import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Libera o acesso para o Codespaces e localhost
  allowedDevOrigins: [
    "127.0.0.1", 
    "localhost", 
    "*.app.github.dev"
  ],
};

export default nextConfig;