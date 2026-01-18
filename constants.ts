import { Software, Hardware, Skill } from './types';

export const CONFIG = {
    storageKey: 'bitshift_evolution_save_v6_ts',
    initialBits: 0,
    initialHp: 20,
    initialAp: 3,
    maxApCap: 5,
    miningBaseRate: 0.5,
    maxLoadout: 4
};

export const TRANSLATIONS = {
    'en-US': {
        header: {
            wallet: "Wallet Balance",
            total: "Total Available",
            saveExit: "SAVE & EXIT"
        },
        menu: {
            systemStatus: "System Status",
            cpu: "CPU",
            ram: "RAM",
            cooler: "COOLER",
            atk: "ATK",
            def: "DEF",
            initRun: "INITIALIZE RUN",
            resumeRun: "RESUME RUN",
            market: "MARKET",
            deck: "DECK",
            backup: "BACKUP DATA",
            restore: "RESTORE DATA",
            successRestore: "RESTORED SUCCESSFULLY",
            errorFile: "ERROR: CORRUPTED DATA FILE",
            invalidSave: "Invalid Save Format"
        },
        market: {
            title: "DARK WEB MARKET",
            back: "Back to Menu",
            hardware: "HARDWARE UPGRADES",
            neural: "NEURAL TRAINING",
            software: "SOFTWARE BLACK MARKET",
            upgrade: "UPGRADE",
            need: "NEED",
            train: "TRAIN",
            buy: "BUY",
            owned: "OWNED"
        },
        deck: {
            title: "LOADOUT CONFIG",
            confirm: "CONFIRM",
            slots: "SLOTS USED",
            equipped: "EQUIPPED"
        },
        game: {
            integrity: "INTEGRITY",
            bandwidth: "BANDWIDTH (AP)",
            livePatch: "LIVE PATCHING",
            level: "LEVEL",
            turn: "TURN",
            atk: "ATK",
            def: "DEF",
            bits: "BITS",
            sysBusy: "System busy",
            insufficientAp: "Insufficient Bandwidth (AP)",
            targetLocked: "Target locked",
            connectionEst: "Connection established",
            targetNeut: "Target neutralized",
            bitsObtained: "BITS obtained",
            sessionResumed: "SESSION RESUMED",
            insufficientFunds: "Insufficient funds for patch",
            patchUpdated: "UPDATED",
            miningRoutine: "Mining Routine"
        },
        result: {
            connectionLost: "CONNECTION_LOST",
            extractionComplete: "DATA EXTRACTION COMPLETE",
            sectors: "SECTORS CLEARED",
            turns: "TURNS SURVIVED",
            mining: "MINING YIELD",
            total: "TOTAL EARNINGS",
            return: "RETURN TO ROOT"
        }
    },
    'pt-BR': {
        header: {
            wallet: "Saldo da Carteira",
            total: "Total Disponível",
            saveExit: "SALVAR & SAIR"
        },
        menu: {
            systemStatus: "Status do Sistema",
            cpu: "CPU",
            ram: "RAM",
            cooler: "RESFR.",
            atk: "ATQ",
            def: "DEF",
            initRun: "INICIAR EXECUÇÃO",
            resumeRun: "RETOMAR EXECUÇÃO",
            market: "MERCADO",
            deck: "DECK",
            backup: "BACKUP DE DADOS",
            restore: "RESTAURAR DADOS",
            successRestore: "RESTAURADO COM SUCESSO",
            errorFile: "ERRO: ARQUIVO CORROMPIDO",
            invalidSave: "Formato de Save Inválido"
        },
        market: {
            title: "MERCADO DARK WEB",
            back: "Voltar ao Menu",
            hardware: "UPGRADES DE HARDWARE",
            neural: "TREINAMENTO NEURAL",
            software: "MERCADO NEGRO DE SOFTWARE",
            upgrade: "MELHORAR",
            need: "PRECISA",
            train: "TREINAR",
            buy: "COMPRAR",
            owned: "POSSUÍDO"
        },
        deck: {
            title: "CONFIGURAÇÃO DE LOADOUT",
            confirm: "CONFIRMAR",
            slots: "SLOTS USADOS",
            equipped: "EQUIPADO"
        },
        game: {
            integrity: "INTEGRIDADE",
            bandwidth: "LARGURA DE BANDA (AP)",
            livePatch: "PATCH EM TEMPO REAL",
            level: "NÍVEL",
            turn: "TURNO",
            atk: "ATQ",
            def: "DEF",
            bits: "BITS",
            sysBusy: "Sistema ocupado",
            insufficientAp: "Largura de Banda Insuficiente",
            targetLocked: "Alvo travado",
            connectionEst: "Conexão estabelecida",
            targetNeut: "Alvo neutralizado",
            bitsObtained: "BITS obtidos",
            sessionResumed: "SESSÃO RETOMADA",
            insufficientFunds: "Fundos insuficientes para patch",
            patchUpdated: "ATUALIZADO",
            miningRoutine: "Rotina de Mineração"
        },
        result: {
            connectionLost: "CONEXÃO_PERDIDA",
            extractionComplete: "EXTRAÇÃO DE DADOS COMPLETA",
            sectors: "SETORES LIMPOS",
            turns: "TURNOS SOBREVIVIDOS",
            mining: "RENDIMENTO DE MINERAÇÃO",
            total: "GANHOS TOTAIS",
            return: "RETORNAR AO ROOT"
        }
    }
};

