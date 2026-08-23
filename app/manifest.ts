import type { MetadataRoute } from 'next';
import { semanticColors } from '@/lib/semanticColors';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '모두스팟 | 대중교통 약속 장소 비교',
    short_name: '모두스팟',
    description: '여러 출발지와 목적지 후보의 대중교통 소요시간을 비교해 더 공정한 약속 장소를 고르는 서비스입니다.',
    start_url: '/',
    display: 'standalone',
    background_color: semanticColors.canvas,
    theme_color: semanticColors.action,
    icons: [
      {
        src: '/icon',
        sizes: '64x64',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '64x64',
        type: 'image/png',
      },
    ],
  };
}
