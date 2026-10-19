
'use client';

import React, { useState, useContext, createContext, ReactNode, FC, useEffect } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, BarChart, Calendar, Dumbbell, Zap, Wind, Bot, Send, CheckCircle, Flame, UsersRound, 
    Award, Star, TrendingUp, Sparkles, Trophy 
} from 'lucide-react';

// --- 1. TYPE DEFINITIONS ---
type Role = 'trainer' | 'client';

interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  completed?: boolean;
}

interface Workout {
  id: string;
  clientId: string;
  focus: string;
  exercises: Exercise[];
}

interface Feedback {
  id: string;
  clientId: string;
  clientName: string;
  rpe: number;
  soreness: number;
  energy: number;
  mood: number;
  notes: string;
  timestamp: string;
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: ReactNode;
}

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  releasedWorkout: Workout | null;
  setReleasedWorkout: (workout: Workout | null) => void;
  feedbackLog: Feedback[];
  addFeedback: (feedback: Omit<Feedback, 'id' | 'timestamp'>) => void;
  xp: number;
  level: number;
  streak: number;
  unlockedAchievements: string[];
}

// --- 2. MOCK DATA & GAME CONFIG ---
const clients = [
  { id: '1', name: 'Max' },
  { id: '2', name: 'Lisa' },
];

const XP_PER_WORKOUT = 100;
const XP_PER_LEVEL_BASE = 250;

const allAchievements: { [key: string]: Achievement } = {
    'FIRST_WORKOUT': { id: 'FIRST_WORKOUT', name: 'Warm-Up', description: 'Erstes Workout abgeschlossen!', icon: <Flame className="w-8 h-8" /> },
    'HIIT_MASTER': { id: 'HIIT_MASTER', name: 'Herzrasen', description: 'Erstes HIIT-Workout gemeistert!', icon: <Zap className="w-8 h-8" /> },
    'STRENGTH_STARTER': { id: 'STRENGTH_STARTER', name: 'Eisenbieger', description: 'Erstes Kraft-Workout geschafft!', icon: <Dumbbell className="w-8 h-8" /> },
    'FIVE_STREAK': { id: 'FIVE_STREAK', name: 'Dauerbrenner', description: '5 Workouts in Folge!', icon: <TrendingUp className="w-8 h-8" /> },
};

const exerciseDictionary: { [key: string]: Omit<Exercise, 'id' | 'completed'>[] } = {
  kraft: [
    { name: 'Kniebeugen mit Langhantel', sets: '4', reps: '8-10', rest: '90s' },
    { name: 'Bankdrücken', sets: '4', reps: '8-10', rest: '90s' },
    { name: 'Klimmzüge (unterstützt)', sets: '3', reps: 'bis zum Versagen', rest: '60s' },
  ],
  hiit: [
    { name: 'Burpees', sets: '5', reps: '45s Arbeit', rest: '15s' },
    { name: 'Kettlebell Swings', sets: '5', reps: '45s Arbeit', rest: '15s' },
    { name: 'Seilspringen', sets: '5', reps: '45s Arbeit', rest: '15s' },
  ],
  regeneration: [
    { name: 'Katze-Kuh-Dehnung', sets: '3', reps: '10 Wiederholungen', rest: '30s' },
    { name: 'Dehnung der Oberschenkelrückseite', sets: '2', reps: '30s pro Seite', rest: '30s' },
    { name: 'Foam Rolling (Ganzkörper)', sets: '1', reps: '10 Minuten', rest: '0s' },
  ],
};

// --- 3. APP CONTEXT FOR GLOBAL STATE ---
const AppContext = createContext<AppContextType | null>(null);

const AppProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('trainer');
  const [releasedWorkout, setReleasedWorkout] = useState<Workout | null>(null);
  const [feedbackLog, setFeedbackLog] = useState<Feedback[]>([]);
  
  // Gamification State
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(50);
  const [streak, setStreak] = useState(2);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [justUnlocked, setJustUnlocked] = useState<Achievement | null>(null);
  const [levelUp, setLevelUp] = useState(false);

  const xpForNextLevel = level * XP_PER_LEVEL_BASE;

  const addFeedback = (feedback: Omit<Feedback, 'id' | 'timestamp'>) => {
    const newFeedback: Feedback = {
      ...feedback,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    };
    setFeedbackLog(prev => [newFeedback, ...prev]);

    // --- Gamification Logic ---
    const newXp = xp + XP_PER_WORKOUT;
    setStreak(prev => prev + 1);

    if (newXp >= xpForNextLevel) {
        setLevel(prev => prev + 1);
        setXp(newXp - xpForNextLevel);
        setLevelUp(true);
        setTimeout(() => setLevelUp(false), 3000);
    } else {
        setXp(newXp);
    }
    
    // Check for achievements
    let unlocked: Achievement | null = null;
    if (unlockedAchievements.length === 0) {
        unlocked = allAchievements['FIRST_WORKOUT'];
    }
    else if (releasedWorkout?.focus === 'hiit' && !unlockedAchievements.includes('HIIT_MASTER')) {
        unlocked = allAchievements['HIIT_MASTER'];
    }
    else if (releasedWorkout?.focus === 'kraft' && !unlockedAchievements.includes('STRENGTH_STARTER')) {
        unlocked = allAchievements['STRENGTH_STARTER'];
    }
    else if (streak + 1 === 5 && !unlockedAchievements.includes('FIVE_STREAK')) {
        unlocked = allAchievements['FIVE_STREAK'];
    }

    if (unlocked && !unlockedAchievements.includes(unlocked.id)) {
        setUnlockedAchievements(prev => [...prev, unlocked!.id]);
        setJustUnlocked(unlocked);
        setTimeout(() => setJustUnlocked(null), 3000);
    }
  };

  const value = { 
      role, setRole, releasedWorkout, setReleasedWorkout, feedbackLog, addFeedback, 
      xp, level, streak, unlockedAchievements 
  };

  return (
    <AppContext.Provider value={value}>
        {children}
        <AnimatePresence>
            {justUnlocked && <AchievementPopup achievement={justUnlocked} />}
            {levelUp && <LevelUpPopup newLevel={level} />}
        </AnimatePresence>
    </AppContext.Provider>
  );
};

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

// --- 4. UI COMPONENTS ---

const LevelUpPopup: FC<{newLevel: number}> = ({ newLevel }) => (
    <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.5 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.5 } }}
        className="fixed bottom-10 right-10 z-50 bg-gradient-to-br from-emerald-500 to-green-600 text-white p-6 rounded-2xl shadow-2xl flex flex-col items-center space-y-2 border-2 border-emerald-300"
    >
        <Trophy className="w-16 h-16 text-yellow-300 drop-shadow-lg" />
        <p className="font-bold text-2xl">LEVEL UP!</p>
        <p className="text-5xl font-bold">{newLevel}</p>
    </motion.div>
);

const AchievementPopup: FC<{achievement: Achievement}> = ({ achievement }) => (
    <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.5 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.5 } }}
        className="fixed bottom-10 right-10 z-50 bg-gradient-to-br from-gray-800 to-black text-white p-6 rounded-2xl shadow-2xl flex items-center space-x-4 border-2 border-primary"
    >
        <div className="text-primary">{React.cloneElement(achievement.icon, { className: "w-12 h-12"})}</div>
        <div>
            <p className="font-bold text-lg">Achievement freigeschaltet!</p>
            <p className="text-text-secondary text-sm">{achievement.name}</p>
        </div>
    </motion.div>
);

const KpiCard: FC<{ icon: ReactNode; title: string; value: string; }> = ({ icon, title, value }) => (
  <div className="bg-card p-6 rounded-2xl shadow-lg border border-white/5 flex items-center space-x-6">
    <div className="bg-gray-900/50 p-4 rounded-xl text-primary">{icon}</div>
    <div>
      <p className="text-sm text-text-secondary font-medium tracking-wide">{title}</p>
      <p className="text-3xl font-bold text-text">{value}</p>
    </div>
  </div>
);

