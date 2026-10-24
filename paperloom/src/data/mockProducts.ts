import type { Product } from '../types/product'

const journal = '/images/linen-journal.webp'
const planner = '/images/daily-planner.webp'
const notebook = '/images/study-notebook.webp'
const kit = '/images/study-kit.webp'
const editorialDesk = '/images/paperloom-hero.webp'

/** Every record below is fictional demo catalogue data, not inventory or a supplier listing. */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'demo-journal-01', slug: 'linen-thought-journal', name: 'Linen Thought Journal',
    shortDescription: 'A quiet place for the thoughts you want to keep.',
    description: 'A considered, cloth-bound journal for notes, morning pages and ideas in progress. This sample listing is demonstration content only; product sourcing and availability are unconfirmed.',
    price: 1850, currency: 'PKR', categoryId: 'journals', images: [journal, editorialDesk],
    specifications: [{ label: 'Format', value: 'A5 sample' }, { label: 'Pages', value: '160 sample pages' }, { label: 'Cover', value: 'Linen-style, sample' }],
    variants: [{ id: 'sage', label: 'Cover', value: 'Soft sage' }, { id: 'forest', label: 'Cover', value: 'Forest green' }],
    isPublished: true, availabilityStatus: 'demo', createdAt: '2026-01-10',
  },
  {
    id: 'demo-planner-01', slug: 'everyday-planner', name: 'Everyday Planner',
    shortDescription: 'An undated page for making a plan your own.',
    description: 'An undated planner concept with simple spaces for the day ahead. Sample details only; no vendor or stock is confirmed.',
    price: 2200, currency: 'PKR', categoryId: 'planners', images: [planner, editorialDesk],
    specifications: [{ label: 'Format', value: 'A5 sample' }, { label: 'Layout', value: 'Undated daily, sample' }, { label: 'Pages', value: '120 sample pages' }],
    variants: [{ id: 'sage', label: 'Cover', value: 'Sage' }, { id: 'cream', label: 'Cover', value: 'Warm cream' }],
    isPublished: true, availabilityStatus: 'demo', createdAt: '2026-01-12',
  },
  {
    id: 'demo-notebook-01', slug: 'field-notes-notebook', name: 'Field Notes Notebook',
    shortDescription: 'A softly structured home for new ideas.',
    description: 'A compact notebook concept for class notes, sketches and everyday lists. Everything in this store is a demo listing rather than confirmed inventory.',
    price: 1250, currency: 'PKR', categoryId: 'notebooks', images: [notebook, editorialDesk],
    specifications: [{ label: 'Format', value: 'A5 sample' }, { label: 'Paper', value: 'Ruled, sample' }, { label: 'Binding', value: 'Softcover concept' }],
    variants: [{ id: 'sage', label: 'Cover', value: 'Sage' }, { id: 'olive', label: 'Cover', value: 'Olive' }],
    isPublished: true, availabilityStatus: 'demo', createdAt: '2026-01-14',
  },
  {
    id: 'demo-kit-01', slug: 'study-session-kit', name: 'Study Session Kit',
    shortDescription: 'The little tools for a focused afternoon.',
    description: 'A fictional bundle concept with pencils, notes and page markers for a study session. This is not an available bundle or confirmed stock.',
    price: 2950, currency: 'PKR', categoryId: 'study-kits', images: [kit, notebook],
    specifications: [{ label: 'Contents', value: 'Sample stationery bundle' }, { label: 'Use', value: 'Study sessions' }, { label: 'Availability', value: 'Not confirmed' }],
    variants: [], isPublished: true, availabilityStatus: 'demo', createdAt: '2026-01-16',
  },
  {
    id: 'demo-accessory-01', slug: 'desk-notes-set', name: 'Desk Notes Set',
    shortDescription: 'Small paper notes for the things in between.',
    description: 'A stationery accessory concept featuring a blank memo pad and page markers. Sample product details only.',
    price: 790, currency: 'PKR', categoryId: 'accessories', images: [kit, notebook],
    specifications: [{ label: 'Contents', value: 'Sample memo set' }, { label: 'Paper', value: 'Uncoated, sample' }],
    variants: [], isPublished: true, availabilityStatus: 'demo', createdAt: '2026-01-17',
  },
  {
    id: 'demo-journal-02', slug: 'open-page-journal', name: 'Open Page Journal',
    shortDescription: 'Unruled pages with room to wander.',
    description: 'An open-page journal sample with an unruled layout. Sourcing, specifications and stock are not confirmed.',
    price: 1650, currency: 'PKR', categoryId: 'journals', images: [journal, editorialDesk],
    specifications: [{ label: 'Format', value: 'A5 sample' }, { label: 'Layout', value: 'Unruled concept' }],
    variants: [{ id: 'forest', label: 'Cover', value: 'Forest' }], isPublished: true, availabilityStatus: 'demo', createdAt: '2026-01-18',
  },
  {
    id: 'demo-planner-02', slug: 'semester-planner', name: 'Semester Planner',
    shortDescription: 'A sample layout for a full term of ideas.',
    description: 'A semester-planner concept, offered here as sample catalogue data only. No live sale is enabled.',
    price: 2450, currency: 'PKR', categoryId: 'planners', images: [planner, editorialDesk],
    specifications: [{ label: 'Format', value: 'A4 sample' }, { label: 'Layout', value: 'Term overview, concept' }],
    variants: [], isPublished: true, availabilityStatus: 'demo', createdAt: '2026-01-20',
  },
  {
    id: 'demo-notebook-02', slug: 'lecture-notebook', name: 'Lecture Notebook',
    shortDescription: 'A clean start for the next class.',
    description: 'A lecture notebook sample for student-focused catalogue exploration. Availability is unverified.',
    price: 980, currency: 'PKR', categoryId: 'notebooks', images: [notebook, editorialDesk],
    specifications: [{ label: 'Format', value: 'B5 sample' }, { label: 'Paper', value: 'Ruled, sample' }],
    variants: [], isPublished: true, availabilityStatus: 'demo', createdAt: '2026-01-21',
  },
  {
    id: 'demo-kit-02', slug: 'exam-day-essentials', name: 'Exam Day Essentials',
    shortDescription: 'A fictional bundle concept, made for the mock shop.',
    description: 'A demo-only bundle concept. It is not current stock and is not connected to any supplier.',
    price: 3150, currency: 'PKR', categoryId: 'study-kits', images: [kit, notebook],
    specifications: [{ label: 'Contents', value: 'Demo bundle concept' }, { label: 'Availability', value: 'Not confirmed' }],
    variants: [], isPublished: true, availabilityStatus: 'unavailable', createdAt: '2026-01-22',
  },
  {
    id: 'demo-accessory-02', slug: 'pencil-case', name: 'Soft Pencil Case',
    shortDescription: 'A simple home for everyday writing tools.',
    description: 'A fictional accessories concept shown for visual completeness; real products and inventory are not confirmed.',
    price: 1450, currency: 'PKR', categoryId: 'accessories', images: [kit, notebook],
    specifications: [{ label: 'Material', value: 'Textile-style, sample' }, { label: 'Availability', value: 'Not confirmed' }],
    variants: [{ id: 'sage', label: 'Color', value: 'Sage' }],
    isPublished: true, availabilityStatus: 'demo', createdAt: '2026-01-23',
  },
  {
    id: 'hidden-demo-product', slug: 'unpublished-sample', name: 'Unpublished sample',
    shortDescription: 'This product is intentionally not in the public catalogue.',
    description: 'Private sample record for filtering behavior.', price: 500, currency: 'PKR', categoryId: 'notebooks',
    images: [notebook, editorialDesk], specifications: [], variants: [], isPublished: false, availabilityStatus: 'unavailable',
  },
]
