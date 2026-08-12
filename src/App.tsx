import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { questions } from './data/questions';

type SpeakerStatus = 'waiting' | 'speaking' | 'buffer' | 'completed';
type Route = '/' | '/questions' | '/speakers' | '/voting';

interface Selection {
  id: string;
  participantName: string;
  questionId: number;
  selectedAt: string;
  speakingOrder: number;
  status: SpeakerStatus;
}

interface TimerState {
  speakerId: string | null;
  phase: 'idle' | 'speaking' | 'buffer' | 'paused' | 'done';
  endAt: number | null;
  remainingMs: number;
  previousPhase: 'speaking' | 'buffer' | null;
}

interface SessionState {
  selections: Selection[];
  votes: Record<string, string[]>;
  speakingSeconds: number;
  bufferSeconds: number;
  timer: TimerState;
  glitch: { active: boolean; word: string };
  resultsRevealed: boolean;
}

const STORAGE_KEY = 'alien-tourist-earth-101';
const defaultSession: SessionState = {
  selections: [],
  votes: {},
  speakingSeconds: 120,
  bufferSeconds: 30,
  timer: { speakerId: null, phase: 'idle', endAt: null, remainingMs: 120000, previousPhase: null },
  glitch: { active: false, word: '' },
  resultsRevealed: false,
};

const routes: Route[] = ['/', '/questions', '/speakers', '/voting'];
const presetWords = ['rain', 'water', 'phone', 'internet', 'money', 'human'];

function loadSession(): SessionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultSession, ...JSON.parse(raw) } : defaultSession;
  } catch {
    return defaultSession;
  }
}

