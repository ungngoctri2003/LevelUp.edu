import Hero from '../components/sections/Hero'
import Benefits from '../components/sections/Benefits'
import Courses from '../components/sections/Courses'
import VideoPreview from '../components/sections/VideoPreview'
import Teachers from '../components/sections/Teachers'
import Testimonials from '../components/sections/Testimonials'
import RegistrationForm from '../components/sections/RegistrationForm'

export default function HomePage() {
  const sparkleItems = [
    { top: '8%', left: '6%', size: '10px', tone: 'text-white/45 dark:text-white/80', duration: '6.4s', delay: '-1.2s' },
    { top: '11%', left: '18%', size: '8px', tone: 'text-cyan-200/45 dark:text-cyan-200/70', duration: '7.2s', delay: '-3.1s' },
    { top: '7%', left: '31%', size: '9px', tone: 'text-fuchsia-200/40 dark:text-fuchsia-200/68', duration: '8.1s', delay: '-2.4s' },
    { top: '13%', left: '44%', size: '11px', tone: 'text-white/40 dark:text-white/72', duration: '6.8s', delay: '-4.8s' },
    { top: '9%', left: '58%', size: '8px', tone: 'text-amber-200/35 dark:text-amber-200/60', duration: '7.9s', delay: '-1.7s' },
    { top: '15%', left: '73%', size: '10px', tone: 'text-cyan-200/38 dark:text-cyan-200/68', duration: '6.9s', delay: '-5.2s' },
    { top: '12%', left: '88%', size: '9px', tone: 'text-white/42 dark:text-white/76', duration: '8.7s', delay: '-0.9s' },
    { top: '26%', left: '9%', size: '8px', tone: 'text-violet-200/32 dark:text-violet-200/58', duration: '7.4s', delay: '-2.8s' },
    { top: '24%', left: '24%', size: '10px', tone: 'text-white/38 dark:text-white/72', duration: '6.6s', delay: '-4.1s' },
    { top: '32%', left: '39%', size: '9px', tone: 'text-cyan-200/34 dark:text-cyan-200/64', duration: '8.5s', delay: '-1.5s' },
    { top: '28%', left: '55%', size: '11px', tone: 'text-fuchsia-200/34 dark:text-fuchsia-200/62', duration: '7.1s', delay: '-3.6s' },
    { top: '35%', left: '82%', size: '8px', tone: 'text-white/34 dark:text-white/68', duration: '9.1s', delay: '-5.5s' },
    { top: '48%', left: '14%', size: '10px', tone: 'text-amber-200/32 dark:text-amber-200/58', duration: '7.6s', delay: '-2.2s' },
    { top: '44%', left: '29%', size: '8px', tone: 'text-white/36 dark:text-white/70', duration: '6.7s', delay: '-4.7s' },
    { top: '52%', left: '47%', size: '12px', tone: 'text-cyan-200/34 dark:text-cyan-200/62', duration: '8.8s', delay: '-1.9s' },
    { top: '49%', left: '66%', size: '9px', tone: 'text-fuchsia-200/30 dark:text-fuchsia-200/58', duration: '7.8s', delay: '-6s' },
    { top: '57%', left: '91%', size: '8px', tone: 'text-white/34 dark:text-white/68', duration: '6.5s', delay: '-3.3s' },
    { top: '69%', left: '8%', size: '9px', tone: 'text-cyan-200/30 dark:text-cyan-200/56', duration: '8.2s', delay: '-4.4s' },
    { top: '74%', left: '36%', size: '10px', tone: 'text-white/34 dark:text-white/66', duration: '7.3s', delay: '-2.6s' },
    { top: '81%', left: '63%', size: '11px', tone: 'text-amber-200/28 dark:text-amber-200/54', duration: '8.9s', delay: '-5.7s' },
  ]
  const burstItems = [
    { top: '10%', left: '12%', size: '16px', tone: 'text-white/40 dark:text-white/82', duration: '9.4s', delay: '-2.1s' },
    { top: '14%', left: '38%', size: '18px', tone: 'text-cyan-200/38 dark:text-cyan-200/72', duration: '8.8s', delay: '-5.3s' },
    { top: '9%', left: '66%', size: '15px', tone: 'text-fuchsia-200/34 dark:text-fuchsia-200/68', duration: '10.2s', delay: '-1.4s' },
    { top: '21%', left: '86%', size: '17px', tone: 'text-amber-200/30 dark:text-amber-200/64', duration: '9.1s', delay: '-6s' },
    { top: '33%', left: '18%', size: '14px', tone: 'text-white/34 dark:text-white/72', duration: '8.6s', delay: '-3.5s' },
    { top: '41%', left: '58%', size: '18px', tone: 'text-cyan-200/32 dark:text-cyan-200/66', duration: '11s', delay: '-4.8s' },
    { top: '47%', left: '78%', size: '16px', tone: 'text-fuchsia-200/28 dark:text-fuchsia-200/62', duration: '9.8s', delay: '-2.7s' },
    { top: '59%', left: '26%', size: '15px', tone: 'text-white/32 dark:text-white/68', duration: '8.4s', delay: '-6.3s' },
    { top: '68%', left: '49%', size: '17px', tone: 'text-amber-200/26 dark:text-amber-200/58', duration: '10.5s', delay: '-3.9s' },
    { top: '76%', left: '84%', size: '14px', tone: 'text-cyan-200/28 dark:text-cyan-200/62', duration: '9.2s', delay: '-5.6s' },
    { top: '84%', left: '14%', size: '16px', tone: 'text-fuchsia-200/24 dark:text-fuchsia-200/56', duration: '10.8s', delay: '-1.8s' },
    { top: '88%', left: '71%', size: '15px', tone: 'text-white/30 dark:text-white/64', duration: '9.6s', delay: '-4.2s' },
  ]
  const streakItems = [
    { top: '17%', left: '24%', width: '110px', tone: 'from-transparent via-white/18 to-transparent dark:via-white/24', angle: '-12deg', duration: '14s', delay: '-3.6s' },
    { top: '29%', left: '62%', width: '96px', tone: 'from-transparent via-cyan-200/18 to-transparent dark:via-cyan-200/24', angle: '18deg', duration: '16s', delay: '-5.4s' },
    { top: '54%', left: '34%', width: '120px', tone: 'from-transparent via-fuchsia-200/16 to-transparent dark:via-fuchsia-200/22', angle: '-18deg', duration: '15.2s', delay: '-2.4s' },
    { top: '73%', left: '72%', width: '100px', tone: 'from-transparent via-amber-200/16 to-transparent dark:via-amber-200/22', angle: '12deg', duration: '17s', delay: '-6.1s' },
  ]

  return (
    <div className="home-page-unified-bg text-slate-950 dark:text-slate-100">
      <div className="home-page-unified-effects pointer-events-none z-0" aria-hidden>
        <div className="home-page-ribbon home-page-ribbon--a absolute top-[6%] left-[-10%] h-104 w-160 rounded-full bg-cyan-300/12 dark:bg-cyan-400/18 blur-2xl" />
        <div className="home-page-ribbon home-page-ribbon--b absolute top-[34%] right-[-12%] h-120 w-2xl rounded-full bg-fuchsia-300/10 dark:bg-fuchsia-500/18 blur-2xl" />
        <div className="home-page-ribbon home-page-ribbon--c absolute bottom-[6%] left-[18%] h-88 w-136 rounded-full bg-violet-300/10 dark:bg-violet-500/16 blur-2xl" />
        <div className="home-page-beam home-page-beam--a absolute top-[18%] left-1/2 h-260 w-36 -translate-x-1/2 bg-linear-to-b from-transparent via-cyan-200/18 to-transparent dark:via-cyan-200/14" />
        <div className="home-page-beam home-page-beam--b absolute top-[48%] left-[18%] h-128 w-24 -rotate-18 bg-linear-to-b from-transparent via-fuchsia-200/16 to-transparent dark:via-fuchsia-200/14" />
        <div className="home-page-glow home-page-glow--a absolute top-[28%] left-[14%] h-32 w-32 rounded-full bg-cyan-200/20 dark:bg-cyan-300/24 blur-2xl" />
        <div className="home-page-glow home-page-glow--b absolute top-[56%] right-[14%] h-40 w-40 rounded-full bg-fuchsia-200/18 dark:bg-fuchsia-300/22 blur-2xl" />
        <div className="home-page-glow home-page-glow--c absolute bottom-[14%] left-[42%] h-36 w-36 rounded-full bg-amber-200/12 dark:bg-amber-300/18 blur-2xl" />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.9) 1px, transparent 1px),
                              radial-gradient(circle at 75% 75%, rgba(6,182,212,0.5) 1px, transparent 1px)`,
            backgroundSize: '56px 56px',
          }}
        />
        <div className="hero-star-drift-a absolute inset-0 overflow-hidden opacity-25 dark:opacity-100">
          <span className="hero-star-dots hero-star-dots--near" />
        </div>
        <div className="hero-star-drift-b absolute inset-0 overflow-hidden opacity-20 dark:opacity-90">
          <span className="hero-star-dots hero-star-dots--far" />
        </div>
        <div className="hero-star-drift-a absolute inset-0 overflow-hidden opacity-15 dark:opacity-65">
          <span className="hero-star-dots hero-star-dots--micro" />
        </div>
        <div className="hero-star-drift-b absolute inset-0 overflow-hidden opacity-12 dark:opacity-55">
          <span className="hero-star-dots hero-star-dots--tiny" />
        </div>
        {sparkleItems.map((item, index) => (
          <span
            key={`${item.top}-${item.left}-${index}`}
            className={`home-page-sparkle absolute ${item.tone}`}
            style={{
              top: item.top,
              left: item.left,
              width: item.size,
              height: item.size,
              '--sparkle-duration': item.duration,
              '--sparkle-delay': item.delay,
            }}
          />
        ))}
        {burstItems.map((item, index) => (
          <span
            key={`burst-${item.top}-${item.left}-${index}`}
            className={`home-page-starburst absolute ${item.tone}`}
            style={{
              top: item.top,
              left: item.left,
              width: item.size,
              height: item.size,
              '--starburst-duration': item.duration,
              '--starburst-delay': item.delay,
            }}
          />
        ))}
        {streakItems.map((item, index) => (
          <span
            key={`streak-${item.top}-${item.left}-${index}`}
            className={`home-page-streak absolute bg-linear-to-r ${item.tone}`}
            style={{
              top: item.top,
              left: item.left,
              width: item.width,
              '--streak-angle': item.angle,
              '--streak-duration': item.duration,
              '--streak-delay': item.delay,
            }}
          />
        ))}
        <div className="hero-float-dot-sm absolute top-[12%] left-[10%] h-3 w-3 rounded-full bg-amber-300/25 dark:bg-amber-300/45" />
        <div className="hero-float-dot-md absolute top-[24%] right-[16%] h-2 w-2 rounded-full bg-cyan-300/35 dark:bg-cyan-300/65" />
        <div className="hero-float-diamond absolute top-[42%] left-[18%] h-4 w-4 rounded-lg bg-fuchsia-400/12 dark:bg-fuchsia-400/20" />
        <div className="hero-float-dot-sm absolute top-[58%] right-[20%] h-2.5 w-2.5 rounded-full bg-fuchsia-300/22 dark:bg-fuchsia-300/45 [animation-delay:-1.2s]" />
        <div className="hero-float-dot-md absolute top-[72%] left-[12%] h-2 w-2 rounded-full bg-violet-300/25 dark:bg-violet-300/50 [animation-delay:-2s]" />
        <div className="hero-float-dot-sm absolute bottom-[12%] left-[22%] h-2.5 w-2.5 rounded-full bg-cyan-300/20 dark:bg-cyan-300/40 [animation-delay:-0.8s]" />
        <div className="hero-float-dot-md absolute bottom-[18%] right-[12%] h-3 w-3 rounded-full bg-amber-300/18 dark:bg-amber-300/35 [animation-delay:-1.6s]" />
      </div>
      <Hero />
      <Benefits />
      <Courses />
      <VideoPreview />
      <Teachers />
      <Testimonials />
      <RegistrationForm />
    </div>
  )
}
