import { ArrowRight, Mail } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { useI18n } from '../../i18n/LocaleContext'

export function NewsletterSignup() {
  const { t } = useI18n()
  const id = `paperloom-newsletter-${useId().replace(/:/g, '')}`
  const [email, setEmail] = useState('')
  const [feedbackVisible, setFeedbackVisible] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedbackVisible(true)
    setEmail('')
  }

  return (
    <section className="home-newsletter newsletter__section" aria-labelledby={`${id}-title`}>
      <div className="newsletter__icon" aria-hidden="true"><Mail size={20} /></div>
      <div className="newsletter__copy">
        <span className="newsletter__eyebrow">{t('A quiet note for future launches')}</span>
        <h2 id={`${id}-title`}>{t('Stay close to the next page.')}</h2>
        <p>{t('A quiet note for future launches, product edits and useful desk ideas. Nothing is connected yet.')}</p>
      </div>
      <form className="newsletter__form" onSubmit={handleSubmit}>
        <label className="newsletter__label" htmlFor={`${id}-email`}>{t('Email address')}</label>
        <div className="newsletter__field-row">
          <input
            id={`${id}-email`}
            className="newsletter__input"
            type="email"
            name="email"
            value={email}
            onChange={(event) => { setEmail(event.target.value); setFeedbackVisible(false) }}
            placeholder={t('Your email address')}
            autoComplete="email"
            required
          />
          <button className="newsletter__submit" type="submit"><span>{t('Join the note')}</span><ArrowRight size={16} aria-hidden="true" /></button>
        </div>
        <p className="newsletter__fine-print">{t('No email will be sent in this demo.')}</p>
        {feedbackVisible && <p className="newsletter__feedback" role="status" aria-live="polite">{t('Not connected; nothing was sent. Your field was cleared.')}</p>}
      </form>
    </section>
  )
}