function formatMs(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60).toString().padStart(2, '0');
  const seconds = (total % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function timeOnly(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function voteCount(session: SessionState, speakerId: string) {
  return Object.values(session.votes).filter((speakerIds) => speakerIds.includes(speakerId)).length;
}

function App() {
  const [route, setRoute] = useState<Route>(() => {
    const path = window.location.pathname as Route;
    return routes.includes(path) ? path : '/';
  });
  const [session, setSession] = useState<SessionState>(loadSession);
  const [now, setNow] = useState(Date.now());
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    const onPop = () => setRoute((routes.includes(window.location.pathname as Route) ? window.location.pathname : '/') as Route);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const timer = session.timer;
    if (!timer.endAt || !timer.speakerId || (timer.phase !== 'speaking' && timer.phase !== 'buffer')) return;
    if (timer.endAt > now) return;

    if (timer.phase === 'speaking') {
      setSession((current) => ({
        ...current,
        selections: current.selections.map((item) => item.id === timer.speakerId ? { ...item, status: 'buffer' } : item),
        timer: {
          speakerId: timer.speakerId,
          phase: 'buffer',
          endAt: current.bufferSeconds > 0 ? Date.now() + current.bufferSeconds * 1000 : Date.now(),
          remainingMs: current.bufferSeconds * 1000,
          previousPhase: null,
        },
      }));
      return;
    }

    setSession((current) => ({
      ...current,
      selections: current.selections.map((item) => item.id === timer.speakerId ? { ...item, status: 'completed' } : item),
      timer: { ...defaultSession.timer, phase: 'done', speakerId: timer.speakerId, remainingMs: 0 },
      glitch: { active: false, word: '' },
    }));
  }, [now, session.timer, session.bufferSeconds]);

  const navigate = (next: Route) => {
    window.history.pushState(null, '', next);
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateSession = (updater: (current: SessionState) => SessionState) => setSession(updater);
  const currentSpeaker = session.selections.find((item) => item.id === session.timer.speakerId)
    ?? session.selections.find((item) => item.status === 'speaking' || item.status === 'buffer')
    ?? session.selections.find((item) => item.status === 'waiting')
    ?? session.selections[0];

  return (
    <div className="app-shell">
      <header className="top-nav">
        <button className="brand" type="button" onClick={() => navigate('/')}>ALIEN TOURIST</button>
        <nav className="nav-links" aria-label="Main navigation">
          {routes.map((item) => (
            <button className={route === item ? 'active' : ''} key={item} type="button" onClick={() => navigate(item)}>
              {item === '/' ? 'Rules' : item.slice(1)[0].toUpperCase() + item.slice(2)}
            </button>
          ))}
        </nav>
        <button className="danger ghost" type="button" onClick={() => setResetOpen(true)}>RESET SESSION</button>
      </header>

      <main>
        {route === '/' && <RulesPage navigate={navigate} />}
        {route === '/questions' && <QuestionsPage session={session} updateSession={updateSession} />}
        {route === '/speakers' && (
          <SpeakersPage
            currentSpeaker={currentSpeaker}
            now={now}
            session={session}
            updateSession={updateSession}
          />
        )}
        {route === '/voting' && <VotingPage session={session} updateSession={updateSession} />}
      </main>

      {resetOpen && (
        <ConfirmDialog
          title="Reset session?"
          text="This will remove all participant selections, speaker order, votes, timer progress, and session data."
          confirm="Reset Everything"
          onCancel={() => setResetOpen(false)}
          onConfirm={() => {
            setSession(defaultSession);
            localStorage.removeItem(STORAGE_KEY);
            setResetOpen(false);
          }}
        />
      )}
    </div>
  );
}

function RulesPage({ navigate }: { navigate: (route: Route) => void }) {
  return (
    <section className="page rules-page">
      <div className="hero-panel">
        <p className="eyebrow">EARTH 101 MISSION BRIEF</p>
        <h1>The Alien Tourist - Earth 101</h1>
        <p className="subtitle">Explain Earth to someone who has never seen it.</p>
        <p>An alien has landed on Earth. Unfortunately, it understands absolutely nothing about humans.</p>
        <p>Your job is to explain Earth, humans, and our strange habits without assuming the alien knows anything.</p>
        <button className="primary big" type="button" onClick={() => navigate('/questions')}>START THE ALIEN TOUR</button>
      </div>

      <div className="two-column">
        <article className="glass">
          <h2>Speaking Rules</h2>
          <ol>
            <li>Each participant gets <strong>2 minutes</strong>.</li>
            <li>Explain the topic as if your listener knows absolutely nothing about Earth.</li>
            <li>Use simple language, analogies, examples, and humor.</li>
            <li>Stay on topic, keep going after mistakes, and think quickly when challenged.</li>
            <li><strong>Explain like you are talking to an alien.</strong></li>
          </ol>
        </article>
        <article className="glass alert">
          <h2>Translation Glitch</h2>
          <p>During a speech, the facilitator may suddenly ban an important word.</p>
          <blockquote>You are explaining an umbrella. You can no longer use the word <strong>RAIN</strong>.</blockquote>
          <p>No restarting. No changing topic. Just improvise.</p>
        </article>
      </div>

      <div className="stats-row">
        <div><span>Speaking Time</span><strong>02:00</strong></div>
        <div><span>Default Buffer</span><strong>00:30</strong></div>
      </div>
      <p className="muted centered">Speakers have two minutes of speaking time. After that, a configurable buffer period begins.</p>
    </section>
  );
}

function QuestionsPage({ session, updateSession }: { session: SessionState; updateSession: (updater: (current: SessionState) => SessionState) => void }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const selectedQuestion = questions.find((question) => question.id === selectedId);
  const takenIds = new Set(session.selections.map((item) => item.questionId));

  const confirm = () => {
    setError('');
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name.');
      return;
    }
    updateSession((current) => {
      if (current.selections.some((item) => item.questionId === selectedId)) {
        setError('Oops! This question has already been taken. Please choose another number.');
        return current;
      }
      if (current.selections.some((item) => item.participantName.toLowerCase() === trimmed.toLowerCase())) {
        setError('This participant has already selected a question.');
        return current;
      }
      const selection: Selection = {
        id: `selection-${Date.now()}`,
        participantName: trimmed,
        questionId: selectedId!,
        selectedAt: new Date().toISOString(),
        speakingOrder: current.selections.length + 1,
        status: 'waiting',
      };
      setSelectedId(null);
      setName('');
      return { ...current, selections: [...current.selections, selection] };
    });
  };

  return (
    <section className="page">
      <div className="section-heading">
        <p className="eyebrow">CHOOSE YOUR DESTINY</p>
        <h1>Pick one number to discover your alien challenge.</h1>
      </div>
      <div className="question-grid">
        {questions.map((question) => {
          const taken = takenIds.has(question.id);
          return (
            <button className={`question-card ${taken ? 'taken' : ''}`} disabled={taken} key={question.id} type="button" onClick={() => setSelectedId(question.id)}>
              <strong>#{question.id.toString().padStart(2, '0')}</strong>
              <span>{taken ? 'TAKEN' : 'AVAILABLE'}</span>
            </button>
          );
        })}
      </div>

      {selectedQuestion && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>QUESTION #{selectedQuestion.id.toString().padStart(2, '0')}</h2>
            <h3>{selectedQuestion.title}</h3>
            <p>{selectedQuestion.text}</p>
            <label>
              Your Name
              <input value={name} onChange={(event) => setName(event.target.value)} autoFocus />
            </label>
            {error && <p className="error">{error}</p>}
            <div className="button-row">
              <button className="primary" type="button" onClick={confirm}>Confirm Selection</button>
              <button className="ghost" type="button" onClick={() => { setSelectedId(null); setError(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function SpeakersPage({ currentSpeaker, now, session, updateSession }: { currentSpeaker?: Selection; now: number; session: SessionState; updateSession: (updater: (current: SessionState) => SessionState) => void }) {
  const [restartOpen, setRestartOpen] = useState(false);
  const [customWord, setCustomWord] = useState('');
  const remaining = session.timer.endAt ? Math.max(0, session.timer.endAt - now) : session.timer.remainingMs;
  const activeQuestion = questions.find((question) => question.id === currentSpeaker?.questionId);

  const startSpeaker = (speaker?: Selection) => {
    if (!speaker) return;
    updateSession((current) => ({
      ...current,
      selections: current.selections.map((item) => item.id === speaker.id ? { ...item, status: 'speaking' } : item),
      timer: { speakerId: speaker.id, phase: 'speaking', endAt: Date.now() + current.speakingSeconds * 1000, remainingMs: current.speakingSeconds * 1000, previousPhase: null },
    }));
  };

  return (
    <section className="page">
      <div className="speaker-layout">
        <article className="glass current-panel">
          <p className="eyebrow">NOW SPEAKING</p>
          <h1>{currentSpeaker?.participantName ?? 'No speaker yet'}</h1>
          {currentSpeaker ? (
            <>
              <h2>Question #{currentSpeaker.questionId.toString().padStart(2, '0')}</h2>
              <p className="facilitator-question">{activeQuestion?.text}</p>
              <div className={`timer ${session.timer.phase}`}>{formatMs(remaining)}</div>
              {session.timer.phase === 'buffer' && <p className="buffer-label">BUFFER TIME</p>}
              <div className="button-row centered">
                {session.timer.phase === 'idle' || currentSpeaker.status === 'waiting' ? <button className="primary" type="button" onClick={() => startSpeaker(currentSpeaker)}>Start</button> : null}
                {session.timer.phase === 'speaking' ? <button className="ghost" type="button" onClick={() => updateSession((c) => ({ ...c, timer: { ...c.timer, phase: 'paused', endAt: null, remainingMs: remaining, previousPhase: 'speaking' } }))}>Pause</button> : null}
                {session.timer.phase === 'paused' ? <button className="primary" type="button" onClick={() => updateSession((c) => ({ ...c, timer: { ...c.timer, phase: c.timer.previousPhase ?? 'speaking', endAt: Date.now() + c.timer.remainingMs } }))}>Resume</button> : null}
                {session.timer.phase === 'buffer' ? <button className="primary" type="button" onClick={() => updateSession((c) => ({ ...c, selections: c.selections.map((i) => i.id === currentSpeaker.id ? { ...i, status: 'completed' } : i), timer: { ...defaultSession.timer, phase: 'done', speakerId: currentSpeaker.id, remainingMs: 0 } }))}>End Speaker</button> : null}
                <button className="ghost" type="button" onClick={() => setRestartOpen(true)}>Restart</button>
                {currentSpeaker.status === 'completed' || session.timer.phase === 'done' ? <button className="primary" type="button" onClick={() => startSpeaker(session.selections.find((item) => item.status === 'waiting'))}>Start Next Speaker</button> : null}
              </div>
            </>
          ) : <p>No speakers yet. Participants need to select their questions first.</p>}
        </article>

        <aside className="glass">
          <h2>Timer Settings</h2>
          <label>Speaking Time <input type="number" min="1" value={session.speakingSeconds / 60} onChange={(e) => updateSession((c) => ({ ...c, speakingSeconds: Number(e.target.value) * 60, timer: c.timer.phase === 'idle' ? { ...c.timer, remainingMs: Number(e.target.value) * 60000 } : c.timer }))} /> minutes</label>
          <label>Buffer Time <select value={session.bufferSeconds} onChange={(e) => updateSession((c) => ({ ...c, bufferSeconds: Number(e.target.value) }))}>{[0, 15, 30, 45, 60].map((value) => <option key={value} value={value}>{value} seconds</option>)}</select></label>
          <TranslationGlitch session={session} updateSession={updateSession} customWord={customWord} setCustomWord={setCustomWord} />
        </aside>
      </div>

      <section className="glass">
        <h2>Speaker Order</h2>
        {session.selections.length === 0 ? <p>No speakers yet. Participants need to select their questions first.</p> : (
          <div className="speaker-list">
            {session.selections.map((speaker) => (
              <div className="speaker-row" key={speaker.id}>
                <strong>#{speaker.speakingOrder} {speaker.participantName}</strong>
                <span>Question #{speaker.questionId.toString().padStart(2, '0')}</span>
                <span>Selected: {timeOnly(speaker.selectedAt)}</span>
                <span className={`status ${speaker.status}`}>{speaker.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {restartOpen && currentSpeaker && (
        <ConfirmDialog
          title="Restart timer?"
          text="Are you sure you want to restart this speaker's timer?"
          confirm="Restart Timer"
          onCancel={() => setRestartOpen(false)}
          onConfirm={() => {
            startSpeaker(currentSpeaker);
            setRestartOpen(false);
          }}
        />
      )}
    </section>
  );
}

function TranslationGlitch({ session, updateSession, customWord, setCustomWord }: { session: SessionState; updateSession: (updater: (current: SessionState) => SessionState) => void; customWord: string; setCustomWord: (value: string) => void }) {
  const activate = (word: string) => {
    const clean = word.trim();
    if (clean) updateSession((current) => ({ ...current, glitch: { active: true, word: clean.toUpperCase() } }));
  };
  return (
    <div className="glitch-box">
      <h2>TRANSLATION GLITCH</h2>
      {session.glitch.active ? (
        <>
          <p>BANNED WORD</p>
          <strong className="banned">"{session.glitch.word}"</strong>
          <button className="ghost" type="button" onClick={() => updateSession((c) => ({ ...c, glitch: { active: false, word: '' } }))}>Deactivate Glitch</button>
        </>
      ) : (
        <>
          <div className="word-grid">{presetWords.map((word) => <button className="ghost" key={word} type="button" onClick={() => activate(word)}>{word}</button>)}</div>
          <label>Custom word <input value={customWord} onChange={(event) => setCustomWord(event.target.value)} /></label>
          <button className="primary" type="button" onClick={() => activate(customWord)}>Activate Glitch</button>
        </>
      )}
    </div>
  );
}

function VotingPage({ session, updateSession }: { session: SessionState; updateSession: (updater: (current: SessionState) => SessionState) => void }) {
  const [voter, setVoter] = useState('');
  const [message, setMessage] = useState('');
  const completed = session.selections.filter((item) => item.status === 'completed');
  const ranking = useMemo(() => [...completed].sort((a, b) => voteCount(session, b.id) - voteCount(session, a.id)), [completed, session]);
  const winner = ranking[0];

  const recordVote = (speaker: Selection) => {
    setMessage('');
    if (speaker.participantName === voter) {
      setMessage('You cannot vote for yourself.');
      return;
    }
    updateSession((current) => {
      const existing = current.votes[voter] ?? [];
      if (existing.includes(speaker.id)) return current;
      return { ...current, votes: { ...current.votes, [voter]: [...existing, speaker.id] } };
    });
    setMessage('Vote Recorded');
  };

  return (
    <section className="page">
      <div className="section-heading">
        <p className="eyebrow">ALIEN TOURIST VOTING</p>
        <h1>Vote for completed speakers.</h1>
      </div>
      {completed.length === 0 ? <p className="glass">Voting will become available after participants complete their speeches.</p> : (
        <>
          <label className="voter-select">Who are you?
            <select value={voter} onChange={(event) => setVoter(event.target.value)}>
              <option value="">Select your name</option>
              {session.selections.map((item) => <option key={item.id} value={item.participantName}>{item.participantName}</option>)}
            </select>
          </label>
          {message && <p className={message.includes('cannot') ? 'error' : 'success'}>{message}</p>}
          <div className="voting-grid">
            {completed.map((speaker) => {
              const already = (session.votes[voter] ?? []).includes(speaker.id);
              return (
                <article className="glass voting-card" key={speaker.id}>
                  <p className="eyebrow">#{speaker.speakingOrder}</p>
                  <h2>{speaker.participantName}</h2>
                  <p>Question #{speaker.questionId.toString().padStart(2, '0')}</p>
                  <strong>{voteCount(session, speaker.id)} Votes</strong>
                  <button className="primary" type="button" disabled={!voter || already} onClick={() => recordVote(speaker)}>{already ? 'Vote Recorded' : 'Vote'}</button>
                </article>
              );
            })}
          </div>
          <Leaderboard ranking={ranking} session={session} />
          <button className="primary big" type="button" onClick={() => updateSession((c) => ({ ...c, resultsRevealed: true }))}>Reveal Results</button>
          {session.resultsRevealed && winner && (
            <section className="results">
              <p className="eyebrow">EARTH 101 RESULTS</p>
              <h1>ALIEN WHISPERER</h1>
              <h2>{winner.participantName}</h2>
              <strong>{voteCount(session, winner.id)} VOTES</strong>
              <p>Congratulations! The aliens officially understand you.</p>
              <Leaderboard ranking={ranking} session={session} />
            </section>
          )}
        </>
      )}
    </section>
  );
}

function Leaderboard({ ranking, session }: { ranking: Selection[]; session: SessionState }) {
  return (
    <section className="glass leaderboard">
      <h2>Alien Tourist Leaderboard</h2>
      {ranking.map((speaker, index) => <p key={speaker.id}><span>{index < 3 ? ['1.', '2.', '3.'][index] : `${index + 1}.`}</span> {speaker.participantName} <strong>{voteCount(session, speaker.id)} votes</strong></p>)}
    </section>
  );
}

function ConfirmDialog({ title, text, confirm, onCancel, onConfirm }: { title: string; text: string; confirm: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-backdrop">
      <div className="modal confirm">
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="button-row">
          <button className="ghost" type="button" onClick={onCancel}>Cancel</button>
          <button className="danger" type="button" onClick={onConfirm}>{confirm}</button>
        </div>
      </div>
    </div>
  );
}

export default App;
