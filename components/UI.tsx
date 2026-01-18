import React from 'react';

// --- Icons ---
export const Icons = {
    Terminal: () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>,
    Shield: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
    Cpu: () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>,
    Disc: () => <svg className="w-4 h-4 inline-block mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>,
    User: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    Lock: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
    Zap: () => <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
};

// --- Panel ---
export const Panel: React.FC<{ 
    children: React.ReactNode; 
    className?: string; 
    title?: React.ReactNode;
    borderColor?: string;
    bgColor?: string;
}> = ({ children, className = '', title, borderColor = 'border-emerald-800', bgColor = 'bg-black/80' }) => (
    <div className={`border ${borderColor} ${bgColor} backdrop-blur-sm p-4 relative glow-border ${className}`}>
        {title && (
            <div className={`absolute -top-3 left-4 px-2 bg-black text-xs font-bold tracking-widest uppercase ${borderColor.replace('border', 'text')}`}>
                {title}
            </div>
        )}
        {children}
    </div>
);

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'danger' | 'warning' | 'ghost' | 'market';
    size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', disabled, ...props }) => {
    const baseStyle = "font-bold tracking-wide transition-all duration-200 border relative overflow-hidden group active:scale-[0.98]";
    
    const variants = {
        primary: "border-emerald-600 text-emerald-400 hover:bg-emerald-900/30 hover:text-emerald-300 disabled:border-emerald-900/50 disabled:text-emerald-900",
        danger: "border-rose-600 text-rose-400 hover:bg-rose-900/30 hover:text-rose-300",
        warning: "border-amber-600 text-amber-400 hover:bg-amber-900/30 hover:text-amber-300",
        ghost: "border-transparent text-zinc-500 hover:text-zinc-300",
        market: "border-violet-600 text-violet-400 hover:bg-violet-900/30 hover:text-violet-300"
    };

    const sizes = {
        sm: "px-3 py-1 text-xs",
        md: "px-6 py-3 text-sm",
        lg: "px-8 py-4 text-lg"
    };

    return (
        <button 
            className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
            disabled={disabled}
            {...props}
        >
            <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
            {!disabled && <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 transition-opacity"></div>}
        </button>
    );
};

// --- Progress Bar ---
export const ProgressBar: React.FC<{ 
    current: number; 
    max: number; 
    color?: string; 
    label?: string;
    showValue?: boolean;
}> = ({ current, max, color = 'bg-emerald-500', label, showValue = true }) => {
    const percent = Math.min(100, Math.max(0, (current / max) * 100));
    
    return (
        <div className="w-full">
            {(label || showValue) && (
                <div className="flex justify-between text-xs mb-1 font-mono opacity-80">
                    <span>{label}</span>
                    {showValue && <span>{current}/{max}</span>}
                </div>
            )}
            <div className="h-3 w-full bg-zinc-900/80 border border-zinc-800 relative overflow-hidden">
                <div 
                    className={`h-full ${color} transition-all duration-300 ease-out`}
                    style={{ width: `${percent}%` }}
                ></div>
                {/* Stripe effect overlay */}
                <div className="absolute inset-0 opacity-20" style={{ 
                    backgroundImage: 'linear-gradient(45deg,rgba(0,0,0,.3) 25%,transparent 25%,transparent 50%,rgba(0,0,0,.3) 50%,rgba(0,0,0,.3) 75%,transparent 75%,transparent)', 
                    backgroundSize: '4px 4px' 
                }}></div>
            </div>
        </div>
    );
};
