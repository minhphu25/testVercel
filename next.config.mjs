/** @type {import('next').NextConfig} */
const nextConfig = {
    // (Tùy chọn) Bỏ qua lỗi type check nếu gặp lỗi TypeScript tương tự
    typescript: {
        ignoreBuildErrors: true,
    },
    turbopack: {
        root: process.cwd(),
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