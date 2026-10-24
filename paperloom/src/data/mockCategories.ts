import type { Category } from '../types/category'

export const CATEGORIES: Category[] = [
  { id: 'journals', slug: 'journals', name: 'Journals', description: 'A good place to begin.', image: '/images/linen-journal.webp', eyebrow: 'For your thoughts' },
  { id: 'planners', slug: 'planners', name: 'Planners', description: 'Make a little room for the day.', image: '/images/daily-planner.webp', eyebrow: 'Find your rhythm' },
  { id: 'notebooks', slug: 'notebooks', name: 'Notebooks', description: 'Pages for what comes next.', image: '/images/study-notebook.webp', eyebrow: 'Ideas, in progress' },
  { id: 'study-kits', slug: 'study-kits', name: 'Study Kits', description: 'Small essentials, gathered together.', image: '/images/study-kit.webp', eyebrow: 'Ready for a study session' },
  { id: 'accessories', slug: 'accessories', name: 'Accessories', description: 'Thoughtful details for your desk.', image: '/images/study-kit.webp', eyebrow: 'Little desk rituals' },
]
