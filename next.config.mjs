/** @type {import('next').NextConfig} */
const nextConfig = {
    // Bỏ qua lỗi ESLint khi build trên Vercel
    eslint: {
        ignoreDuringBuilds: true,
    },
    // (Tùy chọn) Bỏ qua lỗi type check nếu gặp lỗi TypeScript tương tự
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'raw.githubusercontent.com',
                pathname: '**',
            },
        ],
    },
};

export default nextConfig;