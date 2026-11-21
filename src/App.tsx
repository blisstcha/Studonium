import { useEffect, useState } from 'react';
import './App.css';
import Calendar from './features/calendar/Calendar';
import CalendarReminders from './features/calendar/CalendarReminders';
import Focus from './features/focus/Focus';
import SessionReview from './features/focus/SessionReview';
import type { StudySession } from './features/profile/activity.storage';
import Profile from './features/profile/Profile';
import { readProfile, writeProfile } from './features/profile/profile.storage';
import type { LocalProfile } from './features/profile/profile.storage';
import Shop from './features/shop/Shop';
import { useWallet } from './features/shop/useWallet';
import { formatCoins } from './features/shop/shop.catalog';
import type { ShopCategory } from './features/shop/shop.catalog';
import FramedAvatar from './features/frames/FramedAvatar';

type IconName = 'home' | 'calendar' | 'focus' | 'social' | 'profile' | 'shop';

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    home: 'm3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9',
    calendar: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z',
    focus:
      'M9 2h6m-3 4v2m0 4v4l3 2M19 6l2 2M12 6a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z',
    social:
      'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 0a4 4 0 0 1 0 8',
    shop: 'M3 9l2-6h14l2 6M3 9v3a3 3 0 0 0 5 2 3 3 0 0 0 4 0 3 3 0 0 0 4 0 3 3 0 0 0 5-2V9M5 15v6h14v-6M9 21v-5h6v5M3 9h18',
    profile: 'M20 21a8 8 0 0 0-16 0M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  };

  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

const navigation: { name: IconName; label: string }[] = [
  { name: 'home', label: 'Inicio' },
  { name: 'calendar', label: 'Agenda' },
  { name: 'focus', label: 'Focus' },
  { name: 'social', label: 'Social' },
  { name: 'shop', label: 'Tienda' },
  { name: 'profile', label: 'Perfil' },
];

const initialGoals = [
  {
    id: 1,
    subject: 'Biología',
    title: 'Repasar la célula',
    detail: 'Tema 3 · Repaso de conceptos',
    duration: '45 min',
    color: 'mint',
    done: true,
  },
  {
    id: 2,
    subject: 'Matemáticas',
    title: 'Un poquito de integrales',
    detail: 'Tema 5 · Ejercicios prácticos',
    duration: '50 min',
    color: 'peach',
    done: false,
  },
  {
    id: 3,
    subject: 'Historia',
    title: 'Ordenar mis apuntes',
    detail: 'Tema 2 · Revolución industrial',
    duration: '25 min',
    color: 'lavender',
    done: false,
  },
];