export const RANKS = [
    { lvl: 0, title: "Script Kiddie", xp: 0 },
    { lvl: 1, title: "Hacktivist", xp: 500 },
    { lvl: 2, title: "Grey Hat", xp: 1500 },
    { lvl: 3, title: "Netrunner", xp: 3000 },
    { lvl: 4, title: "Cyber God", xp: 6000 },
    { lvl: 5, title: "Singularity", xp: 12000 }
];

export const ENEMY_NAMES = ['GUEST', 'PROXY', 'GATEWAY', 'SENTRY', 'DAEMON', 'MAINFRAME', 'AI_CORE', 'OVERMIND'];

export const SOFTWARE_DB: Record<string, Software> = {
    // Starters
    PING: { id: 'PING', name: 'PING', cost: 1, type: 'dmg', val: [2, 4], desc: 'Light Damage' },
    INJECT: { id: 'INJECT', name: 'INJECT', cost: 3, type: 'dmg', val: [6, 10], desc: 'Heavy Damage' },
    FIREWALL: { id: 'FIREWALL', name: 'FIREWALL', cost: 2, type: 'shield', val: 5, cooldown: 3, desc: '+5 Def (CD: 3)' },
    OVERCLOCK: { id: 'OVERCLOCK', name: 'OVERCLOCK', cost: 0, type: 'special', effect: 'swap', desc: '-3 HP / +3 AP' },
    
    // Shop
    SIPHON: { id: 'SIPHON', name: 'VAMPIRE.exe', cost: 4, type: 'drain', val: [4, 6], price: 300, desc: 'Dmg + Heal 50%' },
    ROOT: { id: 'ROOT', name: 'ROOT_KIT', cost: 3, type: 'pierce', val: [5, 8], price: 500, desc: 'Ignores Shield' },
    BRUTE: { id: 'BRUTE', name: 'BRUTE_FORCE', cost: 3, type: 'risk', val: [10, 15], price: 400, desc: 'High Risk (30% Fail)' },
    VIRUS: { id: 'VIRUS', name: 'POLYMORPH.vbs', cost: 4, type: 'dmg', val: [8, 12], price: 800, cooldown: 2, desc: 'High Dmg (CD: 2)' }
};

export const HARDWARE_DB: Hardware[] = [
    { 
        id: 'cpu', 
        name: 'Neuro-CPU', 
        desc: '+Base Dmg & Mining Rate', 
        baseCost: 100, 
        costMult: 2, 
        effect: (level) => `Dmg +${level} | Mine +${(level * 0.2).toFixed(1)}`
    },
    { 
        id: 'ram', 
        name: 'Quantum RAM', 
        desc: '+5 Max HP', 
        baseCost: 50, 
        costMult: 1, 
        linear: true,
        effect: (level) => `HP +${level * 5}`
    },
    { 
        id: 'cooler', 
        name: 'Cryo-Cooler', 
        desc: '+Start AP (Energy)', 
        baseCost: 150, 
        costMult: 1,
        linear: true,
        effect: (level) => `Start AP +${Math.floor(level / 2)}`
    }
];

export const SKILLS_DB: Record<string, Skill> = {
    offense: {
        id: 'offense',
        name: 'EXPL0IT PROTOCOLS',
        color: 'text-rose-400',
        desc: 'Increase Crit & Stability',
        baseCost: 200,
        stats: (lvl) => `CRIT: +${lvl * 5}% | STABLE: +${lvl * 4}%`
    },
    defense: {
        id: 'defense',
        name: 'ENCRYPTION LAYERS',
        color: 'text-sky-400',
        desc: 'Increase Shield & Mitigation',
        baseCost: 200,
        stats: (lvl) => `SHIELD: +${lvl * 10}% | MITIGATE: +${lvl * 5}%`
    }
};