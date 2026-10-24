import { ArrowDownRight, ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/LocaleContext'

type HeroSlide = {
  id: string
  kicker: string
  eyebrow: string
  title: string
  description: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel: string
  secondaryHref: string
  image: string
  imageAlt: string
  supportingImage: string
  supportingAlt: string
  imageLabel: string
  viewLabel: string
}

const SLIDES: HeroSlide[] = [
  {
    id: 'editorial-desk',
    kicker: 'A considered collection',
    eyebrow: 'For everyday living',
    title: 'Make space for your ideas.',
    description: 'Considered finds for the routines, ideas and spaces that shape your everyday.',
    primaryLabel: 'Explore the collection',
    primaryHref: '/shop',
    secondaryLabel: 'Browse categories',
    secondaryHref: '/categories',
    image: '/images/paperloom-hero.webp',
    imageAlt: 'An editorial arrangement of notebooks, planner pages and writing tools on a warm desk',
    supportingImage: '/images/study-notebook.webp',
    supportingAlt: 'A sample study notebook beside the editorial desk arrangement',
    imageLabel: 'Paperloom · everyday edit 01',
    viewLabel: 'View the editorial desk',
  },
  {
    id: 'planning-edit',
    kicker: 'Planning, with room to breathe',
    eyebrow: 'A little shape for the day',
    title: 'Plan the day. Keep the thought.',
    description: 'A sample planning edit for days that need a little more shape. No live inventory is represented.',
    primaryLabel: 'Browse planners',
    primaryHref: '/categories/planners',
    secondaryLabel: 'See all categories',
    secondaryHref: '/categories',
    image: '/images/daily-planner.webp',
    imageAlt: 'A daily planner opened to a clean sample page with writing tools nearby',
    supportingImage: '/images/study-notebook.webp',
    supportingAlt: 'A study notebook layered with a daily planner sample',
    imageLabel: 'Paperloom · planning edit 02',
    viewLabel: 'View the planning edit',
  },
  {
    id: 'journal-edit',
    kicker: 'Journaling, in progress',
    eyebrow: 'A page for what is next',
    title: "A page for what's next.",
    description: 'Sample journals, notebooks and study pieces for ideas still taking shape. This is a demo catalog.',
    primaryLabel: 'Explore journals',
    primaryHref: '/categories/journals',
    secondaryLabel: 'Meet the study edit',
    secondaryHref: '/categories/study-kits',
    image: '/images/linen-journal.webp',
    imageAlt: 'A linen-style journal and fountain pen arranged on a cream surface',
    supportingImage: '/images/study-kit.webp',
    supportingAlt: 'A sample study kit with pens and notes beside a linen-style journal',
    imageLabel: 'Paperloom · journal edit 03',
    viewLabel: 'View the journal edit',
  },
]

function preloadImage(src: string): Promise<void> {
  const image = new Image()
  image.decoding = 'async'
  image.src = src
  if (typeof image.decode === 'function') {
    return image.decode().then(() => undefined).catch(() => undefined)
  }
  return new Promise((resolve) => {
    if (image.complete) resolve()
    else {
      image.onload = () => resolve()
      image.onerror = () => resolve()
    }
  })
}

export function HeroSlider() {
  const { t } = useI18n()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocusWithin, setIsFocusWithin] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const isPaused = isHovered || isFocusWithin
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(mediaQuery.matches)
    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    if (isPaused || reducedMotion) return undefined

    let cancelled = false
    let timer: number | undefined
    const nextSlide = SLIDES[(activeIndex + 1) % SLIDES.length]

    void Promise.all([
      preloadImage(nextSlide.image),
      preloadImage(nextSlide.supportingImage),
    ]).then(() => {
      if (cancelled) return
      timer = window.setTimeout(() => {
        setActiveIndex((current) => (current + 1) % SLIDES.length)
      }, 4500)
    })

    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [activeIndex, isPaused, reducedMotion])

  const selectSlide = (index: number) => {
    setActiveIndex((index + SLIDES.length) % SLIDES.length)
  }
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      selectSlide(activeIndex - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      selectSlide(activeIndex + 1)
    }
  }
  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (touchStartX.current === null) return
    const distance = event.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(distance) < 44) return
    selectSlide(activeIndex + (distance > 0 ? -1 : 1))
  }

  const handleBlur = (event: React.FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsFocusWithin(false)
    }
  }

  const slide = SLIDES[activeIndex]

  return (
    <section
      className="home-hero hero-slider__root shine-surface"
      aria-label={t('A considered collection')}
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocusWithin(true)}
      onBlur={handleBlur}
      onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX }}
      onTouchEnd={handleTouchEnd}
      data-motion={reducedMotion ? 'reduced' : 'full'}
    >
      <div className="hero-slider__viewport" aria-live={isPaused ? 'polite' : 'off'}>
        <article key={slide.id} className="hero-slider__slide is-active" aria-roledescription="slide" aria-label={`${activeIndex + 1} / ${SLIDES.length}`}>
          <div className="hero-slider__copy home-hero__copy">
            <span className="hero-slider__kicker">{t(slide.kicker)}</span>
            <p className="hero-slider__eyebrow">{t(slide.eyebrow)}</p>
            <h1>{t(slide.title)}</h1>
            <p className="hero-slider__description">{t(slide.description)}</p>
            <div className="hero-slider__actions">
              <Link className="hero-slider__primary" to={slide.primaryHref}>{t(slide.primaryLabel)} <ArrowRight size={16} aria-hidden="true" /></Link>
              <Link className="hero-slider__secondary" to={slide.secondaryHref}>{t(slide.secondaryLabel)} <ArrowDownRight size={15} aria-hidden="true" /></Link>
            </div>
            <div className="hero-slider__footnote"><span>{String(activeIndex + 1).padStart(2, '0')}</span><span>{t('Current listings are sample catalog content; no order, payment or delivery request is sent.')}</span></div>
          </div>
          <div className="hero-slider__visual">
            <div className="hero-slider__image-frame">
              <img className="hero-slider__image" src={slide.image} alt={t(slide.imageAlt)} loading={activeIndex === 0 ? 'eager' : 'lazy'} />
              <span className="hero-slider__image-label">{t(slide.imageLabel)}</span>
            </div>
            <img className="hero-slider__supporting-image" src={slide.supportingImage} alt={t(slide.supportingAlt)} loading="lazy" />
            <Link className="hero-slider__image-link" to={slide.primaryHref} aria-label={t(slide.viewLabel)}><ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </article>
      </div>

      <div className="hero-slider__controls" aria-hidden="true">
        <div className="hero-slider__indicators">
          {SLIDES.map((item, index) => (
            <span
              key={item.id}
              className={`hero-slider__indicator${index === activeIndex ? ' is-active' : ''}`}
            />
          ))}
        </div>
      </div>
      {reducedMotion && <p className="hero-slider__motion-note">{t('Carousel paused')}</p>}
    </section>
  )
}
