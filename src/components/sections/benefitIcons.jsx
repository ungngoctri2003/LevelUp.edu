/** Icon theo khóa CMS `landing_benefits[].icon` */

export const DEFAULT_BENEFIT_ROWS = [
  {
    icon: 'video',
    title: 'Video bài giảng chi tiết',
    description: 'Mỗi bài học được quay với chất lượng cao, dễ hiểu từ cơ bản đến nâng cao.',
  },
  {
    icon: 'device',
    title: 'Học mọi lúc mọi nơi',
    description: 'Truy cập trên mọi thiết bị, học bất cứ khi nào bạn có thời gian.',
  },
  {
    icon: 'chart',
    title: 'Lộ trình học cá nhân hóa',
    description: 'AI phân tích trình độ và đề xuất lộ trình phù hợp với từng học sinh.',
  },
  {
    icon: 'support',
    title: 'Hỗ trợ giải bài tập',
    description: 'Đội ngũ giáo viên và AI sẵn sàng hỗ trợ giải đáp thắc mắc 24/7.',
  },
]

export function BenefitIcon({ name }) {
  const k = String(name || 'video').toLowerCase()
  const cls = 'h-8 w-8'
  switch (k) {
    case 'device':
    case 'mobile':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    case 'chart':
    case 'path':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    case 'support':
    case 'help':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'video':
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
  }
}
