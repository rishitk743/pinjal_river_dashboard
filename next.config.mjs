/** @type {import('next').NextConfig} */
const nextConfig = {
  // A lockfile sitting in a parent directory (outside this project) made Next.js
  // guess the wrong workspace root and warn on every build — pin it explicitly.
  outputFileTracingRoot: import.meta.dirname,
};
export default nextConfig;
