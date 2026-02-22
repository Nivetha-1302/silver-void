/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: 'var(--background)',
                surface: 'var(--surface)',
                surfaceAlt: 'var(--surface-alt)',
                primary: 'var(--primary)',
                secondary: 'var(--secondary)',
                success: 'var(--success)',
                warning: 'var(--warning)',
                danger: 'var(--danger)',
                text: 'var(--text)',
                textSecondary: 'var(--text-secondary)',
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
