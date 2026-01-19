import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Panel, Button, ProgressBar, Icons } from './components/UI';
import { UserState, ViewState, EntityState, LogEntry, CombatStats, Language, TargetProfile } from './types';
import { CONFIG, RANKS, SOFTWARE_DB, HARDWARE_DB, SKILLS_DB, ENEMY_NAMES, TRANSLATIONS, PROFILES, PASSIVES_DB } from './constants';

// --- UTILS ---
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

const generateUserId = () => {
    // Generates format AAA.BBB.CCC.DDD based on timestamp + random
    const ts = Date.now().toString(16).toUpperCase();
    const rand = () => Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    
    // Take last 4 of timestamp for first block to ensure time rotation, then randoms
    const part1 = ts.slice(-4);
    
    return `${part1}.${rand()}.${rand()}.${rand()}`;
};

const INITIAL_USER: UserState = {
    id: generateUserId(),
    bits: CONFIG.initialBits,
    xp: 0,
    hardware: { cpu: 0, ram: 0, cooler: 0 },
    skills: { offense: 0, defense: 0 },
    inventory: ['PING', 'FIREWALL', 'OVERCLOCK', 'SQL_INJECT', 'DDOS_PACKET', 'EXPLOIT_SMB'], // Expanded starter kit
    passives: [],
    loadout: ['PING', 'FIREWALL', 'OVERCLOCK', 'SQL_INJECT'],
    stats: { games: 0, maxLevel: 0 }
};