export default function App() {
  const [goals, setGoals] = useState(initialGoals);
  const [notice, setNotice] = useState('');
  const [sessionToReview, setSessionToReview] = useState<StudySession | null>(null);
  const [activePage, setActivePage] = useState<'home' | 'calendar' | 'focus' | 'profile' | 'shop'>('home');

  const wallet = useWallet();
  const [shopCategory, setShopCategory] = useState<ShopCategory>('coins');

  function openCoinShop() {
    setShopCategory('coins');
    setActivePage('shop');
    setNotice('');
    document.getElementById('inicio')?.focus();
  }

  const [profileState, setProfileState] = useState(readProfile);
  const profile = profileState.profile;

  useEffect(() => {
    const refresh = (event: StorageEvent) => {
      if (event.key === 'studonium.profile.v1' || event.key === null) setProfileState(readProfile());
    };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  function saveLocalProfile(next: LocalProfile): boolean {
    if (readProfile().error) return false;
    try {
      writeProfile(next);
      setProfileState({ profile: next, error: '' });
      return true;
    } catch {
      return false;
    }
  }

  function openFramesInventory() {
    setActivePage('profile');
    setNotice('');
    window.requestAnimationFrame(() => {
      const inventory = document.getElementById('profile-frames-inventory');
      inventory?.focus({ preventScroll: true });
      inventory?.scrollIntoView({ block: 'start' });
    });
  }

  function openFocus() {
    setActivePage('focus');
    setNotice('');
    document.getElementById('inicio')?.focus();
  }

  const completed = goals.filter((goal) => goal.done).length;

  function toggleGoal(id: number) {
    setGoals((current) =>
      current.map((goal) =>
        goal.id === id ? { ...goal, done: !goal.done } : goal
      )
    );
  }

  function showUpcoming(label: string) {
    setNotice(
      `${label} llegará próximamente. Por ahora puedes explorar Inicio y marcar tus objetivos de ejemplo.`
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" aria-label="Studonium, inicio">
          <span className="brand-symbol" aria-hidden="true">
            ✳
          </span>
          studonium<span className="brand-dot">.</span>
        </a>

        <p className="sidebar-label">TU PEQUEÑO UNIVERSO</p>

        <nav className="navigation" aria-label="Navegación principal">
          {navigation.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`nav-item ${item.name === activePage ? 'active' : ''}`}
              aria-label={item.label}
              aria-current={item.name === activePage ? 'page' : undefined}
              onClick={() => {
                if (item.name === 'home' || item.name === 'calendar' || item.name === 'focus' || item.name === 'profile' || item.name === 'shop') {
                  setActivePage(item.name);
                  setNotice('');
                  document.getElementById('inicio')?.focus();
                } else {
                  showUpcoming(item.label);
                }
              }}
            >
              <Icon name={item.name} />
              <span>{item.label}</span>
              {item.name === 'social' && <span className="soon-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          <span aria-hidden="true">✧</span>
          <p>Los grandes sueños empiezan con pequeños pasos.</p>
          <span className="note-signature">A tu ritmo, siempre.</span>
        </div>

        <div className="sidebar-footer">
          <span className="little-flower" aria-hidden="true">
            ✿
          </span>
          Hecho para tu manera de estudiar
        </div>
      </aside>

      <main id="inicio" className="main-content" tabIndex={-1}>
        <header className="topbar">
          <span className="page-label">
            {activePage === 'home'
              ? 'Tu espacio de estudio'
              : activePage === 'calendar' ? 'Tu agenda personal' : activePage === 'profile' ? 'Tu pequeño universo' : activePage === 'shop' ? 'Tu tienda Studonium' : 'Tu espacio de concentración'}
          </span>
          <div className="user-area">
            <div className="studonium-wallet">
              <span className="studonium-wallet-value" aria-label={wallet.balance === null ? 'Saldo no disponible' : `${wallet.balance} monedas`}>{wallet.balance === null ? '—' : formatCoins(wallet.balance)}</span>
              <button type="button" className="studonium-wallet-add" aria-label="Comprar monedas" title="Comprar monedas" onClick={openCoinShop}>＋</button>
            </div>
            <span className="demo-tag">{activePage === 'home' ? 'Vista de ejemplo' : 'Modo local'}</span>
            <button
              className={`avatar studonium-profile-topbar-avatar ${wallet.equippedFrameId ? 'has-frame' : ''}`}
              type="button"
              aria-label={`Abrir perfil de ${profile.displayName}`}
              onClick={() => { setActivePage('profile'); setNotice(''); document.getElementById('inicio')?.focus(); }}
            >
              <FramedAvatar src={profile.avatar} name={profile.displayName} frameId={wallet.equippedFrameId} decorative />
            </button>
          </div>
        </header>
        <CalendarReminders />
        {activePage === 'shop' && <Shop category={shopCategory} onCategoryChange={setShopCategory} wallet={wallet} profile={profile} onOpenInventory={openFramesInventory} />}
        {activePage === 'profile' && <Profile profile={profile} storageWarning={profileState.error} onSave={saveLocalProfile} onOpenFocus={openFocus} wallet={wallet} />}
        {activePage === 'calendar' && <Calendar />}
        <div hidden={activePage !== 'focus'}>
          <Focus onSessionCompleted={setSessionToReview} />
        </div>

        <div hidden={activePage !== 'home'}>
          <section className="greeting" aria-labelledby="greeting-title">
            <div>
              <p className="eyebrow">UN RATITO PARA TI Y TUS METAS</p>
              <h1 id="greeting-title">
                Hola, {profile.displayName}{' '}
                <span className="wave" aria-hidden="true">
                  ✦
                </span>
              </h1>
              <p>Hoy también cuenta. Vamos paso a paso.</p>
            </div>
            <span className="mood-pill">
              <span aria-hidden="true">☀</span> Modo: puedo con esto
            </span>
          </section>

          <section className="hero-card" aria-labelledby="hero-title">
            <div className="hero-copy">
              <span className="hero-label">MENOS AGOBIO, MÁS A TU RITMO</span>
              <h2 id="hero-title">
                Tu próxima gran idea
                <br />
                empieza con una pausa
                <br />
                <span>para concentrarte.</span>
              </h2>
              <p>Un objetivo, un poquito de calma y tú. Lo tienes.</p>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setActivePage('focus');
                  setNotice('');
                  document.getElementById('inicio')?.focus();
                }}
              >
                <Icon name="focus" />
                Empezar concentración
                <span aria-hidden="true">↗</span>
              </button>
            </div>

            <div className="hero-art" aria-hidden="true">
              <span className="art-spark spark-one">✦</span>
              <span className="art-spark spark-two">✧</span>
              <span className="art-orbit" />
              <div className="art-note">
                one thing
                <br />
                at a time ♡
              </div>
              <div className="book book-back" />
              <div className="book book-front">
                <span className="book-title">
                  my little
                  <br />
                  big plans
                </span>
                <span className="book-flower">✳</span>
                <span className="book-lines" />
              </div>
              <div className="art-sticker">you got this!</div>
            </div>
          </section>

          <section className="summary-grid" aria-label="Tu resumen de estudio">
            <article className="card study-card">
              <div className="card-heading">
                <span className="icon-badge lavender">
                  <Icon name="focus" />
                </span>
                <span className="small-label">TU TIEMPO DE HOY</span>
                <span className="tiny-star" aria-hidden="true">
                  ✦
                </span>
              </div>
              <div className="study-total">
                <strong>
                  1 h 30 <span>min</span>
                </strong>
                <span>de 2 h previstas</span>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-label="Tiempo estudiado hoy, ejemplo"
                aria-valuemin={0}
                aria-valuemax={120}
                aria-valuenow={90}
                aria-valuetext="1 hora y 30 minutos de 2 horas"
              >
                <span className="progress-fill" />
              </div>
              <p className="card-footnote">
                <span>¡Ya llevas el 75 %!</span>
                <span>Un paso más cerca ♡</span>
              </p>
            </article>

            <article className="card exam-card">
              <div className="card-heading">
                <span className="icon-badge peach">
                  <Icon name="calendar" />
                </span>
                <span className="small-label">PRÓXIMO EXAMEN</span>
              </div>
              <div className="exam-content">
                <div>
                  <h2>Biología celular</h2>
                  <p>Viernes · 20 de noviembre de 2026</p>
                  <span className="subject-tag">Biología</span>
                </div>
                <div className="days-badge">
                  <strong>6</strong>
                  <span>días</span>
                </div>
              </div>
              <p className="exam-caption">Fecha y cuenta atrás de ejemplo.</p>
            </article>
          </section>

          <div className="bottom-grid">
            <section className="card goals-card" aria-labelledby="goals-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">POCO A POCO, LO CONSIGUES</p>
                  <h2 id="goals-title">
                    Tus objetivos de hoy <span>✏️</span>
                  </h2>
                </div>
                <span className="count-pill">
                  {completed}/{goals.length}
                </span>
              </div>

              <ul className="goals-list">
                {goals.map((goal) => (
                  <li
                    key={goal.id}
                    className={goal.done ? 'goal is-done' : 'goal'}
                  >
                    <label className="goal-label">
                      <input
                        type="checkbox"
                        checked={goal.done}
                        onChange={() => toggleGoal(goal.id)}
                      />
                      <span className="goal-copy">
                        <span className={`goal-subject ${goal.color}`}>
                          {goal.subject}
                        </span>
                        <span className="goal-title">{goal.title}</span>
                        <span className="goal-detail">{goal.detail}</span>
                      </span>
                      <span className="goal-duration">{goal.duration}</span>
                    </label>
                  </li>
                ))}
              </ul>

              <p className="goals-footer" aria-live="polite">
                {completed === goals.length
                  ? '¡Todos los objetivos marcados! Te mereces un descanso. ✨'
                  : `${completed} de ${goals.length} objetivos marcados. Cada pequeño paso suma.`}
              </p>
            </section>

            <section className="rewards-card" aria-labelledby="rewards-title">
              <span className="coming-label">PRÓXIMAMENTE</span>
              <div className="reward-art" aria-hidden="true">
                <span className="reward-spark left">✧</span>
                <div className="coin coin-small">✦</div>
                <div className="coin coin-main">✦</div>
                <span className="reward-spark right">✦</span>
              </div>
              <h2 id="rewards-title">
                Tu esfuerzo tendrá
                <br />
                su lado mágico.
              </h2>
              <p>Pequeños logros, nuevas recompensas y un universo muy tuyo.</p>
              <span className="reward-caption">
                Monedas · Mascotas · Personalización
              </span>
            </section>
          </div>

          <footer className="page-footer">
            <span>
              Estás construyendo algo bonito. También cuando descansas.
            </span>
            <span>STUDONIUM · PRIMER BOCETO</span>
          </footer>
        </div>
      </main>

      {sessionToReview && <SessionReview key={sessionToReview.id} session={sessionToReview} onFinished={(published) => {
        setSessionToReview(null);
        if (published) setActivePage('profile');
        setNotice(published ? 'Tu sesión ya aparece en la actividad de tu perfil.' : 'Sesión guardada sin publicar. Tu tiempo y tus estadísticas ya están actualizados.');
        window.requestAnimationFrame(() => document.getElementById('inicio')?.focus());
      }} />}

      {notice && (
        <div className="notice">
          <p role="status">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice('')}
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