const WorkoutGenerator: FC = () => {
  const { setReleasedWorkout } = useAppContext();
  const [selectedClient, setSelectedClient] = useState(clients[0].id);
  const [focus, setFocus] = useState('kraft');
  const [generatedWorkout, setGeneratedWorkout] = useState<Exercise[] | null>(null);
  const [editedWorkout, setEditedWorkout] = useState('');

  const handleGenerate = () => {
    const baseWorkout = exerciseDictionary[focus] || exerciseDictionary.kraft;
    const workoutWithIds = baseWorkout.map((ex, index) => ({ ...ex, id: `ex-${index}` }));
    setGeneratedWorkout(workoutWithIds);

    // Rebuilding this string creation logic to be more robust.
    let workoutLines: string[] = [];
    workoutWithIds.forEach(ex => {
      const line = `${ex.name}: ${ex.sets} Saetze a ${ex.reps}, ${ex.rest} Pause`;
      workoutLines.push(line);
    });
    const workoutText = workoutLines.join(`\n`);

    setEditedWorkout(workoutText);
  };
  const handleRelease = () => {
    if (!generatedWorkout) return;
    const workoutToRelease: Workout = {
      id: `wod-${Date.now()}`,
      clientId: selectedClient,
      focus: focus,
      exercises: generatedWorkout.map(ex => ({...ex, completed: false})),
    };
    setReleasedWorkout(workoutToRelease);
    alert(`Workout für ${clients.find(c => c.id === selectedClient)?.name} freigegeben!`);
  };

  return (
    <div className="bg-card p-6 rounded-2xl shadow-lg border border-white/5 space-y-6">
        <div className="flex items-center space-x-3"><Bot className="w-6 h-6 text-primary" /><h3 className="text-xl font-bold text-text">KI Workout Konfigurator</h3></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">Kunde</label>
                <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="w-full p-3 bg-background rounded-lg border border-gray-700 text-text focus:ring-2 focus:ring-primary focus:border-primary">
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">Fokus</label>
                <div className="flex space-x-2 bg-background p-1 rounded-lg border border-gray-700"> 
                    {['kraft', 'hiit', 'regeneration'].map(f => (
                        <button key={f} onClick={() => setFocus(f)} className={`flex-1 capitalize py-2 px-3 rounded-md text-sm font-semibold transition-colors ${focus === f ? 'bg-primary text-background shadow-md' : 'text-text-secondary hover:bg-gray-700'}`}>{f}</button>
                    ))}
                </div>
            </div>
        </div>
        <button onClick={handleGenerate} className="w-full flex justify-center items-center space-x-2 bg-gradient-to-r from-primary to-emerald-600 text-background font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5" /><span>WOD generieren</span>
        </button>
        {generatedWorkout && (
            <div className="border-t border-gray-700/50 pt-6 space-y-4">
                <h4 className="font-semibold text-text">Generiertes Workout anpassen</h4>
                <textarea value={editedWorkout} onChange={e => setEditedWorkout(e.target.value)} rows={7} className="w-full p-3 bg-background rounded-lg border border-gray-700 text-text placeholder-text-secondary focus:ring-2 focus:ring-primary" />
                <button onClick={handleRelease} className="w-full bg-gray-600 text-text font-bold py-3 px-4 rounded-lg hover:bg-gray-500 transition-colors">WOD für Kunden freigeben</button>
            </div>
        )}
    </div>
  );
};

const FeedbackFeed: FC = () => {
  const { feedbackLog } = useAppContext();
  return (
    <div className="bg-card p-6 rounded-2xl shadow-lg border border-white/5">
      <h3 className="text-xl font-bold text-text mb-4">Live-Feed: Kundenfeedback</h3>
      <div className="-mx-6 -mb-6"><table className="w-full text-left">
        <thead><tr>
            <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Kunde</th>
            <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">RPE</th>
            <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Notizen</th>
        </tr></thead>
        <tbody>
            {feedbackLog.length === 0 && (<tr><td colSpan={3} className="text-center text-text-secondary py-12">Warte auf erstes Feedback...</td></tr>)}
            {feedbackLog.map(fb => (
              <tr key={fb.id} className="border-t border-gray-700/50 hover:bg-gray-900/50 transition-colors">
                <td className="p-4"><div className='font-semibold text-text'>{fb.clientName}</div><div className='text-xs text-text-secondary'>{fb.timestamp}</div></td>
                <td className="p-4"><span className='bg-primary/20 text-primary font-bold text-sm py-1 px-2 rounded-full'>{fb.rpe}/10</span></td>
                <td className="p-4 text-sm text-text-secondary italic">{fb.notes || '–'}</td>
              </tr>
            ))}
        </tbody>
      </table></div>
    </div>
  );
};

