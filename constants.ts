import { Software, Hardware, Skill, TargetProfile, PassiveTool } from './types';

export const CONFIG = {
    storageKey: 'bitshift_evolution_save_v8_ts',
    initialBits: 0,
    initialHp: 20,
    initialAp: 3,
    maxApCap: 5,
    miningBaseRate: 0.5,
    maxLoadout: 5 // Increased loadout size to accommodate more options
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
            invalidSave: "Invalid Save Format",
            profileInfo: "PROTECTION PROFILE"
        },
        profileSelect: {
            title: "SELECT SYSTEM TO PROTECT",
            subtitle: "Choose your architecture. Defines base stats and vulnerabilities.",
            select: "INITIALIZE SYSTEM",
            stats: "STATS MODIFIERS",
            vuln: "KNOWN VULNERABILITIES"
        },
        market: {
            title: "DARK WEB MARKET",
            back: "Back to Menu",
            hardware: "HARDWARE UPGRADES",
            neural: "NEURAL TRAINING",
            software: "ATTACK SOFTWARE",
            protection: "PROTECTION TOOLS (PASSIVE)",
            upgrade: "UPGRADE",
            need: "NEED",
            train: "TRAIN",
            buy: "BUY",
            owned: "OWNED",
            install: "INSTALL"
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
            miningRoutine: "Mining Routine",
            effective: "EFFECTIVE!",
            enemyAction: {
                defense: "Defense Protocol",
                drain: "Jamming Signal",
                heavy: "Critical Surge",
                attack: "Attack",
                wait: "System Recharging"
            }
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
            invalidSave: "Formato de Save Inválido",
            profileInfo: "PERFIL DE PROTEÇÃO"
        },
        profileSelect: {
            title: "SELECIONE O SISTEMA PARA PROTEGER",
            subtitle: "Escolha sua arquitetura. Define status base e vulnerabilidades.",
            select: "INICIALIZAR SISTEMA",
            stats: "MODIFICADORES DE STATUS",
            vuln: "VULNERABILIDADES CONHECIDAS"
        },
        market: {
            title: "MERCADO DARK WEB",
            back: "Voltar ao Menu",
            hardware: "UPGRADES DE HARDWARE",
            neural: "TREINAMENTO NEURAL",
            software: "SOFTWARE DE ATAQUE",
            protection: "FERRAMENTAS DE PROTEÇÃO (PASSIVAS)",
            upgrade: "MELHORAR",
            need: "PRECISA",
            train: "TREINAR",
            buy: "COMPRAR",
            owned: "POSSUÍDO",
            install: "INSTALAR"
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
            miningRoutine: "Rotina de Mineração",
            effective: "EFETIVO!",
            enemyAction: {
                defense: "Protocolo de Defesa",
                drain: "Sinal de Interferência",
                heavy: "Surto Crítico",
                attack: "Ataque",
                wait: "Recarregando Sistema"
            }
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

// --- DATA FROM JSON ---

export const PROFILES: TargetProfile[] = [
      {
        id: "pc_win_legacy",
        name: "PC Windows Legacy",
        description: "Sistema operacional antigo. Vulnerável a SMB exploits.",
        difficulty: "Hard",
        stats_modifier: { hp: 0.8, ap: 1.2, defense: 0.5 },
        vulnerability_level: "Critical",
        vulnerabilities: [
            { id: "vuln_smb", name: "SMB Exploit", severity: "Critical", description: "Execução remota de código." },
            { id: "vuln_no_patch", name: "OS Desatualizado", severity: "High", description: "Defesa reduzida em 30%." }
        ]
      },
      {
        id: "pc_mac_studio",
        name: "Mac Workstation",
        description: "Ambiente fechado e robusto. Boa defesa natural.",
        difficulty: "Easy",
        stats_modifier: { hp: 1.0, ap: 1.0, defense: 1.2 },
        vulnerability_level: "Low",
        vulnerabilities: [
            { id: "vuln_permissions", name: "Permissões Excessivas", severity: "Medium", description: "Apps não assinados podem rodar scripts." }
        ]
      },
      {
        id: "server_linux",
        name: "Linux Server (Debian)",
        description: "Espinha dorsal da web. Resistente, mas alvo de Brute Force.",
        difficulty: "Medium",
        stats_modifier: { hp: 1.2, ap: 1.1, defense: 1.0 },
        vulnerability_level: "Medium",
        vulnerabilities: [
            { id: "vuln_root_pwd", name: "Senha Root Fraca", severity: "High", description: "Vulnerável a Brute Force." },
            { id: "vuln_open_ssh", name: "Porta SSH Padrão", severity: "Medium", description: "Atrai ataques automatizados." }
        ]
      },
      {
        id: "db_sql",
        name: "SQL Database",
        description: "Armazena dados críticos. Alvo de Injections.",
        difficulty: "Very Hard",
        stats_modifier: { hp: 1.5, ap: 0.8, defense: 0.6 },
        vulnerability_level: "High",
        vulnerabilities: [
            { id: "vuln_sqli", name: "Injeção SQL", severity: "Critical", description: "Ataques 'INJECT' causam 200% dano." },
            { id: "vuln_unencrypted", name: "Dados em Plaintext", severity: "High", description: "Falha na defesa perde BITS." }
        ]
      },
      {
        id: "cloud_vm",
        name: "Cloud VM Instance",
        description: "Infraestrutura efêmera. Rápida recuperação (AP alto).",
        difficulty: "Medium",
        stats_modifier: { hp: 0.7, ap: 1.5, defense: 0.9 },
        vulnerability_level: "Medium",
        vulnerabilities: [
            { id: "vuln_misconfig", name: "Bucket S3 Público", severity: "Critical", description: "Vazamento total de dados." },
            { id: "vuln_api_key", name: "Chaves API Expostas", severity: "High", description: "Inimigo ganha AP extra." }
        ]
      },
      {
        id: "web_app",
        name: "Frontend Web App",
        description: "Porta de entrada pública. Suscetível a DDoS e XSS.",
        difficulty: "Hard",
        stats_modifier: { hp: 0.9, ap: 1.3, defense: 0.7 },
        vulnerability_level: "High",
        vulnerabilities: [
            { id: "vuln_xss", name: "XSS", severity: "Medium", description: "Dano contínuo por script." },
            { id: "vuln_ddos", name: "Sem Proteção DDoS", severity: "High", description: "Suscetível a perda de AP." }
        ]
      },
      {
        id: "iot_network",
        name: "IoT Mesh Network",
        description: "Dispositivos inseguros. Muito rápido (AP), mas frágil (HP).",
        difficulty: "Very Hard",
        stats_modifier: { hp: 0.5, ap: 2.0, defense: 0.3 },
        vulnerability_level: "Critical",
        vulnerabilities: [
            { id: "vuln_default_pwd", name: "Senha Padrão", severity: "Critical", description: "Defesa nula contra Dictionary Attacks." },
            { id: "vuln_no_update", name: "Firmware Obsoleto", severity: "Medium", description: "Não pode ser curado/reparado." }
        ]
      }
];

export const PASSIVES_DB: PassiveTool[] = [
    {
        id: "WAF_PRO",
        name: "WAF (Web App Firewall)",
        price: 300,
        effect: "Bloqueia ataques de Injeção.",
        compatible_profiles: ["web_app", "cloud_vm"]
      },
      {
        id: "PATCH_MANAGER",
        name: "Gerenciador de Patches",
        price: 500,
        effect: "Regenera HP passivamente.",
        compatible_profiles: ["pc_win_legacy", "server_linux", "db_sql"]
      },
      {
        id: "MFA_TOKEN",
        name: "Autenticação MFA",
        price: 250,
        effect: "Anula o 1º ataque crítico.",
        compatible_profiles: ["All"]
      }
];

export const SOFTWARE_DB: Record<string, Software> = {
    // Basic / Starter Cards (Standard)
    PING: { id: 'PING', name: 'PING', cost: 1, type: 'dmg', val: [2, 4], desc: 'Light Damage' },
    FIREWALL: { id: 'FIREWALL', name: 'FIREWALL', cost: 2, type: 'shield', val: 5, cooldown: 3, desc: '+5 Def (CD: 3)' },
    OVERCLOCK: { id: 'OVERCLOCK', name: 'OVERCLOCK', cost: 0, type: 'special', effect: 'swap', desc: '-3 HP / +3 AP' },
    
    // Starter Cards (Specialized - Now Free/Starter)
    SQL_INJECT: { id: 'SQL_INJECT', name: 'SQL_INJECT', cost: 3, type: 'dmg', val: [6, 10], desc: 'Crit vs DB', bonuses: ['db_sql'] },
    DDOS_PACKET: { id: 'DDOS_PACKET', name: 'DDOS_FLOOD', cost: 3, type: 'dmg', val: [5, 8], desc: 'Crit vs Web/Cloud', bonuses: ['web_app', 'cloud_vm'] },
    EXPLOIT_SMB: { id: 'EXPLOIT_SMB', name: 'SMB_EXPLOIT', cost: 3, type: 'dmg', val: [7, 11], desc: 'Crit vs WinLegacy', bonuses: ['pc_win_legacy'] },
    BRUTE_SSH: { id: 'BRUTE_SSH', name: 'BRUTE_SSH', cost: 2, type: 'risk', val: [8, 14], desc: 'Crit vs Linux', bonuses: ['server_linux'] },
    
    // Shop Items
    SIPHON: { id: 'SIPHON', name: 'VAMPIRE.exe', cost: 4, type: 'drain', val: [4, 6], price: 300, desc: 'Dmg + Heal 50%' },
    ROOT: { id: 'ROOT', name: 'ROOT_KIT', cost: 3, type: 'pierce', val: [5, 8], price: 500, desc: 'Ignores Shield' },
    BRUTE: { id: 'BRUTE', name: 'BRUTE_FORCE_PRO', cost: 3, type: 'risk', val: [12, 18], price: 400, desc: 'High Risk (30% Fail)' },
    VIRUS: { id: 'VIRUS', name: 'POLYMORPH.vbs', cost: 4, type: 'dmg', val: [8, 12], price: 800, cooldown: 2, desc: 'High Dmg (CD: 2)' },
    
    // Advanced Shop
    RANSOMWARE: { id: 'RANSOMWARE', name: 'CryptoLocker', cost: 4, type: 'dmg', val: [15, 20], price: 400, desc: 'Massive Dmg vs Data', bonuses: ['db_sql', 'pc_win_legacy'] },
    PHISHING: { id: 'PHISHING', name: 'Spear Phishing', cost: 2, type: 'dmg', val: [5, 8], price: 100, desc: 'Crit vs Users', bonuses: ['pc_win_legacy', 'pc_mac_studio'] },
    IOT_JAMMER: { id: 'IOT_JAMMER', name: 'IoT Jammer', cost: 2, type: 'dmg', val: [4, 12], price: 150, desc: 'Crit vs IoT', bonuses: ['iot_network'] },
    
    // Utilities
    AV_HEURISTIC: { id: 'AV_HEURISTIC', name: 'Heuristic AV', cost: 2, type: 'shield', val: 8, price: 150, desc: 'Active Scan (+8 Def)' },
    VPN_TUNNEL: { id: 'VPN_TUNNEL', name: 'VPN Tunnel', cost: 1, type: 'special', effect: 'evasion', price: 200, desc: 'Evasion +20%' }
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

