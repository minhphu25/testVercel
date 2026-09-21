import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

// Fallback bộ nhớ nếu chạy ở môi trường Vercel Edge Runtime (không hỗ trợ fs)
const FALLBACK_DOMAINS = new Set([
  'hoankiemhn', 'hoankiem.online',
  'badinhhn', 'badinh.online',
  'ngochahn', 'ngocha.online',
  'giangvohn', 'giangvo.online',
  'haibatrung', 'haibatrung.online',
  'vinhtuy', 'vinhtuy.online',
  'cuanam', 'cuanam.online'
]);

// Cache bộ nhớ để tránh đọc lại tệp CSV ở mỗi request
let allowedSubdomainsCache: Set<string> | null = null;

/**
 * Tự động đọc và giải mã danh sách subdomain từ tệp data/communes.csv
 */
export function getAllowedSubdomains(): Set<string> {
  if (allowedSubdomainsCache) return allowedSubdomainsCache;

  const set = new Set<string>();
  try {
    if (typeof fs !== 'undefined' && fs.existsSync) {
      const csvPath = path.resolve(process.cwd(), 'data/communes.csv');
      if (fs.existsSync(csvPath)) {
        const content = fs.readFileSync(csvPath, 'utf-8');
        const lines = content.split(/\r?\n/);
        
        // Bỏ qua dòng tiêu đề đầu tiên (header), đọc từ dòng thứ 2
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const parts = line.split(',');
          const slug = parts[0]?.trim().toLowerCase();
          const hostname = parts[1]?.trim().toLowerCase();
          
          if (slug) set.add(slug);
          if (hostname) set.add(hostname);
        }
      }
    }
  } catch (err) {
    console.warn('Lưu ý: Không đọc được fs trong Vercel Edge, sử dụng bộ nhớ fallback:', err);
  }

  // Nếu set trống do Edge Runtime, nạp từ FALLBACK_DOMAINS
  if (set.size === 0) {
    FALLBACK_DOMAINS.forEach((item) => set.add(item));
  }

  allowedSubdomainsCache = set;
  return set;
}

/**
 * Next.js Proxy Handler - Tự động đối chiếu subdomain từ data/communes.csv
 */
export default async function proxy(request: NextRequest) {
  const host = request.headers.get('host');
  const hostname = host?.split(':')[0].toLowerCase();
  const slug = hostname?.split('.')[0];

  // Local development does not use a commune subdomain.
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return NextResponse.next();
  }

  // Tự động tải danh sách subdomain từ data/communes.csv
  const allowedSet = getAllowedSubdomains();

  // NẾU SUBDOMAIN KHÔNG CÓ TRONG FILE data/communes.csv ──► CHẶN NGAY & BÁO LỖI 404
  if (!slug || (!allowedSet.has(slug) && !allowedSet.has(hostname || ''))) {
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  // NẾU HỢP LỆ ──► Cho phép truy cập bình thường
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