const TrainerDashboard: FC = () => (
  <div className="space-y-10">
    <h2 className="text-4xl font-bold text-text tracking-tight">Trainer Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <KpiCard icon={<Users className="w-7 h-7" />} title="Aktive Kunden" value="2" />
      <KpiCard icon={<BarChart className="w-7 h-7" />} title="Ø RPE-Feedback" value="7.8" />
      <KpiCard icon={<Calendar className="w-7 h-7" />} title="Anstehende Termine" value="4" />
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <WorkoutGenerator />
      <FeedbackFeed />
    </div>
  </div>
);

const ClientHeader: FC = () => {
    const { level, xp, streak } = useAppContext();
    const xpForNextLevel = level * XP_PER_LEVEL_BASE;
    const xpPercentage = (xp / xpForNextLevel) * 100;

    return (
        <div className='bg-card rounded-2xl p-6 border border-white/5 flex justify-between items-center'>
            <div>
                <h2 className="text-3xl font-bold text-text tracking-tight">Dein Dashboard, Max</h2>
                <p className='text-text-secondary'>Level {level}</p>
            </div>
            <div className='flex items-center space-x-6'>
                <div className='text-center'>
                    <p className='font-bold text-2xl text-primary flex items-center'><Flame className='w-6 h-6 mr-1 text-orange-400' /> {streak}</p>
                    <p className='text-xs text-text-secondary uppercase tracking-wider'>Streak</p>
                </div>
                <div className='w-40'>
                    <div className='flex justify-between items-end mb-1'>
                        <p className='text-xs text-text-secondary font-semibold'>XP</p>
                        <p className='text-xs text-primary font-bold'>{xp} / {xpForNextLevel}</p>
                    </div>
                    <div className='w-full bg-background rounded-full h-2 border border-gray-700'>
                        <motion.div className='bg-primary h-full rounded-full' initial={{width: 0}} animate={{width: `${xpPercentage}%`}} />
                    </div>
                </div>
            </div>
        </div>
    )
}

const ClientWorkoutCard: FC = () => {
  const { releasedWorkout, setReleasedWorkout } = useAppContext();
  const handleToggleExercise = (exerciseId: string) => {
    if (!releasedWorkout) return;
    const updatedExercises = releasedWorkout.exercises.map(ex => ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex );
    setReleasedWorkout({ ...releasedWorkout, exercises: updatedExercises });
  };

  if (!releasedWorkout) return <div className="bg-card p-12 rounded-2xl text-center text-text-secondary border border-white/5"><p>Warte, bis dein Coach dir ein Workout freigibt.</p></div>;
  
  return (
    <div className="bg-card p-8 rounded-2xl shadow-lg border border-white/5">
      <h3 className="text-2xl font-bold text-text mb-1">Dein heutiges WOD</h3>
      <p className="capitalize text-primary font-semibold mb-6">Fokus: {releasedWorkout.focus}</p>
      <ul className="space-y-4">
        {releasedWorkout.exercises.map(ex => (
          <li key={ex.id} onClick={() => handleToggleExercise(ex.id)} className={`flex items-center p-4 rounded-xl cursor-pointer transition-all ${ex.completed ? 'bg-background/50' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-4 border-2 transition-all ${ex.completed ? 'border-primary bg-primary' : 'border-gray-500'}`}>
              {ex.completed && <motion.div initial={{scale: 0}} animate={{scale: 1}}><CheckCircle className="w-5 h-5 text-background" /></motion.div>}
            </div>
            <div className="flex-grow"><p className={`font-semibold ${ex.completed ? 'text-text-secondary line-through' : 'text-text'}`}>{ex.name}</p><p className={`text-sm ${ex.completed ? 'text-gray-500' : 'text-text-secondary'}`}>{ex.sets} / {ex.reps} / {ex.rest}</p></div>
          </li>
        ))}
      </ul>
    </div>
  )
}

const FeedbackSlider: FC<{ label: string, value: number, onValueChange: (value: number[]) => void, icon?: ReactNode }> = ({ label, value, onValueChange, icon }) => (
    <div className='space-y-2'>
        <div className='flex justify-between items-center'><label className="flex items-center space-x-2 text-sm font-medium text-text-secondary">{icon}<span>{label}</span></label><span className='font-bold text-primary'>{value}</span></div>
        <Slider.Root defaultValue={[5]} onValueChange={onValueChange} max={10} step={1} className="relative flex items-center select-none touch-none w-full h-5 cursor-pointer">
            <Slider.Track className="bg-background relative grow rounded-full h-1.5 border border-gray-700"><Slider.Range className="absolute bg-gradient-to-r from-primary to-emerald-600 rounded-full h-full" /></Slider.Track>
            <Slider.Thumb className="block w-5 h-5 bg-text rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card" />
        </Slider.Root>
    </div>
);

