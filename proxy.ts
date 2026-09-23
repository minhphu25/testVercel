import fs from 'fs';
import path from 'path';

import { NextResponse, NextRequest } from 'next/server';

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
      const csvPath = path.resolve(process.cwd(), 'communes.csv');
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
      } else {
        console.warn('Không tìm thấy file communes.csv tại:', csvPath);
      }
    }
  } catch (err) {
    console.warn('Lưu ý khi đọc file communes.csv trong proxy:', err);
  }

  allowedSubdomainsCache = set;
  return set;
}

/**
 * Next.js Proxy Handler - Tự động đối chiếu subdomain từ communes.csv
 */
export default async function proxy(request: NextRequest) {
  const host = request.headers.get('host');
  const hostname = host?.split(':')[0].toLowerCase();
  const slug = hostname?.split('.')[0];

  // Cho phép chạy ở localhost khi dev
  if (hostname === 'localhost') {
    return NextResponse.next();
  }

  // Tự động tải danh sách subdomain từ communes.csv
  const allowedSet = getAllowedSubdomains();

  // NẾU SUBDOMAIN KHÔNG CÓ TRONG FILE communes.csv ──► CHẶN NGAY & BÁO LỖI 404
  if (!slug || (!allowedSet.has(slug) && !allowedSet.has(hostname || ''))) {
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  // NẾU HỢP LỆ ──► Cho phép truy cập bình thường
  return NextResponse.next();
}
