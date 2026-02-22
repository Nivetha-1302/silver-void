import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const SettingsContext = createContext();

// Simple Translation Dictionary
const translations = {
    en: {
        "Dashboard": "Dashboard",
        "Settings": "Settings",
        "Log Out": "Log Out",
        "Employee Management": "Employee Management",
        "Company Settings": "Company Settings",
        "Global Configuration & Preferences": "Global Configuration & Preferences",
        "Save Changes": "Save Changes",
        "General & Appearance": "General & Appearance",
        "Notifications": "Notifications",
        "Privacy & Security": "Privacy & Security",
        "AI Intelligence": "AI Intelligence",
        "Data Retention policy": "Data Retention policy"
    },
    es: {
        "Dashboard": "Tablero",
        "Settings": "Ajustes",
        "Log Out": "Cerrar Sesión",
        "Employee Management": "Gestión de Empleados",
        "Company Settings": "Configuración de la Compañía",
        "Global Configuration & Preferences": "Configuración Global y Preferencias",
        "Save Changes": "Guardar Cambios",
        "General & Appearance": "General y Apariencia",
        "Notifications": "Notificaciones",
        "Privacy & Security": "Privacidad y Seguridad",
        "AI Intelligence": "Inteligencia Artificial",
        "Data Retention policy": "Política de Retención de Datos"
    },
    fr: {
        "Dashboard": "Tableau de Bord",
        "Settings": "Paramètres",
        "Log Out": "Déconnexion",
        "Employee Management": "Gestion des Employés",
        "Company Settings": "Paramètres de l'Entreprise",
        "Global Configuration & Preferences": "Configuration Globale et Préférences",
        "Save Changes": "Enregistrer les Modifications",
        "General & Appearance": "Général et Apparence",
        "Notifications": "Notifications",
        "Privacy & Security": "Confidentialité et Sécurité",
        "AI Intelligence": "Intelligence Artificielle",
        "Data Retention policy": "Politique de Rétention des Données"
    },
    de: {
        "Dashboard": "Instrumententafel",
        "Settings": "Einstellungen",
        "Log Out": "Abmelden",
        "Employee Management": "Mitarbeiterverwaltung",
        "Company Settings": "Unternehmenseinstellungen",
        "Global Configuration & Preferences": "Globale Konfiguration & Einstellungen",
        "Save Changes": "Änderungen Speichern",
        "General & Appearance": "Allgemeines & Erscheinungsbild",
        "Notifications": "Benachrichtigungen",
        "Privacy & Security": "Datenschutz & Sicherheit",
        "AI Intelligence": "KI-Intelligenz",
        "Data Retention policy": "Datenaufbewahrungsrichtlinie"
    }
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        // Load from local storage or defaults
        const saved = localStorage.getItem('appSettings');
        return saved ? JSON.parse(saved) : {
            theme: 'light',
            language: 'en',
            notifications: {
                email: true,
                push: true,
                tasks: true,
                marketing: false
            },
            privacy: {
                biometricStrict: false,
                sessionTimeout: '30',
                cameraBlur: true
            },
            ai: {
                autoTune: true,
                burnoutSensitivity: 'medium',
                coaching: true
            },
            data: {
                autoArchive: '60'
            }
        };
    });

    // Apply Side Effects (Theme)
    useEffect(() => {
        const root = window.document.documentElement;
        if (settings.theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('appSettings', JSON.stringify(settings));
    }, [settings]);

    // Update Settings Helper
    const updateSettings = (category, field, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: typeof prev[category] === 'object' ? { ...prev[category], [field]: value } : value
        }));
    };

    const saveSettings = () => {
        toast.success("System Settings Applied Globaly");
        localStorage.setItem('appSettings', JSON.stringify(settings));
    };

    // Translation Hook inside Context
    const t = (key) => {
        return translations[settings.language]?.[key] || key;
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, saveSettings, t }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
