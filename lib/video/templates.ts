import { VideoTemplate, VideoScene } from '@/types/video.types'

// 제품 소개 템플릿
const productIntroTemplate: VideoTemplate = {
  id: 'product-intro-1',
  name: '제품 소개 - 모던',
  description: '깔끔하고 모던한 디자인의 제품 소개 비디오',
  thumbnail: '/templates/product-intro.jpg',
  format: '16:9',
  duration: 15,
  category: 'product',
  scenes: [
    {
      id: 'scene-1',
      order: 0,
      duration: 3,
      background: {
        type: 'gradient',
        value: {
          type: 'linear',
          colors: ['#667eea', '#764ba2'],
          angle: 135
        }
      },
      elements: [
        {
          id: 'text-1',
          type: 'text',
          position: { x: 50, y: 45 },
          size: { width: 80, height: 10 },
          content: '새로운 제품을 소개합니다',
          style: {
            fontSize: 56,
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            shadow: {
              x: 0,
              y: 4,
              blur: 20,
              color: 'rgba(0,0,0,0.3)'
            }
          },
          animation: {
            type: 'fadeIn',
            duration: 1,
            delay: 0.5
          }
        }
      ]
    },
    {
      id: 'scene-2',
      order: 1,
      duration: 5,
      background: {
        type: 'color',
        value: '#ffffff'
      },
      elements: [
        {
          id: 'title-2',
          type: 'text',
          position: { x: 50, y: 30 },
          size: { width: 70, height: 8 },
          content: '주요 기능',
          style: {
            fontSize: 48,
            fontWeight: 700,
            color: '#1e293b',
            textAlign: 'center'
          }
        },
        {
          id: 'feature-1',
          type: 'text',
          position: { x: 50, y: 45 },
          size: { width: 60, height: 5 },
          content: '✓ 직관적인 사용성',
          style: {
            fontSize: 32,
            fontWeight: 500,
            color: '#64748b',
            textAlign: 'center'
          }
        },
        {
          id: 'feature-2',
          type: 'text',
          position: { x: 50, y: 52 },
          size: { width: 60, height: 5 },
          content: '✓ 빠른 성능',
          style: {
            fontSize: 32,
            fontWeight: 500,
            color: '#64748b',
            textAlign: 'center'
          }
        },
        {
          id: 'feature-3',
          type: 'text',
          position: { x: 50, y: 59 },
          size: { width: 60, height: 5 },
          content: '✓ 합리적인 가격',
          style: {
            fontSize: 32,
            fontWeight: 500,
            color: '#64748b',
            textAlign: 'center'
          }
        }
      ]
    },
    {
      id: 'scene-3',
      order: 2,
      duration: 7,
      background: {
        type: 'gradient',
        value: {
          type: 'linear',
          colors: ['#6366f1', '#8b5cf6'],
          angle: 45
        }
      },
      elements: [
        {
          id: 'cta-text',
          type: 'text',
          position: { x: 50, y: 40 },
          size: { width: 70, height: 8 },
          content: '지금 바로 시작하세요',
          style: {
            fontSize: 48,
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center'
          }
        },
        {
          id: 'cta-button',
          type: 'shape',
          position: { x: 40, y: 52 },
          size: { width: 20, height: 6 },
          style: {
            backgroundColor: '#ffffff',
            borderRadius: 999
          }
        },
        {
          id: 'cta-button-text',
          type: 'text',
          position: { x: 50, y: 52 },
          size: { width: 20, height: 6 },
          content: '자세히 보기',
          style: {
            fontSize: 24,
            fontWeight: 600,
            color: '#6366f1',
            textAlign: 'center'
          }
        }
      ]
    }
  ]
}

// 프로모션 템플릿
const promoTemplate: VideoTemplate = {
  id: 'promo-1',
  name: '프로모션 - 역동적',
  description: '역동적이고 눈길을 끄는 프로모션 비디오',
  thumbnail: '/templates/promo.jpg',
  format: '9:16',
  duration: 10,
  category: 'promo',
  scenes: [
    {
      id: 'scene-1',
      order: 0,
      duration: 3,
      background: {
        type: 'gradient',
        value: {
          type: 'radial',
          colors: ['#f59e0b', '#ef4444']
        }
      },
      elements: [
        {
          id: 'promo-badge',
          type: 'shape',
          position: { x: 50, y: 30 },
          size: { width: 60, height: 15 },
          style: {
            backgroundColor: '#ffffff',
            borderRadius: 16
          }
        },
        {
          id: 'promo-text',
          type: 'text',
          position: { x: 50, y: 30 },
          size: { width: 60, height: 15 },
          content: '🔥 특별 할인',
          style: {
            fontSize: 48,
            fontWeight: 800,
            color: '#ef4444',
            textAlign: 'center'
          }
        }
      ]
    },
    {
      id: 'scene-2',
      order: 1,
      duration: 4,
      background: {
        type: 'color',
        value: '#1e293b'
      },
      elements: [
        {
          id: 'discount',
          type: 'text',
          position: { x: 50, y: 35 },
          size: { width: 80, height: 15 },
          content: '50% OFF',
          style: {
            fontSize: 72,
            fontWeight: 900,
            color: '#fbbf24',
            textAlign: 'center'
          }
        },
        {
          id: 'period',
          type: 'text',
          position: { x: 50, y: 50 },
          size: { width: 70, height: 8 },
          content: '기간 한정 특가',
          style: {
            fontSize: 32,
            fontWeight: 600,
            color: '#ffffff',
            textAlign: 'center'
          }
        }
      ]
    },
    {
      id: 'scene-3',
      order: 2,
      duration: 3,
      background: {
        type: 'gradient',
        value: {
          type: 'linear',
          colors: ['#6366f1', '#8b5cf6'],
          angle: 135
        }
      },
      elements: [
        {
          id: 'cta',
          type: 'text',
          position: { x: 50, y: 45 },
          size: { width: 80, height: 10 },
          content: '지금 구매하기',
          style: {
            fontSize: 44,
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center'
          }
        }
      ]
    }
  ]
}

