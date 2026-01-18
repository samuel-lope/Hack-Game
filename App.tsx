import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Panel, Button, ProgressBar, Icons } from './components/UI';
import { UserState, ViewState, EntityState, LogEntry, CombatStats } from './types';
import { CONFIG, RANKS, SOFTWARE_DB, HARDWARE_DB, SKILLS_DB, ENEMY_NAMES } from './constants';

// --- UTILS ---
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

const INITIAL_USER: UserState = {
    bits: CONFIG.initialBits,
    xp: 0,
    hardware: { cpu: 0, ram: 0, cooler: 0 },
    skills: { offense: 0, defense: 0 },
    inventory: ['PING', 'INJECT', 'FIREWALL', 'OVERCLOCK'],
    loadout: ['PING', 'INJECT', 'FIREWALL', 'OVERCLOCK'],
    stats: { games: 0, maxLevel: 0 }
};

export default function App() {
    // --- STATE ---
    const [user, setUser] = useState<UserState>(INITIAL_USER);
    const [view, setView] = useState<ViewState>('MENU');
    const [glitch, setGlitch] = useState(false);

    // Session State
    const [level, setLevel] = useState(1);
    const [sessionBits, setSessionBits] = useState(0);
    const [minedBits, setMinedBits] = useState(0);
    const [sessionUpgrades, setSessionUpgrades] = useState({ offense: 0, defense: 0 });

    // Combat State
    const [player, setPlayer] = useState<EntityState>({ hp: 0, maxHp: 0, ap: 0, maxAp: 0, shield: 0, name: 'USER', cooldowns: {} });
    const [enemy, setEnemy] = useState<EntityState>({ hp: 0, maxHp: 0, ap: 0, maxAp: 0, shield: 0, name: 'TARGET', cooldowns: {} });
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [turn, setTurn] = useState(1);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    
    const logsEndRef = useRef<HTMLDivElement>(null);

    // --- INITIALIZATION ---
    useEffect(() => {
        const saved = localStorage.getItem(CONFIG.storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Simple migration check for old save structures
                if (!parsed.skills) parsed.skills = { offense: 0, defense: 0 };
                setUser(parsed);
            } catch (e) {
                console.error("Save corrupted", e);
            }
        }
    }, []);

    useEffect(() => {
        if (view === 'GAME' && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, view]);

    const saveUser = (newData: UserState) => {
        setUser(newData);
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(newData));
    };

    // --- DERIVED STATS ---
    const playerRank = useMemo(() => 
        [...RANKS].reverse().find(r => user.xp >= r.xp) || RANKS[0]
    , [user.xp]);

    const hardwareStats: CombatStats = useMemo(() => {
        const offLvl = user.skills.offense + sessionUpgrades.offense;
        const defLvl = user.skills.defense + sessionUpgrades.defense;
        
        return {
            maxHp: 20 + (user.hardware.ram * 5),
            dmgBonus: user.hardware.cpu * 1 + (sessionUpgrades.offense * 1),
            startAp: 3 + Math.floor(user.hardware.cooler / 2),
            miningRate: CONFIG.miningBaseRate + (user.hardware.cpu * 0.2),
            
            critChance: 0.05 + (offLvl * 0.05),
            critMult: 1.5 + (offLvl * 0.1),
            unstableChance: Math.max(0, 0.2 - (offLvl * 0.04)),
            
            shieldMult: 1 + (defLvl * 0.1),
            mitigationChance: 0 + (defLvl * 0.05)
        };
    }, [user.hardware, user.skills, sessionUpgrades]);

    // --- ACTIONS ---
    const addLog = (text: string, type: LogEntry['type'] = 'info') => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs(prev => [...prev.slice(-10), { id: Math.random().toString(), time, text, type }]);
    };

    const triggerGlitch = () => {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 200);
    };

    const startGame = () => {
        setView('GAME');
        setLevel(1);
        setSessionBits(0);
        setMinedBits(0);
        setSessionUpgrades({ offense: 0, defense: 0 });
        setLogs([]);
        startLevel(1);
    };

    const startLevel = (lvl: number) => {
        const enemyMaxHp = Math.floor(20 * (1 + (lvl * 0.3)));
        
        // Player heals if not dead, or fresh spawn
        setPlayer(prev => ({ 
            ...prev,
            hp: (prev.hp > 0 && lvl > 1) ? prev.hp : hardwareStats.maxHp, 
            maxHp: hardwareStats.maxHp, 
            ap: hardwareStats.startAp, 
            maxAp: CONFIG.maxApCap, 
            shield: 0,
            cooldowns: {}
        }));
        
        const nameIdx = Math.min(Math.floor((lvl - 1) / 2), ENEMY_NAMES.length - 1);
        const name = `${ENEMY_NAMES[nameIdx]}_V${lvl}.0`;

        setEnemy({ 
            name, 
            hp: enemyMaxHp, 
            maxHp: enemyMaxHp, 
            ap: 2 + Math.floor(lvl/3), 
            maxAp: 5 + Math.floor(lvl/2), 
            shield: 0,
            cooldowns: {}
        });

        setTurn(1);
        setIsPlayerTurn(true);
        addLog(`Target locked: ${name}. Connection established.`, 'system');
    };

    const handleWin = (currentLevel: number) => {
        const earned = currentLevel * 10 + randomInt(5, 15);
        setSessionBits(prev => prev + earned);
        addLog(`Target neutralized. +${earned} BITS obtained.`, 'success');
        
        setTimeout(() => {
            const next = currentLevel + 1;
            setLevel(next);
            startLevel(next);
        }, 1500);
    };

    const handleDefeat = () => {
        const totalXp = level * 100 + Math.floor(sessionBits);
        const finalBits = Math.floor(sessionBits); 

        const newUserData = {
            ...user,
            bits: user.bits + finalBits,
            xp: user.xp + totalXp,
            stats: {
                games: user.stats.games + 1,
                maxLevel: Math.max(user.stats.maxLevel, level)
            }
        };
        saveUser(newUserData);
        triggerGlitch();
        setView('RESULT');
    };

    const useSoftware = (swId: string) => {
        if (!isPlayerTurn) return;
        
        const sw = SOFTWARE_DB[swId];
        if (player.cooldowns[swId] > 0) {
            addLog(`System busy: ${player.cooldowns[swId]} turns remaining.`, 'error');
            return;
        }

        if (player.ap < sw.cost) {
            addLog('Insufficient Bandwidth (AP).', 'error');
            return;
        }

        let newP = { ...player, ap: player.ap - sw.cost };
        let newE = { ...enemy };
        let logMsg = '';
        let isCrit = false;
        let isUnstable = false;

        // Apply Cooldown
        if (sw.cooldown) {
            newP.cooldowns = { ...newP.cooldowns, [swId]: sw.cooldown };
        }

        const rollDamage = (min: number, max: number) => {
            let base = randomInt(min, max) + hardwareStats.dmgBonus;
            const roll = Math.random();
            if (roll < hardwareStats.critChance) {
                base = Math.floor(base * hardwareStats.critMult);
                isCrit = true;
            } else if (roll > (1 - hardwareStats.unstableChance)) {
                base = Math.floor(base * 0.5);
                isUnstable = true;
            }
            return base;
        };

        // Effect Logic
        if (sw.id === 'OVERCLOCK') {
            newP.hp -= 3;
            newP.ap = Math.min(newP.maxAp + 2, newP.ap + 3); // Can overflow cap slightly
            logMsg = `Overclock: -3 HP, +3 AP.`;
        } 
        else if (sw.type === 'shield') {
            const shieldVal = Math.floor((sw.val as number) * hardwareStats.shieldMult);
            newP.shield += shieldVal;
            logMsg = `Shield matrix deployed: +${shieldVal}.`;
        }
        else {
            // Offensive types
            let dmg = 0;
            const range = sw.val as [number, number];

            if (sw.type === 'risk') {
                if (Math.random() > 0.3) {
                    dmg = rollDamage(range[0], range[1]);
                    const realDmg = Math.max(0, dmg - newE.shield);
                    newE.shield = Math.max(0, newE.shield - dmg);
                    newE.hp -= realDmg;
                    logMsg = `SUCCESS: ${realDmg} DMG.`;
                    triggerGlitch();
                } else {
                    newP.hp -= 3;
                    logMsg = `FAILURE: Backlash sustained (-3 HP).`;
                    triggerGlitch();
                }
            } else {
                dmg = rollDamage(range[0], range[1]);
                let realDmg = dmg;
                
                if (sw.type !== 'pierce') {
                    realDmg = Math.max(0, dmg - newE.shield);
                    newE.shield = Math.max(0, newE.shield - dmg);
                } else {
                    logMsg += `[PIERCING] `;
                }
                
                newE.hp -= realDmg;
                logMsg += `${realDmg} DMG delivered.`;
                
                if (sw.type === 'drain') {
                    const heal = Math.floor(realDmg / 2);
                    newP.hp = Math.min(newP.maxHp, newP.hp + heal);
                    logMsg += ` Siphoned +${heal} HP.`;
                }
                triggerGlitch();
            }
        }
        
        if (isCrit) logMsg = `CRITICAL! ` + logMsg;
        if (isUnstable) logMsg = `UNSTABLE... ` + logMsg;

        setPlayer(newP);
        setEnemy(newE);
        addLog(`> ${sw.name}: ${logMsg}`, sw.type === 'risk' && logMsg.includes('FAILURE') ? 'error' : 'success');

        if (newE.hp <= 0) {
            handleWin(level);
        } else if (newP.hp <= 0) {
            handleDefeat();
        } else {
            setIsPlayerTurn(false);
            // Delay enemy turn
            setTimeout(() => processEnemyTurn(newP, newE), 800);
        }
    };

    const processEnemyTurn = (pState: EntityState, eState: EntityState) => {
        let p = { ...pState };
        let e = { ...eState };

        // Enemy Regen AP
        e.ap = Math.min(e.maxAp, e.ap + 2);

        // Reduce Player Cooldowns
        const newCooldowns: Record<string, number> = {};
        Object.entries(p.cooldowns).forEach(([k, v]) => {
            if (v > 1) newCooldowns[k] = v - 1;
        });
        p.cooldowns = newCooldowns;

        // Enemy AI
        const dmgBase = randomInt(3 + Math.floor(level * 0.8), 6 + level);
        let action = '';

        if (e.hp < e.maxHp * 0.3 && e.ap >= 2 && e.shield === 0) {
            e.shield += 5 + level;
            e.ap -= 2;
            action = 'Defensive Protocols initiated.';
        } else {
            let incomingDmg = dmgBase;
            let mitigated = false;
            
            if (Math.random() < hardwareStats.mitigationChance) {
                incomingDmg = Math.floor(incomingDmg / 2);
                mitigated = true;
            }
            
            const realDmg = Math.max(0, incomingDmg - p.shield);
            p.shield = Math.max(0, p.shield - incomingDmg);
            p.hp -= realDmg;
            
            action = `Attack received: ${realDmg} DMG${mitigated ? ' [MITIGATED]' : ''}.`;
            if (realDmg > 0) triggerGlitch();
        }

        // Player Turn Start Logic
        p.ap = Math.min(p.maxAp, p.ap + 2);
        const miningGain = hardwareStats.miningRate;
        
        // Update states
        setSessionBits(prev => prev + miningGain);
        setMinedBits(prev => prev + miningGain);
        setPlayer(p);
        setEnemy(e);
        
        addLog(action, action.includes('MITIGATED') ? 'info' : 'warning');
        addLog(`Mining Routine: +${miningGain.toFixed(1)} BITS`, 'system');

        if (p.hp <= 0) {
            handleDefeat();
        } else {
            setTurn(t => t + 1);
            setIsPlayerTurn(true);
        }
    };

    const buySessionUpgrade = (type: 'offense' | 'defense') => {
        const cost = 10 * (sessionUpgrades[type] + 1);
        const available = user.bits + sessionBits;
        
        if (available < cost) {
            addLog('Insufficient funds for patch.', 'error');
            return;
        }

        if (sessionBits >= cost) {
            setSessionBits(prev => prev - cost);
        } else {
            const remainder = cost - sessionBits;
            setSessionBits(0);
            saveUser({ ...user, bits: user.bits - remainder });
        }

        setSessionUpgrades(prev => ({ ...prev, [type]: prev[type] + 1 }));
        addLog(`LIVE PATCH: ${type.toUpperCase()} UPDATED`, 'success');
    };

    const buyItem = (type: 'hardware' | 'software' | 'skill', id: string, cost: number) => {
        if (user.bits < cost) return;
        
        const newData = { ...user, bits: user.bits - cost };
        if (type === 'hardware') newData.hardware = { ...newData.hardware, [id]: newData.hardware[id as keyof typeof user.hardware] + 1 };
        else if (type === 'software') newData.inventory = [...newData.inventory, id];
        else if (type === 'skill') newData.skills = { ...newData.skills, [id]: newData.skills[id as keyof typeof user.skills] + 1 };
        
        saveUser(newData);
    };

    const toggleLoadout = (id: string) => {
        let newLoadout = [...user.loadout];
        if (newLoadout.includes(id)) {
            if (newLoadout.length > 1) newLoadout = newLoadout.filter(i => i !== id);
        } else {
            if (newLoadout.length < CONFIG.maxLoadout) newLoadout.push(id);
        }
        saveUser({ ...user, loadout: newLoadout });
    };

    // --- RENDER HELPERS ---
    
    // Header Component
    const Header = () => (
        <header className="sticky top-0 z-30 w-full bg-black/90 border-b border-emerald-900/50 backdrop-blur-md px-4 py-2 flex justify-between items-center">
            <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-emerald-500 glow-text flex items-center gap-2">
                    <span className="text-emerald-200">{'{'}</span>
                    BIT-SHIFT
                    <span className="text-emerald-200">{'}'}</span>
                </h1>
                <div className="text-[10px] md:text-xs text-zinc-500 font-mono">
                    XP: {Math.floor(user.xp)} | <span className="text-emerald-600 font-bold">[{playerRank.title}]</span>
                </div>
            </div>
            <div className="text-right">
                <div className="text-amber-500 font-mono font-bold text-lg flex items-center justify-end gap-2">
                    {Math.floor(view === 'GAME' ? sessionBits + user.bits : user.bits)} <Icons.Disc />
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    {view === 'GAME' ? 'Total Available' : 'Wallet Balance'}
                </div>
            </div>
        </header>
    );

    // --- VIEWS ---

    const renderMenu = () => (
        <div className="flex flex-col gap-6 max-w-md w-full mx-auto mt-10 p-4">
            <Panel title="System Status" className="mb-4">
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono mb-4">
                    <div className="bg-emerald-900/20 p-2 border border-emerald-900/50 rounded">
                        <div className="text-zinc-500">CPU</div>
                        <div className="text-emerald-400 font-bold text-lg">v{user.hardware.cpu}</div>
                    </div>
                    <div className="bg-emerald-900/20 p-2 border border-emerald-900/50 rounded">
                        <div className="text-zinc-500">RAM</div>
                        <div className="text-emerald-400 font-bold text-lg">v{user.hardware.ram}</div>
                    </div>
                    <div className="bg-emerald-900/20 p-2 border border-emerald-900/50 rounded">
                        <div className="text-zinc-500">COOLER</div>
                        <div className="text-emerald-400 font-bold text-lg">v{user.hardware.cooler}</div>
                    </div>
                </div>
                <div className="flex justify-between text-xs px-2 pt-2 border-t border-emerald-900/30">
                     <span className="text-rose-400 font-bold">ATK: Lv.{user.skills.offense}</span>
                     <span className="text-sky-400 font-bold">DEF: Lv.{user.skills.defense}</span>
                </div>
            </Panel>

            <Button size="lg" onClick={startGame} className="w-full shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Icons.Terminal /> INITIALIZE RUN
            </Button>
            
            <div className="grid grid-cols-2 gap-4">
                <Button variant="market" onClick={() => setView('MARKET')}>MARKET</Button>
                <Button variant="warning" onClick={() => setView('LOADOUT')}>DECK ({user.loadout.length}/{CONFIG.maxLoadout})</Button>
            </div>
        </div>
    );

    const renderMarket = () => (
        <div className="max-w-4xl w-full mx-auto p-4 space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-violet-400 glow-text">DARK WEB MARKET</h2>
                <Button variant="ghost" size="sm" onClick={() => setView('MENU')}>Back to Menu</Button>
            </div>

            {/* Hardware Section */}
            <section>
                <h3 className="text-emerald-500 border-b border-emerald-900 mb-4 pb-2 font-bold flex items-center gap-2"><Icons.Cpu /> HARDWARE UPGRADES</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {HARDWARE_DB.map(hw => {
                        const lvl = user.hardware[hw.id];
                        const cost = hw.linear 
                            ? hw.baseCost * (lvl + 1)
                            : hw.baseCost * Math.pow(hw.costMult, lvl);
                        
                        return (
                            <Panel key={hw.id} borderColor="border-emerald-800" className="flex flex-col justify-between h-full">
                                <div className="mb-4">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-bold text-lg">{hw.name}</span>
                                        <span className="text-xs text-emerald-600 font-mono">v{lvl}</span>
                                    </div>
                                    <p className="text-xs text-zinc-400 mb-2">{hw.desc}</p>
                                    <p className="text-[10px] text-emerald-500 font-mono">{hw.effect(lvl)}</p>
                                </div>
                                <Button 
                                    size="sm"
                                    onClick={() => buyItem('hardware', hw.id, cost)}
                                    disabled={user.bits < cost}
                                    variant="primary"
                                    className="w-full"
                                >
                                    {user.bits >= cost ? `UPGRADE (${cost})` : `NEED ${cost} BITS`}
                                </Button>
                            </Panel>
                        );
                    })}
                </div>
            </section>

            {/* Skills Section */}
            <section>
                <h3 className="text-rose-500 border-b border-rose-900 mb-4 pb-2 font-bold flex items-center gap-2"><Icons.Zap /> NEURAL TRAINING</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.values(SKILLS_DB).map(skill => {
                        const lvl = user.skills[skill.id as keyof typeof user.skills];
                        const cost = skill.baseCost * (lvl + 1);
                        return (
                            <Panel key={skill.id} borderColor="border-rose-900" className="flex flex-col justify-between">
                                <div>
                                    <div className={`font-bold text-lg ${skill.color}`}>{skill.name} <span className="text-xs text-zinc-500 ml-2">Lv.{lvl}</span></div>
                                    <p className="text-xs text-zinc-400 mb-2">{skill.desc}</p>
                                    <p className="text-[10px] text-zinc-500 font-mono">{skill.stats(lvl)}</p>
                                </div>
                                <Button 
                                    size="sm"
                                    onClick={() => buyItem('skill', skill.id, cost)}
                                    disabled={user.bits < cost}
                                    variant="danger"
                                    className="w-full mt-4"
                                >
                                    TRAIN ({cost})
                                </Button>
                            </Panel>
                        );
                    })}
                </div>
            </section>

             {/* Software Section */}
             <section>
                <h3 className="text-violet-500 border-b border-violet-900 mb-4 pb-2 font-bold flex items-center gap-2"><Icons.Disc /> SOFTWARE BLACK MARKET</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.values(SOFTWARE_DB).filter(sw => sw.price).map(sw => {
                        const owned = user.inventory.includes(sw.id);
                        return (
                            <Panel key={sw.id} borderColor="border-violet-900/50" className={`${owned ? 'opacity-50 grayscale' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-violet-300">{sw.name}</div>
                                    <div className="text-[10px] border border-violet-900 px-1 text-violet-500">{sw.type.toUpperCase()}</div>
                                </div>
                                <p className="text-xs text-zinc-400 mb-4 h-8">{sw.desc}</p>
                                {owned ? (
                                    <div className="w-full py-2 text-center text-xs font-bold bg-zinc-900 border border-zinc-700 text-zinc-500">OWNED</div>
                                ) : (
                                    <Button 
                                        size="sm"
                                        variant="market"
                                        onClick={() => buyItem('software', sw.id, sw.price!)}
                                        disabled={user.bits < sw.price!}
                                        className="w-full"
                                    >
                                        BUY {sw.price}
                                    </Button>
                                )}
                            </Panel>
                        );
                    })}
                </div>
            </section>
        </div>
    );

    const renderDeck = () => (
        <div className="max-w-4xl w-full mx-auto p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-amber-500 glow-text">LOADOUT CONFIG</h2>
                <Button variant="primary" onClick={() => setView('MENU')}>CONFIRM</Button>
            </div>
            
            <div className="mb-4 text-xs text-zinc-400 font-mono">
                SLOTS USED: <span className={`${user.loadout.length === CONFIG.maxLoadout ? 'text-amber-500' : 'text-emerald-500'}`}>{user.loadout.length}/{CONFIG.maxLoadout}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto pb-20">
                {user.inventory.map(id => {
                    const sw = SOFTWARE_DB[id];
                    const equipped = user.loadout.includes(id);
                    return (
                        <button 
                            key={id}
                            onClick={() => toggleLoadout(id)}
                            className={`relative p-4 text-left border transition-all duration-200 group hover:scale-[1.02] ${
                                equipped 
                                    ? 'border-emerald-500 bg-emerald-900/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                    : 'border-zinc-800 bg-black hover:border-zinc-600'
                            }`}
                        >
                            <div className="font-bold text-sm mb-1 text-zinc-200">{sw.name}</div>
                            <div className="text-xs text-zinc-500 mb-2">{sw.desc}</div>
                            <div className="flex justify-between items-center text-[10px] font-mono text-zinc-600">
                                <span>{sw.cost} AP</span>
                                {sw.cooldown && <span className="text-rose-900">CD:{sw.cooldown}</span>}
                            </div>
                            {equipped && (
                                <div className="absolute top-0 right-0 bg-emerald-600 text-black text-[9px] font-bold px-1.5 py-0.5">
                                    EQUIPPED
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    );

    const renderCombat = () => (
        <div className="w-full max-w-5xl mx-auto h-[calc(100vh-60px)] flex flex-col md:grid md:grid-cols-12 gap-4 p-2 md:p-4 pb-6 overflow-hidden">
            
            {/* Left Col: Stats */}
            <div className="md:col-span-4 flex flex-col gap-4 order-2 md:order-1">
                {/* Enemy Card */}
                <Panel borderColor="border-rose-900" bgColor="bg-black/90">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-rose-500 font-bold flex items-center gap-2"><Icons.User/> {enemy.name}</span>
                        {enemy.shield > 0 && <span className="text-[10px] bg-rose-900/20 px-2 py-0.5 rounded border border-rose-900 text-rose-300"><Icons.Shield /> {enemy.shield}</span>}
                    </div>
                    <ProgressBar current={enemy.hp} max={enemy.maxHp} color="bg-rose-600" label="INTEGRITY" showValue={true} />
                    <div className="flex gap-1 mt-2 justify-end">
                         {/* Enemy AP Visualization */}
                        {[...Array(enemy.maxAp)].map((_, i) => (
                             <div key={i} className={`w-2 h-2 rounded-full ${i < enemy.ap ? 'bg-rose-500' : 'bg-rose-900/30'}`}></div>
                        ))}
                    </div>
                </Panel>

                {/* Player Card */}
                <Panel borderColor="border-emerald-600" bgColor="bg-black/90" className="shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-emerald-500 font-bold flex items-center gap-2"><Icons.Terminal/> USER_DAEMON</span>
                        {player.shield > 0 && <span className="text-[10px] bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-900 text-emerald-300"><Icons.Shield /> {player.shield}</span>}
                    </div>
                    
                    <div className="space-y-3">
                        <ProgressBar current={player.hp} max={player.maxHp} color="bg-emerald-500" label="INTEGRITY" />
                        
                        <div>
                            <div className="text-[10px] text-emerald-700 mb-1 font-mono">BANDWIDTH (AP)</div>
                            <div className="flex gap-1 h-4">
                                {[...Array(player.maxAp)].map((_, i) => (
                                    <div key={i} className={`flex-1 border border-emerald-800 transition-all ${i < player.ap ? 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.5)]' : 'bg-transparent'}`}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Panel>

                {/* Live Patching */}
                <Panel borderColor="border-amber-900/50" title="LIVE PATCHING" className="text-center">
                    <div className="flex gap-2">
                        {[
                            { id: 'offense', label: 'ATK', color: 'text-rose-400', border: 'border-rose-900' },
                            { id: 'defense', label: 'DEF', color: 'text-sky-400', border: 'border-sky-900' }
                        ].map((item) => {
                            const cost = 10 * (sessionUpgrades[item.id as 'offense'] + 1);
                            const canAfford = (user.bits + sessionBits) >= cost;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => buySessionUpgrade(item.id as 'offense'|'defense')}
                                    disabled={!canAfford || !isPlayerTurn}
                                    className={`flex-1 border ${item.border} p-2 transition active:scale-95 disabled:opacity-30 hover:bg-white/5`}
                                >
                                    <div className={`text-xs font-bold ${item.color}`}>{item.label} <span className="text-[9px]">Lv.{sessionUpgrades[item.id as 'offense']}</span></div>
                                    <div className="text-[10px] text-zinc-500 mt-1">{cost} BITS</div>
                                </button>
                            );
                        })}
                    </div>
                </Panel>
                
                <div className="text-center font-mono text-[10px] text-zinc-600 bg-black/50 p-1 border border-zinc-900">
                    LEVEL {level} // TURN {turn}
                </div>
            </div>

            {/* Right Col: Logs & Controls */}
            <div className="md:col-span-8 flex flex-col h-full gap-4 order-1 md:order-2 overflow-hidden">
                
                {/* Terminal Log */}
                <div className="flex-1 bg-black border border-zinc-800 p-4 font-mono text-xs overflow-y-auto min-h-[150px] shadow-inner relative">
                    <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">
                        <Icons.Terminal />
                    </div>
                    {logs.map((l) => (
                        <div key={l.id} className="mb-1.5 leading-relaxed">
                            <span className="text-zinc-600 mr-2">[{l.time}]</span>
                            <span className={`
                                ${l.type === 'error' ? 'text-rose-500 font-bold' : ''}
                                ${l.type === 'success' ? 'text-emerald-400' : ''}
                                ${l.type === 'warning' ? 'text-amber-400' : ''}
                                ${l.type === 'system' ? 'text-violet-400' : ''}
                                ${l.type === 'info' ? 'text-zinc-300' : ''}
                            `}>
                                {l.type === 'info' ? '' : `> `}{l.text}
                            </span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>

                {/* Controls (Deck) */}
                <div className="h-auto md:h-32 grid grid-cols-4 gap-2 shrink-0">
                    {user.loadout.map(id => {
                        const sw = SOFTWARE_DB[id];
                        const canAfford = player.ap >= sw.cost;
                        const onCooldown = (player.cooldowns[id] || 0) > 0;
                        const disabled = !isPlayerTurn || !canAfford || onCooldown;

                        return (
                            <button 
                                key={id}
                                onClick={() => useSoftware(id)}
                                disabled={disabled}
                                className={`
                                    relative border p-2 flex flex-col justify-between transition-all duration-100
                                    ${disabled ? 'opacity-50 bg-zinc-900 border-zinc-800' : 'bg-black border-emerald-600 hover:bg-emerald-900/20 hover:scale-[1.02] active:scale-95 cursor-pointer'}
                                `}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`text-[10px] md:text-xs font-bold ${canAfford ? 'text-white' : 'text-rose-500'}`}>{sw.name}</span>
                                    <span className="text-[9px] font-mono border border-current px-1">{sw.cost}</span>
                                </div>
                                <div className="hidden md:block text-[9px] text-zinc-400 leading-tight mt-1">{sw.desc}</div>
                                
                                {onCooldown && (
                                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-[1px]">
                                        <span className="text-xl font-bold text-rose-500">{player.cooldowns[id]}</span>
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    );

    const renderResult = () => (
        <div className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="space-y-2">
                    <h2 className="text-4xl font-bold text-rose-600 glitch-active">CONNECTION_LOST</h2>
                    <p className="text-zinc-500 font-mono tracking-widest text-sm">DATA EXTRACTION COMPLETE</p>
                </div>

                <div className="border border-zinc-800 bg-zinc-900/30 p-6 space-y-3 font-mono text-sm">
                    <div className="flex justify-between text-zinc-400">
                        <span>SECTORS CLEARED</span>
                        <span className="text-white">{level - 1}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                        <span>TURNS SURVIVED</span>
                        <span className="text-white">{turn}</span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                        <span>MINING YIELD</span>
                        <span>+{minedBits.toFixed(1)}</span>
                    </div>
                    <div className="h-px bg-zinc-800 my-2"></div>
                    <div className="flex justify-between text-lg text-amber-400 font-bold">
                        <span>TOTAL EARNINGS</span>
                        <span>+{Math.floor(sessionBits)} BITS</span>
                    </div>
                </div>

                <Button variant="primary" size="lg" className="w-full" onClick={() => setView('MENU')}>
                    RETURN TO ROOT
                </Button>
            </div>
        </div>
    );

    // --- MAIN RENDER ---
    return (
        <div className={`min-h-screen relative flex flex-col font-sans selection:bg-emerald-500/30 ${glitch ? 'glitch-active' : ''}`}>
            {view !== 'RESULT' && <Header />}
            
            <main className="flex-1 flex flex-col relative z-10">
                {view === 'MENU' && renderMenu()}
                {view === 'MARKET' && renderMarket()}
                {view === 'LOADOUT' && renderDeck()}
                {view === 'GAME' && renderCombat()}
                {view === 'RESULT' && renderResult()}
            </main>
        </div>
    );
}