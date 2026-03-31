/**
 * IAAA · HowItWorks
 *
 * Static 3-step section. No interaction. No API.
 */

const STEPS = [
  {
    number: '01',
    title: 'Describe your situation',
    body: 'Write a few sentences — or a few paragraphs. Your words, your frame.',
  },
  {
    number: '02',
    title: 'Get a Situation Card',
    body: 'Forces, tensions, vulnerabilities, trajectories. Structured and readable in 10 seconds.',
  },
  {
    number: '03',
    title: 'Explore with the Star Map',
    body: 'Navigate 8 dimensions of your situation. Ask deeper questions. See what you missed.',
  },
]

export default function HowItWorks() {
  return (
    <section
      className="py-20 px-5"
      style={{ background: 'var(--bg-surface)' }}
    >
      <div className="max-w-content mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="label-eyebrow mb-4">Process</p>
          <h2
            className="heading-display"
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
              color: 'var(--text-primary)',
              fontWeight: 400,
            }}
          >
            How it works
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px"
          style={{ background: 'var(--border-gold-subtle)' }}
        >
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="flex flex-col p-8 md:p-10"
              style={{ background: 'var(--bg-surface)' }}
            >
              {/* Step number */}
              <span
                className="font-mono text-xs mb-6 block"
                style={{ color: 'var(--gold)', opacity: 0.5, letterSpacing: '0.1em' }}
              >
                {step.number}
              </span>

              {/* Divider accent */}
              <div
                className="w-8 h-px mb-6"
                style={{ background: 'var(--gold)', opacity: 0.35 }}
              />

              {/* Title */}
              <h3
                className="mb-3"
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '1.25rem',
                  color: 'var(--text-primary)',
                  fontWeight: 400,
                  lineHeight: 1.2,
                }}
              >
                {step.title}
              </h3>

              {/* Body */}
              <p
                className="text-sm font-sans leading-relaxed"
                style={{ color: 'var(--text-secondary)', fontWeight: 300 }}
              >
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
