export type ViewState = 'MENU' | 'GAME' | 'MARKET' | 'LOADOUT' | 'RESULT' | 'PROFILE_SELECT';

export type Language = 'en-US' | 'pt-BR';

export type SoftwareType = 'dmg' | 'shield' | 'special' | 'drain' | 'pierce' | 'risk';

export interface Software {
    id: string;
    name: string;
    cost: number;
    type: SoftwareType;
    val?: number | [number, number]; // Fixed value or range [min, max]
    effect?: string;
    cooldown?: number;
    desc: string;
    price?: number;
    bonuses?: string[]; // IDs of TargetProfiles this software is effective against
}

export interface Hardware {
    id: 'cpu' | 'ram' | 'cooler';
    name: string;
    desc: string;
    baseCost: number;
    costMult: number;
    linear?: boolean;
    effect: (level: number) => string;
}

export interface Skill {
    id: 'offense' | 'defense';
    name: string;
    color: string;
    desc: string;
    baseCost: number;
    stats: (level: number) => string;
}

export interface LogEntry {
    id: string;
    time: string;
    text: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'system';
}

export interface EntityState {
    hp: number;
    maxHp: number;
    ap: number;
    maxAp: number;
    shield: number;
    name: string;
    cooldowns: Record<string, number>;
    profileId?: string; // The architectural profile of the entity
}

export interface TargetProfile {
    id: string;
    name: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
    stats_modifier: { hp: number; ap: number; defense: number };
    vulnerability_level: string;
    vulnerabilities: { id: string; name: string; severity: string; description: string }[];
}

export interface PassiveTool {
    id: string;
    name: string;
    price: number;
    effect: string;
    compatible_profiles: string[]; // 'All' or profile IDs
}

export interface UserState {
    id: string;
    profileId?: string; // Selected Target Profile
    bits: number;
    xp: number;
    hardware: {
        cpu: number;
        ram: number;
        cooler: number;
    };
    skills: {
        offense: number;
        defense: number;
    };
    inventory: string[];
    passives: string[]; // List of installed PassiveTool IDs
    loadout: string[];
    stats: {
        games: number;
        maxLevel: number;
    };
    activeRun?: {
        level: number;
        sessionBits: number;
        minedBits: number;
        sessionUpgrades: { offense: number; defense: number };
        player: EntityState;
        enemy: EntityState;
        turn: number;
        logs: LogEntry[];
    };
}

export interface CombatStats {
    maxHp: number;
    dmgBonus: number;
    startAp: number;
    miningRate: number;
    critChance: number;
    critMult: number;
    unstableChance: number;
    shieldMult: number;
    mitigationChance: number;
    defenseModifier: number; // From Profile
}