const ClientFeedbackForm: FC = () => {
  const { addFeedback, releasedWorkout } = useAppContext();
  const [rpe, setRpe] = useState(5);
  const [soreness, setSoreness] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [mood, setMood] = useState(5);
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addFeedback({ clientId: '1', clientName: 'Max', rpe, soreness, energy, mood, notes });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    setRpe(5); setSoreness(5); setEnergy(5); setMood(5); setNotes('');
  };

  if (!releasedWorkout) return null;

  return (
    <div className="bg-card p-8 rounded-2xl shadow-lg relative border border-white/5">
        <AnimatePresence>{showSuccess && (<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-card/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl"><CheckCircle className="w-20 h-20 text-primary" /><p className='mt-4 font-bold text-lg'>Feedback gesendet!</p></motion.div>)}</AnimatePresence>
        <h3 className="text-xl font-bold text-text mb-6">Post-Workout Feedback</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
            <FeedbackSlider label="Anstrengung (RPE)" value={rpe} onValueChange={v => setRpe(v[0])} />
            <FeedbackSlider label="Muskelkater" value={soreness} onValueChange={v => setSoreness(v[0])} />
            <FeedbackSlider label="Energielevel" value={energy} onValueChange={v => setEnergy(v[0])} />
            <FeedbackSlider label="Stimmung" value={mood} onValueChange={v => setMood(v[0])} />
            <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">Notizen für den Coach</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder='Wie hast du dich gefühlt?' className="w-full p-3 bg-background rounded-lg border border-gray-700 text-text placeholder-text-secondary focus:ring-2 focus:ring-primary"/>
            </div>
            <button type="submit" className="w-full flex justify-center items-center space-x-2 bg-gradient-to-r from-primary to-emerald-600 text-background font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                <Send className="w-5 h-5" /><span>Workout beenden & Feedback senden</span>
            </button>
        </form>
    </div>
  )
}

const ClientDashboard: FC = () => (
    <div className="space-y-8">
        <ClientHeader />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
            <ClientWorkoutCard />
            <ClientFeedbackForm />
        </div>
    </div>
);

const Sidebar: FC = () => {
  const { role, setRole } = useAppContext();
  const navItems = [{ name: 'trainer', label: 'Trainer', icon: <Users /> }, { name: 'client', label: 'Kunde', icon: <UsersRound /> }];
  return (
    <aside className="w-20 lg:w-64 bg-background p-4 lg:p-6 flex flex-col border-r border-white/5">
      <div className="flex items-center space-x-2 mb-10">
        <Wind className="w-8 h-8 text-primary flex-shrink-0" />
        <h1 className="text-2xl font-bold text-text hidden lg:block">CoachSync</h1>
      </div>
      <nav className="flex-grow"><ul className="space-y-2">
          {navItems.map(item => (
            <li key={item.name}>
              <button onClick={() => setRole(item.name)} className={`w-full flex items-center justify-center lg:justify-start space-x-3 p-3 rounded-lg font-semibold transition-colors ${role === item.name ? 'bg-primary text-background' : 'text-text-secondary hover:bg-card hover:text-text'}`}>
                {item.icon}
                <span className='hidden lg:inline'>{item.label}</span>
              </button>
            </li>
          ))}
        </ul></nav>
    </aside>
  );
};

const CoachSyncApp: FC = () => {
  const { role } = useAppContext();
  return (
    <div className="min-h-screen flex text-text">
      <Sidebar />
      <main className="flex-grow p-8 lg:p-12 overflow-y-auto"><AnimatePresence mode="wait">
        <motion.div key={role} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} transition={{duration: 0.2}}>
            {role === 'trainer' ? <TrainerDashboard /> : <ClientDashboard />}
        </motion.div>
      </AnimatePresence></main>
    </div>
  );
}

// --- Final Page Component ---
export default function Page() {
  return (
    <AppProvider>
      <CoachSyncApp />
    </AppProvider>
  );
}