// 스토리 템플릿
const storyTemplate: VideoTemplate = {
  id: 'story-1',
  name: '스토리 - 감성적',
  description: '감성적인 스토리텔링 비디오',
  thumbnail: '/templates/story.jpg',
  format: '1:1',
  duration: 12,
  category: 'story',
  scenes: [
    {
      id: 'scene-1',
      order: 0,
      duration: 4,
      background: {
        type: 'gradient',
        value: {
          type: 'linear',
          colors: ['#fef3c7', '#fcd34d'],
          angle: 0
        }
      },
      elements: [
        {
          id: 'intro-text',
          type: 'text',
          position: { x: 50, y: 45 },
          size: { width: 80, height: 12 },
          content: '우리의 이야기',
          style: {
            fontSize: 52,
            fontWeight: 700,
            color: '#78350f',
            textAlign: 'center'
          }
        }
      ]
    },
    {
      id: 'scene-2',
      order: 1,
      duration: 4,
      background: {
        type: 'color',
        value: '#fffbeb'
      },
      elements: [
        {
          id: 'story-1',
          type: 'text',
          position: { x: 50, y: 40 },
          size: { width: 80, height: 20 },
          content: '고객의 니즈로부터 시작된\n혁신적인 솔루션',
          style: {
            fontSize: 36,
            fontWeight: 600,
            color: '#292524',
            textAlign: 'center'
          }
        }
      ]
    },
    {
      id: 'scene-3',
      order: 2,
      duration: 4,
      background: {
        type: 'gradient',
        value: {
          type: 'radial',
          colors: ['#dbeafe', '#3b82f6']
        }
      },
      elements: [
        {
          id: 'closing',
          type: 'text',
          position: { x: 50, y: 45 },
          size: { width: 80, height: 12 },
          content: '함께 만들어가는 미래',
          style: {
            fontSize: 44,
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center'
          }
        }
      ]
    }
  ]
}

// 후기 템플릿
const testimonialTemplate: VideoTemplate = {
  id: 'testimonial-1',
  name: '고객 후기',
  description: '신뢰감을 주는 고객 후기 비디오',
  thumbnail: '/templates/testimonial.jpg',
  format: '16:9',
  duration: 10,
  category: 'testimonial',
  scenes: [
    {
      id: 'scene-1',
      order: 0,
      duration: 3,
      background: {
        type: 'color',
        value: '#f8fafc'
      },
      elements: [
        {
          id: 'title',
          type: 'text',
          position: { x: 50, y: 45 },
          size: { width: 70, height: 10 },
          content: '고객들의 이야기',
          style: {
            fontSize: 48,
            fontWeight: 700,
            color: '#1e293b',
            textAlign: 'center'
          }
        }
      ]
    },
    {
      id: 'scene-2',
      order: 1,
      duration: 5,
      background: {
        type: 'color',
        value: '#ffffff'
      },
      elements: [
        {
          id: 'quote-bg',
          type: 'shape',
          position: { x: 50, y: 45 },
          size: { width: 80, height: 30 },
          style: {
            backgroundColor: '#f1f5f9',
            borderRadius: 16
          }
        },
        {
          id: 'quote',
          type: 'text',
          position: { x: 50, y: 40 },
          size: { width: 70, height: 15 },
          content: '"정말 만족스러운 제품이에요.\n강력히 추천합니다!"',
          style: {
            fontSize: 32,
            fontWeight: 500,
            color: '#334155',
            textAlign: 'center'
          }
        },
        {
          id: 'author',
          type: 'text',
          position: { x: 50, y: 55 },
          size: { width: 60, height: 5 },
          content: '- 김고객님',
          style: {
            fontSize: 24,
            fontWeight: 600,
            color: '#64748b',
            textAlign: 'center'
          }
        }
      ]
    },
    {
      id: 'scene-3',
      order: 2,
      duration: 2,
      background: {
        type: 'gradient',
        value: {
          type: 'linear',
          colors: ['#6366f1', '#8b5cf6'],
          angle: 135
        }
      },
      elements: [
        {
          id: 'rating',
          type: 'text',
          position: { x: 50, y: 45 },
          size: { width: 60, height: 10 },
          content: '⭐⭐⭐⭐⭐ 5.0',
          style: {
            fontSize: 48,
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center'
          }
        }
      ]
    }
  ]
}

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  productIntroTemplate,
  promoTemplate,
  storyTemplate,
  testimonialTemplate
]