export default function App() {
    // --- STATE ---
    const [user, setUser] = useState<UserState>(INITIAL_USER);
    const [view, setView] = useState<ViewState>('MENU');
    const [glitch, setGlitch] = useState(false);
    const [lang, setLang] = useState<Language>('en-US');

    const t = TRANSLATIONS[lang];

    // File Input Ref
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    // UI State for Combat
    const [activeCombatMenu, setActiveCombatMenu] = useState<'OFFENSE' | 'DEFENSE' | null>(null);
    
    const logsEndRef = useRef<HTMLDivElement>(null);

    // --- INITIALIZATION ---
    useEffect(() => {
        const saved = localStorage.getItem(CONFIG.storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Migrations
                if (!parsed.skills) parsed.skills = { offense: 0, defense: 0 };
                if (!parsed.passives) parsed.passives = [];
                if (!parsed.id) {
                    parsed.id = generateUserId();
                    localStorage.setItem(CONFIG.storageKey, JSON.stringify(parsed));
                }
                setUser(parsed);
                // Check if profile is selected
                if (!parsed.profileId) {
                    setView('PROFILE_SELECT');
                }
            } catch (e) {
                console.error("Save corrupted", e);
            }
        } else {
            // New user, go to profile select
            setView('PROFILE_SELECT');
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

    const handleSaveAndExit = () => {
        const activeRunData = {
            level,
            sessionBits,
            minedBits,
            sessionUpgrades,
            player,
            enemy,
            turn,
            logs
        };

        const updatedUser = {
            ...user,
            activeRun: activeRunData
        };

        saveUser(updatedUser);
        setView('MENU');
    };

    // --- IMPORT / EXPORT LOGIC ---
    const handleExportSave = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(user, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `bitshift_save_${user.id}.json`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        triggerGlitch();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileObj = event.target.files && event.target.files[0];
        if (!fileObj) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = e.target?.result as string;
                const parsed = JSON.parse(json);
                
                // Basic validation
                if (parsed.bits !== undefined && parsed.hardware && parsed.inventory) {
                    if (!parsed.id) parsed.id = generateUserId();
                    if (!parsed.passives) parsed.passives = [];
                    
                    saveUser(parsed);
                    triggerGlitch();
                    alert(`USER_${parsed.id} ${t.menu.successRestore}.`);
                    // Redirect to profile select if needed
                    if (!parsed.profileId) setView('PROFILE_SELECT');
                    else setView('MENU');

                    if (fileInputRef.current) fileInputRef.current.value = '';
                } else {
                    throw new Error("Invalid Save Format");
                }
            } catch (err) {
                alert(t.menu.errorFile);
                console.error(err);
            }
        };
        reader.readAsText(fileObj);
    };

    // --- DERIVED STATS ---
    const playerRank = useMemo(() => 
        [...RANKS].reverse().find(r => user.xp >= r.xp) || RANKS[0]
    , [user.xp]);

    const activeProfile = useMemo(() => 
        PROFILES.find(p => p.id === user.profileId)
    , [user.profileId]);

    const hardwareStats: CombatStats = useMemo(() => {
        const offLvl = user.skills.offense + sessionUpgrades.offense;
        const defLvl = user.skills.defense + sessionUpgrades.defense;
        
        // Base stats from hardware
        let baseMaxHp = 20 + (user.hardware.ram * 5);
        let baseStartAp = 3 + Math.floor(user.hardware.cooler / 2);
        let baseDefense = 1.0;

        // Apply Profile Modifiers
        if (activeProfile) {
            baseMaxHp = Math.floor(baseMaxHp * activeProfile.stats_modifier.hp);
            baseStartAp = Math.floor(baseStartAp * activeProfile.stats_modifier.ap);
            baseDefense = activeProfile.stats_modifier.defense;
        }
        
        return {
            maxHp: baseMaxHp,
            dmgBonus: user.hardware.cpu * 1 + (sessionUpgrades.offense * 1),
            startAp: baseStartAp,
            miningRate: CONFIG.miningBaseRate + (user.hardware.cpu * 0.2),
            
            critChance: 0.05 + (offLvl * 0.05),
            critMult: 1.5 + (offLvl * 0.1),
            unstableChance: Math.max(0, 0.2 - (offLvl * 0.04)),
            
            shieldMult: 1 + (defLvl * 0.1),
            mitigationChance: 0 + (defLvl * 0.05),
            defenseModifier: baseDefense
        };
    }, [user.hardware, user.skills, sessionUpgrades, activeProfile]);

    // --- ACTIONS ---
    const addLog = (text: string, type: LogEntry['type'] = 'info') => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs(prev => [...prev.slice(-10), { id: Math.random().toString(), time, text, type }]);
    };

    const triggerGlitch = () => {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 200);
    };

    const handleProfileSelect = (profileId: string) => {
        saveUser({ ...user, profileId });
        setView('MENU');
        triggerGlitch();
    };

    const startGame = () => {
        setView('GAME');
        
        if (user.activeRun) {
            // Resume Game
            const run = user.activeRun;
            setLevel(run.level);
            setSessionBits(run.sessionBits);
            setMinedBits(run.minedBits);
            setSessionUpgrades(run.sessionUpgrades);
            setPlayer(run.player);
            setEnemy(run.enemy);
            setTurn(run.turn);
            setLogs(run.logs);
            addLog(`${t.game.sessionResumed}. WELCOME BACK, ${user.id}.`, 'system');
        } else {
            // New Game
            setLevel(1);
            setSessionBits(0);
            setMinedBits(0);
            setSessionUpgrades({ offense: 0, defense: 0 });
            setLogs([]);
            startLevel(1);
        }
    };

    const startLevel = (lvl: number) => {
        // Generate Enemy with Random Profile
        const randomProfileIndex = randomInt(0, PROFILES.length - 1);
        const enemyProfile = PROFILES[randomProfileIndex];

        // Base Enemy HP scales with level
        const baseEnemyHp = Math.floor(20 * (1 + (lvl * 0.3)));
        
        // Apply Profile Modifiers to Enemy
        const enemyMaxHp = Math.floor(baseEnemyHp * enemyProfile.stats_modifier.hp);
        const enemyMaxAp = 5 + Math.floor(lvl/2); // Cap might be high, but actual usage limited by logic
        const enemyStartAp = Math.floor((2 + Math.floor(lvl/3)) * enemyProfile.stats_modifier.ap);

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
        const baseName = ENEMY_NAMES[nameIdx];
        // Combine Generic Name with Profile Name for flavor
        const name = `${baseName}_${enemyProfile.name.split(' ')[0].toUpperCase()}`;

        setEnemy({ 
            name, 
            hp: enemyMaxHp, 
            maxHp: enemyMaxHp, 
            ap: enemyStartAp, 
            maxAp: enemyMaxAp, 
            shield: 0,
            cooldowns: {},
            profileId: enemyProfile.id // Assign the random profile
        });

        setTurn(1);
        setIsPlayerTurn(true);
        setActiveCombatMenu(null);
        addLog(`${t.game.targetLocked}: ${name} [${enemyProfile.difficulty}].`, 'system');
    };

    const handleWin = (currentLevel: number) => {
        const earned = currentLevel * 10 + randomInt(5, 15);
        setSessionBits(prev => prev + earned);
        addLog(`${t.game.targetNeut}. +${earned} ${t.game.bitsObtained}.`, 'success');
        
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
            },
            activeRun: undefined // Clear active run on defeat
        };
        saveUser(newUserData);
        triggerGlitch();
        setView('RESULT');
    };

    const useSoftware = (swId: string) => {
        if (!isPlayerTurn) return;
        
        const sw = SOFTWARE_DB[swId];
        if (player.cooldowns[swId] > 0) {
            addLog(`${t.game.sysBusy}: ${player.cooldowns[swId]} turns remaining.`, 'error');
            return;
        }

        if (player.ap < sw.cost) {
            addLog(t.game.insufficientAp, 'error');
            return;
        }

        // Close Menu on use
        setActiveCombatMenu(null);

        let newP = { ...player, ap: player.ap - sw.cost };
        let newE = { ...enemy };
        let logMsg = '';
        let isCrit = false;
        let isUnstable = false;
        let isBonus = false;

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

            // Calculate Base Damage
            dmg = rollDamage(range[0], range[1]);

            // Check for BONUS against Enemy Profile
            if (sw.bonuses && enemy.profileId && sw.bonuses.includes(enemy.profileId)) {
                dmg = Math.floor(dmg * 1.5);
                isBonus = true;
            }

            if (sw.type === 'risk') {
                if (Math.random() > 0.3) {
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
        if (isBonus) logMsg = `${t.game.effective} ` + logMsg;
        if (isUnstable) logMsg = `UNSTABLE... ` + logMsg;

        setPlayer(newP);
        setEnemy(newE);
        addLog(`> ${sw.name}: ${logMsg}`, sw.type === 'risk' && logMsg.includes('FAILURE') ? 'error' : (isBonus ? 'warning' : 'success'));

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
        let actionLog = '';
        let actionType: LogEntry['type'] = 'warning';

        // Helper: Apply Damage to Player
        const applyDamage = (rawDmg: number) => {
            let incoming = rawDmg;
            let mitigated = false;
            
            // Mitigation Chance
            if (Math.random() < hardwareStats.mitigationChance) {
                incoming = Math.floor(incoming / 2);
                mitigated = true;
            }

            // Defense Modifier (Profile/Hardware)
            if (hardwareStats.defenseModifier > 1.0) {
                incoming = Math.ceil(incoming / hardwareStats.defenseModifier);
            } else if (hardwareStats.defenseModifier < 1.0) {
                incoming = Math.ceil(incoming * (2 - hardwareStats.defenseModifier)); 
            }

            const realDmg = Math.max(0, incoming - p.shield);
            p.shield = Math.max(0, p.shield - incoming);
            p.hp -= realDmg;
            if (realDmg > 0) triggerGlitch();
            
            return { realDmg, mitigated };
        };

        // Decision Tree
        if (e.hp < e.maxHp * 0.3 && e.shield === 0 && e.ap >= 2) {
            // DEFENSE
            const shieldVal = 5 + Math.floor(level * 1.5);
            e.shield += shieldVal;
            e.ap -= 2;
            actionLog = `${t.game.enemyAction.defense} (+${shieldVal})`;
            actionType = 'info';
        } 
        else if (p.ap >= 3 && e.ap >= 3 && Math.random() > 0.3) {
            // DISRUPTION (Drain)
            const drainAmt = 2;
            p.ap = Math.max(0, p.ap - drainAmt);
            const { realDmg } = applyDamage(Math.floor(dmgBase * 0.5));
            e.ap -= 3;
            actionLog = `${t.game.enemyAction.drain} (-${drainAmt} AP, ${realDmg} DMG)`;
        }
        else if (e.ap >= 4 && Math.random() > 0.4) {
            // HEAVY ATTACK
            const { realDmg, mitigated } = applyDamage(Math.floor(dmgBase * 1.5));
            e.ap -= 4;
            actionLog = `${t.game.enemyAction.heavy} (${realDmg} DMG${mitigated ? '!' : ''})`;
            actionType = 'error';
        }
        else if (e.ap >= 2) {
            // STANDARD ATTACK
            const { realDmg, mitigated } = applyDamage(dmgBase);
            e.ap -= 2;
            actionLog = `${t.game.enemyAction.attack} (${realDmg} DMG${mitigated ? ' [MITIGATED]' : ''})`;
        } 
        else {
            // WAIT / CHARGE
            actionLog = t.game.enemyAction.wait;
            actionType = 'info';
        }

        // Player Turn Start Logic
        p.ap = Math.min(p.maxAp, p.ap + 2); // Regen
        if (user.passives.includes('PATCH_MANAGER')) {
            p.hp = Math.min(p.maxHp, p.hp + 1);
        }

        const miningGain = hardwareStats.miningRate;
        
        // Update states
        setSessionBits(prev => prev + miningGain);
        setMinedBits(prev => prev + miningGain);
        setPlayer(p);
        setEnemy(e);
        
        addLog(`${e.name}: ${actionLog}`, actionType);
        addLog(`${t.game.miningRoutine}: +${miningGain.toFixed(1)} BITS`, 'system');

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
            addLog(t.game.insufficientFunds, 'error');
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
        const label = type === 'offense' ? t.game.atk : t.game.def;
        addLog(`${t.game.livePatch}: ${label} ${t.game.patchUpdated}`, 'success');
    };

    const buyItem = (type: 'hardware' | 'software' | 'skill' | 'passive', id: string, cost: number) => {
        if (user.bits < cost) return;
        
        const newData = { ...user, bits: user.bits - cost };
        if (type === 'hardware') newData.hardware = { ...newData.hardware, [id]: newData.hardware[id as keyof typeof user.hardware] + 1 };
        else if (type === 'software') newData.inventory = [...newData.inventory, id];
        else if (type === 'skill') newData.skills = { ...newData.skills, [id]: newData.skills[id as keyof typeof user.skills] + 1 };
        else if (type === 'passive') newData.passives = [...newData.passives, id];
        
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
                <div className="text-xs md:text-sm mt-1 font-mono tracking-wide">
                    <span className="text-zinc-300 font-bold">XP: {Math.floor(user.xp)}</span>
                    <span className="mx-2 text-zinc-600">|</span>
                    <span className="text-emerald-400 font-bold drop-shadow-md">[{playerRank.title}]</span>
                </div>
            </div>
            <div className="text-right">
                <div className="text-amber-500 font-mono font-bold text-lg flex items-center justify-end gap-2">
                    {Math.floor(view === 'GAME' ? sessionBits + user.bits : user.bits)} <Icons.Disc />
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider h-6 flex items-center justify-end">
                    {view === 'GAME' ? (
                        <button 
                            onClick={handleSaveAndExit} 
                            className="hover:text-emerald-400 hover:underline transition-colors cursor-pointer flex items-center gap-1 ml-auto font-bold animate-pulse hover:animate-none"
                            title="Suspend current run and return to menu"
                        >
                            <Icons.Lock /> {t.header.saveExit}
                        </button>
                    ) : t.header.wallet}
                </div>
            </div>
        </header>
    );

    // --- VIEWS ---

    const renderProfileSelect = () => (
        <div className="max-w-6xl w-full mx-auto p-4 space-y-6 animate-in fade-in duration-700">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-emerald-500 glow-text">{t.profileSelect.title}</h2>
                <p className="text-zinc-400 font-mono text-sm">{t.profileSelect.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PROFILES.map(profile => (
                    <Panel key={profile.id} borderColor="border-zinc-700" className="flex flex-col h-full hover:border-emerald-500 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-emerald-400 group-hover:text-white transition-colors">{profile.name}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded border ${
                                profile.difficulty === 'Very Hard' ? 'border-rose-900 bg-rose-900/20 text-rose-400' :
                                profile.difficulty === 'Hard' ? 'border-amber-900 bg-amber-900/20 text-amber-400' :
                                profile.difficulty === 'Medium' ? 'border-sky-900 bg-sky-900/20 text-sky-400' :
                                'border-emerald-900 bg-emerald-900/20 text-emerald-400'
                            }`}>{profile.difficulty}</span>
                        </div>
                        
                        <p className="text-xs text-zinc-400 mb-4 grow">{profile.description}</p>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-1 border-b border-zinc-800 pb-1">{t.profileSelect.stats}</h4>
                                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                                    <div className="bg-zinc-900/50 p-1 rounded">
                                        <div className="text-zinc-500">HP</div>
                                        <div className={profile.stats_modifier.hp < 1 ? 'text-rose-400' : 'text-emerald-400'}>{profile.stats_modifier.hp}x</div>
                                    </div>
                                    <div className="bg-zinc-900/50 p-1 rounded">
                                        <div className="text-zinc-500">AP</div>
                                        <div className={profile.stats_modifier.ap < 1 ? 'text-rose-400' : 'text-emerald-400'}>{profile.stats_modifier.ap}x</div>
                                    </div>
                                    <div className="bg-zinc-900/50 p-1 rounded">
                                        <div className="text-zinc-500">DEF</div>
                                        <div className={profile.stats_modifier.defense < 1 ? 'text-rose-400' : 'text-emerald-400'}>{profile.stats_modifier.defense}x</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-bold text-rose-900 uppercase mb-1 border-b border-rose-900/30 pb-1">{t.profileSelect.vuln}</h4>
                                <ul className="space-y-1">
                                    {profile.vulnerabilities.map(v => (
                                        <li key={v.id} className="text-[10px] flex justify-between">
                                            <span className="text-rose-400">{v.name}</span>
                                            <span className="text-zinc-500">{v.severity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Button onClick={() => handleProfileSelect(profile.id)} variant="primary" className="w-full">
                                {t.profileSelect.select}
                            </Button>
                        </div>
                    </Panel>
                ))}
            </div>
            
             <div className="flex justify-center mt-8">
                <button 
                    onClick={() => setLang(l => l === 'en-US' ? 'pt-BR' : 'en-US')}
                    className="text-xs font-mono text-zinc-500 hover:text-white transition"
                >
                    CHANGE LANGUAGE
                </button>
            </div>
        </div>
    );

    const renderMenu = () => (
        <div className="flex flex-col gap-6 max-w-md w-full mx-auto mt-10 p-4">
            <Panel title={t.menu.systemStatus} className="mb-4">
                {activeProfile && (
                     <div className="mb-4 text-center border-b border-emerald-900/30 pb-4">
                        <div className="text-[10px] text-zinc-500 tracking-widest uppercase mb-1">{t.menu.profileInfo}</div>
                        <div className="text-emerald-400 font-bold">{activeProfile.name}</div>
                        <div className="text-[10px] text-zinc-500 flex justify-center gap-3 mt-1 font-mono">
                             <span>HP: {activeProfile.stats_modifier.hp}x</span>
                             <span>AP: {activeProfile.stats_modifier.ap}x</span>
                             <span>DEF: {activeProfile.stats_modifier.defense}x</span>
                        </div>
                     </div>
                )}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono mb-4">
                    <div className="bg-emerald-900/20 p-2 border border-emerald-900/50 rounded">
                        <div className="text-zinc-500">{t.menu.cpu}</div>
                        <div className="text-emerald-400 font-bold text-lg">v{user.hardware.cpu}</div>
                    </div>
                    <div className="bg-emerald-900/20 p-2 border border-emerald-900/50 rounded">
                        <div className="text-zinc-500">{t.menu.ram}</div>
                        <div className="text-emerald-400 font-bold text-lg">v{user.hardware.ram}</div>
                    </div>
                    <div className="bg-emerald-900/20 p-2 border border-emerald-900/50 rounded">
                        <div className="text-zinc-500">{t.menu.cooler}</div>
                        <div className="text-emerald-400 font-bold text-lg">v{user.hardware.cooler}</div>
                    </div>
                </div>
                <div className="flex justify-between text-xs px-2 pt-2 border-t border-emerald-900/30">
                     <span className="text-rose-400 font-bold">{t.menu.atk}: Lv.{user.skills.offense}</span>
                     <span className="text-sky-400 font-bold">{t.menu.def}: Lv.{user.skills.defense}</span>
                </div>
                
                {user.passives.length > 0 && (
                    <div className="mt-4 pt-2 border-t border-emerald-900/30 text-xs">
                        <div className="text-zinc-500 mb-1">MODULES:</div>
                        <div className="flex flex-wrap gap-1">
                            {user.passives.map(pid => (
                                <span key={pid} className="bg-sky-900/30 text-sky-400 px-1 border border-sky-900/50 rounded text-[10px]">{PASSIVES_DB.find(p => p.id === pid)?.name}</span>
                            ))}
                        </div>
                    </div>
                )}
            </Panel>

            <Button size="lg" onClick={startGame} className="w-full shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Icons.Terminal /> {user.activeRun ? t.menu.resumeRun : t.menu.initRun}
            </Button>
            
            <div className="grid grid-cols-2 gap-4">
                <Button variant="market" onClick={() => setView('MARKET')}>{t.menu.market}</Button>
                <Button variant="warning" onClick={() => setView('LOADOUT')}>{t.menu.deck} ({user.loadout.length}/{CONFIG.maxLoadout})</Button>
            </div>

            <div className="pt-6 border-t border-zinc-900 mt-2 grid grid-cols-2 gap-4">
                <Button variant="ghost" size="sm" onClick={handleExportSave} className="text-xs">
                    {t.menu.backup}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleImportClick} className="text-xs">
                    {t.menu.restore}
                </Button>
                {/* Hidden File Input */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".json" 
                    className="hidden" 
                />
            </div>
            
            <div className="flex justify-center items-center gap-4 mt-2">
                <div className="text-[10px] font-mono text-zinc-700">ID: {user.id}</div>
                <button 
                    onClick={() => setLang(l => l === 'en-US' ? 'pt-BR' : 'en-US')}
                    className="text-[10px] font-mono text-emerald-600 border border-emerald-900 px-2 py-0.5 rounded hover:bg-emerald-900/30 transition"
                >
                    {lang === 'en-US' ? 'LANG: EN' : 'LANG: PT'}
                </button>
            </div>
        </div>
    );

    const renderMarket = () => (
        <div className="max-w-4xl w-full mx-auto p-4 space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-violet-400 glow-text">{t.market.title}</h2>
                <Button variant="ghost" size="sm" onClick={() => setView('MENU')}>{t.market.back}</Button>
            </div>

            {/* Hardware Section */}
            <section>
                <h3 className="text-emerald-500 border-b border-emerald-900 mb-4 pb-2 font-bold flex items-center gap-2"><Icons.Cpu /> {t.market.hardware}</h3>
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
                                    {user.bits >= cost ? `${t.market.upgrade} (${cost})` : `${t.market.need} ${cost} BITS`}
                                </Button>
                            </Panel>
                        );
                    })}
                </div>
            </section>

             {/* Passive Protection Section */}
             <section>
                <h3 className="text-sky-500 border-b border-sky-900 mb-4 pb-2 font-bold flex items-center gap-2"><Icons.Shield /> {t.market.protection}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PASSIVES_DB.map(tool => {
                        const owned = user.passives.includes(tool.id);
                        const isCompatible = tool.compatible_profiles.includes('All') || (user.profileId && tool.compatible_profiles.includes(user.profileId));
                        
                        return (
                            <Panel key={tool.id} borderColor="border-sky-900" className={`flex flex-col justify-between ${owned ? 'opacity-50 grayscale' : ''} ${!isCompatible ? 'opacity-30' : ''}`}>
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-sky-300">{tool.name}</div>
                                        <div className="text-[10px] border border-sky-900 px-1 text-sky-500">PASSIVE</div>
                                    </div>
                                    <p className="text-xs text-zinc-400 mb-2">{tool.effect}</p>
                                    {!isCompatible && <p className="text-[10px] text-rose-500 font-mono">INCOMPATIBLE WITH SYSTEM</p>}
                                </div>
                                {owned ? (
                                    <div className="w-full py-2 text-center text-xs font-bold bg-zinc-900 border border-zinc-700 text-zinc-500 mt-4">{t.market.owned}</div>
                                ) : (
                                    <Button 
                                        size="sm"
                                        variant="market"
                                        onClick={() => buyItem('passive', tool.id, tool.price)}
                                        disabled={user.bits < tool.price || !isCompatible}
                                        className="w-full mt-4"
                                    >
                                        {t.market.install} {tool.price}
                                    </Button>
                                )}
                            </Panel>
                        );
                    })}
                </div>
            </section>

             {/* Software Section */}
             <section>
                <h3 className="text-violet-500 border-b border-violet-900 mb-4 pb-2 font-bold flex items-center gap-2"><Icons.Disc /> {t.market.software}</h3>
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
                                    <div className="w-full py-2 text-center text-xs font-bold bg-zinc-900 border border-zinc-700 text-zinc-500">{t.market.owned}</div>
                                ) : (
                                    <Button 
                                        size="sm"
                                        variant="market"
                                        onClick={() => buyItem('software', sw.id, sw.price!)}
                                        disabled={user.bits < sw.price!}
                                        className="w-full"
                                    >
                                        {t.market.buy} {sw.price}
                                    </Button>
                                )}
                            </Panel>
                        );
                    })}
                </div>
            </section>

            {/* Skills Section (Bottom) */}
            <section>
                <h3 className="text-rose-500 border-b border-rose-900 mb-4 pb-2 font-bold flex items-center gap-2"><Icons.Zap /> {t.market.neural}</h3>
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
                                    {t.market.train} ({cost})
                                </Button>
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
                <h2 className="text-2xl font-bold text-amber-500 glow-text">{t.deck.title}</h2>
                <Button variant="primary" onClick={() => setView('MENU')}>{t.deck.confirm}</Button>
            </div>
            
            <div className="mb-4 text-xs text-zinc-400 font-mono">
                {t.deck.slots}: <span className={`${user.loadout.length === CONFIG.maxLoadout ? 'text-amber-500' : 'text-emerald-500'}`}>{user.loadout.length}/{CONFIG.maxLoadout}</span>
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
                                    {t.deck.equipped}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    );

    const renderCombat = () => {
        const enemyProfile = PROFILES.find(p => p.id === enemy.profileId);
        
        // Split loadout into categories
        const offensiveLoadout = user.loadout.filter(id => {
            const type = SOFTWARE_DB[id].type;
            return ['dmg', 'pierce', 'risk', 'drain'].includes(type);
        });
        
        const defensiveLoadout = user.loadout.filter(id => {
            const type = SOFTWARE_DB[id].type;
            return ['shield', 'special'].includes(type);
        });

        // Helper to render action grid in modal
        const renderActionList = (items: string[]) => (
             <div className="grid grid-cols-2 gap-3">
                {items.length === 0 && <div className="col-span-2 text-center text-zinc-500 text-xs py-4 font-mono">NO PROTOCOLS AVAILABLE</div>}
                {items.map(id => {
                    const sw = SOFTWARE_DB[id];
                    const canAfford = player.ap >= sw.cost;
                    const onCooldown = (player.cooldowns[id] || 0) > 0;
                    const disabled = !canAfford || onCooldown;
                    const isEffective = sw.bonuses && enemy.profileId && sw.bonuses.includes(enemy.profileId);

                    return (
                        <button 
                            key={id}
                            onClick={() => useSoftware(id)}
                            disabled={disabled}
                            className={`
                                relative border p-3 flex flex-col justify-between transition-all duration-100 min-h-22.5 text-left
                                ${disabled ? 'opacity-40 bg-zinc-900 border-zinc-800' : 'bg-black border-zinc-700 hover:bg-zinc-900 hover:border-white active:scale-95'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-xs font-bold ${canAfford ? 'text-white' : 'text-rose-500'}`}>{sw.name}</span>
                                <span className="text-[10px] font-mono border border-current px-1 rounded">{sw.cost} AP</span>
                            </div>
                            <div className="text-[10px] text-zinc-400 leading-tight">{sw.desc}</div>
                            
                            {isEffective && !disabled && (
                                <div className="absolute top-1 right-1">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                </div>
                            )}

                            {onCooldown && (
                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-[1px] z-10">
                                    <span className="text-xl font-bold text-rose-500">{player.cooldowns[id]}</span>
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        );

        return (
            <div className="w-full max-w-5xl mx-auto h-[calc(100vh-60px)] flex flex-col md:grid md:grid-cols-12 gap-2 p-2 md:p-4 overflow-hidden relative">
                
                {/* MODAL OVERLAY */}
                {activeCombatMenu && (
                    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-md bg-black border border-emerald-500/50 p-1 shadow-[0_0_20px_rgba(0,0,0,0.8)] relative">
                             {/* Header */}
                             <div className="flex justify-between items-center bg-zinc-900 p-2 border-b border-zinc-800 mb-2">
                                <h3 className={`font-bold tracking-widest ${activeCombatMenu === 'OFFENSE' ? 'text-rose-500' : 'text-sky-500'}`}>
                                    {activeCombatMenu === 'OFFENSE' ? 'ATTACK SUBROUTINES' : 'DEFENSE PROTOCOLS'}
                                </h3>
                                <button onClick={() => setActiveCombatMenu(null)} className="text-zinc-500 hover:text-white">
                                    [X]
                                </button>
                             </div>
                             
                             <div className="p-2 max-h-[60vh] overflow-y-auto">
                                {activeCombatMenu === 'OFFENSE' ? renderActionList(offensiveLoadout) : renderActionList(defensiveLoadout)}
                             </div>

                             <div className="text-[10px] text-zinc-600 font-mono text-center p-2 border-t border-zinc-900 mt-2">
                                SELECT PROTOCOL TO EXECUTE
                             </div>
                        </div>
                        {/* Click outside to close */}
                        <div className="absolute inset-0 -z-10" onClick={() => setActiveCombatMenu(null)}></div>
                    </div>
                )}

                {/* Left Col: Stats - Mobile: Top (Order 1), Desktop: Left (Order 1) */}
                <div className="md:col-span-4 flex flex-col gap-2 order-1 md:order-1 shrink-0">
                    {/* Enemy Card */}
                    <Panel borderColor="border-rose-900" bgColor="bg-black/90">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-rose-500 font-bold flex items-center gap-2"><Icons.User/> {enemy.name}</span>
                            {enemy.shield > 0 && <span className="text-[10px] bg-rose-900/20 px-2 py-0.5 rounded border border-rose-900 text-rose-300"><Icons.Shield /> {enemy.shield}</span>}
                        </div>
                        {enemyProfile && (
                            <div className="text-[10px] text-zinc-500 mb-2 flex items-center gap-2">
                                <span className="border border-rose-900/50 px-1 rounded text-rose-400">{enemyProfile.name}</span>
                                <span className="text-zinc-600">|</span>
                                <span>DEF: {enemyProfile.stats_modifier.defense}x</span>
                            </div>
                        )}
                        <ProgressBar current={enemy.hp} max={enemy.maxHp} color="bg-rose-600" label={t.game.integrity} showValue={true} />
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
                            <span className="text-emerald-500 font-bold flex items-center gap-2"><Icons.Terminal/> USER_[{user.id}]</span>
                            {player.shield > 0 && <span className="text-[10px] bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-900 text-emerald-300"><Icons.Shield /> {player.shield}</span>}
                        </div>
                        
                        <div className="space-y-3">
                            <ProgressBar current={player.hp} max={player.maxHp} color="bg-emerald-500" label={t.game.integrity} />
                            
                            <div>
                                <div className="text-[10px] text-emerald-700 mb-1 font-mono">{t.game.bandwidth}</div>
                                <div className="flex gap-1 h-4">
                                    {[...Array(player.maxAp)].map((_, i) => (
                                        <div key={i} className={`flex-1 border border-emerald-800 transition-all ${i < player.ap ? 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.5)]' : 'bg-transparent'}`}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Panel>

                    {/* Live Patching */}
                    <Panel borderColor="border-amber-900/50" className="text-center">
                        <div className="flex gap-2">
                            {[
                                { id: 'offense', label: t.game.atk, color: 'text-rose-400', border: 'border-rose-900' },
                                { id: 'defense', label: t.game.def, color: 'text-sky-400', border: 'border-sky-900' }
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
                                        <div className="text-[10px] text-zinc-500 mt-1">{cost} {t.game.bits}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </Panel>
                    
                    <div className="text-center font-mono text-xs font-bold text-emerald-100 bg-zinc-900/80 p-2 border border-emerald-900/50 rounded shadow-[0_0_10px_rgba(0,0,0,0.3)] tracking-wide">
                        <span className="text-emerald-500">{t.game.level}</span> {level} <span className="text-zinc-600 mx-2">{'//'}</span> <span className="text-emerald-500">{t.game.turn}</span> {turn}
                    </div>
                </div>

                {/* Right Col: Logs & Controls - Mobile: Bottom (Order 2), Desktop: Right (Order 2) */}
                <div className="md:col-span-8 flex flex-col gap-2 order-2 md:order-2 min-h-0 flex-1 md:h-full">
                    
                    {/* Terminal Log - Fixed height for ~3-4 lines */}
                    <div className="h-20 shrink-0 bg-black border border-zinc-800 p-2 font-mono text-xs overflow-y-auto shadow-inner relative">
                        <div className="absolute top-0 right-0 p-1 opacity-20 pointer-events-none">
                            <Icons.Terminal />
                        </div>
                        {logs.map((l) => (
                            <div key={l.id} className="mb-0.5 leading-tight">
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

                    {/* Controls (Category Buttons) */}
                    <div className="flex-1 min-h-0 flex flex-col justify-end pb-2">
                        <div className="grid grid-cols-2 gap-4 h-full md:max-h-60">
                            <button
                                onClick={() => setActiveCombatMenu('OFFENSE')}
                                disabled={!isPlayerTurn || offensiveLoadout.length === 0}
                                className={`
                                    flex flex-col items-center justify-center border-2 border-rose-900/80 bg-rose-950/10 
                                    hover:bg-rose-900/20 hover:border-rose-500 transition-all active:scale-[0.98] group
                                    disabled:opacity-30 disabled:grayscale
                                `}
                            >
                                <span className="text-3xl mb-2 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">⚔️</span>
                                <span className="font-bold text-xl text-rose-500 tracking-widest">ATTACK</span>
                                <span className="text-xs text-rose-800 font-mono mt-1">{offensiveLoadout.length} PROTOCOLS</span>
                            </button>

                            <button
                                onClick={() => setActiveCombatMenu('DEFENSE')}
                                disabled={!isPlayerTurn || defensiveLoadout.length === 0}
                                className={`
                                    flex flex-col items-center justify-center border-2 border-sky-900/80 bg-sky-950/10 
                                    hover:bg-sky-900/20 hover:border-sky-500 transition-all active:scale-[0.98] group
                                    disabled:opacity-30 disabled:grayscale
                                `}
                            >
                                <span className="text-3xl mb-2 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">🛡️</span>
                                <span className="font-bold text-xl text-sky-500 tracking-widest">DEFENSE</span>
                                <span className="text-xs text-sky-800 font-mono mt-1">{defensiveLoadout.length} PROTOCOLS</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderResult = () => (
        <div className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="space-y-2">
                    <h2 className="text-4xl font-bold text-rose-600 glitch-active">{t.result.connectionLost}</h2>
                    <p className="text-zinc-500 font-mono tracking-widest text-sm">{t.result.extractionComplete}</p>
                </div>

                <div className="border border-zinc-800 bg-zinc-900/30 p-6 space-y-3 font-mono text-sm">
                    <div className="flex justify-between text-zinc-400">
                        <span>{t.result.sectors}</span>
                        <span className="text-white">{level - 1}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                        <span>{t.result.turns}</span>
                        <span className="text-white">{turn}</span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                        <span>{t.result.mining}</span>
                        <span>+{minedBits.toFixed(1)}</span>
                    </div>
                    <div className="h-px bg-zinc-800 my-2"></div>
                    <div className="flex justify-between text-lg text-amber-400 font-bold">
                        <span>{t.result.total}</span>
                        <span>+{Math.floor(sessionBits)} {t.game.bits}</span>
                    </div>
                </div>

                <Button variant="primary" size="lg" className="w-full" onClick={() => setView('MENU')}>
                    {t.result.return}
                </Button>
            </div>
        </div>
    );

    // --- MAIN RENDER ---
    return (
        <div className={`min-h-screen relative flex flex-col selection:bg-emerald-500/30 ${glitch ? 'glitch-active' : ''}`}>
            {view !== 'RESULT' && <Header />}
            
            <main className="flex-1 flex flex-col relative z-10">
                {view === 'PROFILE_SELECT' && renderProfileSelect()}
                {view === 'MENU' && renderMenu()}
                {view === 'MARKET' && renderMarket()}
                {view === 'LOADOUT' && renderDeck()}
                {view === 'GAME' && renderCombat()}
                {view === 'RESULT' && renderResult()}
            </main>
        </div>
    );
}