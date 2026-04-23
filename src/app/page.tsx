import Link from 'next/link';

const features = [
  {
    icon: '🧾',
    title: 'Eskaera digitala',
    desc: 'Aginduak momentuan jasotzen dira, paper eta akats gutxiagorekin',
  },
  {
    icon: '📺',
    title: 'KDS denbora errealean',
    desc: 'Sukaldeak eta mostradoreek eskaera guztiak pantailan ikusten dituzte',
  },
  {
    icon: '👥',
    title: 'Boluntarioen kudeaketa',
    desc: 'Erregistratu boluntarioak, esleitu rolak eta kontrolatu sarbidea PINaren bidez',
  },
  {
    icon: '🏪',
    title: 'Txosna anitz',
    desc: 'Elkarte batek ekitaldi berean txosna bat baino gehiago kudea dezake',
  },
  {
    icon: '💳',
    title: 'Online ordainketak',
    desc: 'Stripe bidezko ordainketa digitala, erabat integratuta',
  },
  {
    icon: '⚡',
    title: 'Onboarding azkarra',
    desc: 'Minutu gutxian txosna martxan jar dezakezu, gidatutako prozesuarekin',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Header */}
      <header className="shrink-0 h-15 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <span
          className="font-extrabold text-xl text-gray-900 dark:text-slate-50"
          style={{ fontFamily: 'var(--font-nunito, sans-serif)' }}
        >
          Txosnabai
        </span>
        <Link
          href="/login"
          className="text-sm font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 no-underline transition-colors"
        >
          Saioa hasi →
        </Link>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center text-center px-6 pt-20 pb-16 max-w-3xl mx-auto w-full">
        <h1
          className="font-black text-gray-900 dark:text-slate-50 leading-tight mb-5"
          style={{
            fontFamily: 'var(--font-nunito, sans-serif)',
            fontSize: 'clamp(28px, 5vw, 48px)',
            lineHeight: 1.15,
          }}
        >
          Zure txosna, modu digitalean kudeatuta
        </h1>
        <p className="text-lg text-gray-500 dark:text-slate-400 leading-relaxed mb-10 max-w-xl">
          Elkarteak erregistratu eta jaialdietan txosnen kudeaketa osoa egin dezake: eskaera
          digitalak, KDS, boluntarioak eta ordainketak, dena toki batetik.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/register"
            className="inline-block px-7 py-3.5 rounded-xl font-bold text-sm text-white no-underline transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: '#e85d2f' }}
          >
            Elkartea erregistratu
          </Link>
          <Link
            href="/login"
            className="inline-block px-7 py-3.5 rounded-xl font-semibold text-sm no-underline bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-colors"
          >
            Dagoeneko kontu bat dut →
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3
                className="text-base font-bold text-gray-900 dark:text-slate-50 mb-1.5"
                style={{ fontFamily: 'var(--font-nunito, sans-serif)' }}
              >
                {f.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="shrink-0 border-t border-gray-200 dark:border-slate-800 py-6 text-center text-sm text-gray-400 dark:text-slate-500">
        <span
          className="font-bold text-gray-600 dark:text-slate-300"
          style={{ fontFamily: 'var(--font-nunito, sans-serif)' }}
        >
          Txosnabai
        </span>
        {' · '}Txosnen kudeaketa digitala{' · '}© {new Date().getFullYear()}
      </footer>
    </div>
  );
}
