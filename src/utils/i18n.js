// i18n utility for multilingual support
const translations = {
  en: {
    // Common
    'common.search': 'Search',
    'common.logout': 'Logout',
    'common.settings': 'Settings',
    'common.notifications': 'Notifications',
    'common.profile': 'Profile',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.overview': 'Overview',
    'nav.properties': 'Properties',
    'nav.tenants': 'Tenants',
    'nav.payments': 'Payments',
    
    // Profile
    'profile.title': 'Profile Settings',
    'profile.personal': 'Personal Information',
    'profile.password': 'Change Password',
    'profile.notifications': 'Notification Preferences',
    'profile.language': 'Language',
    'profile.photo': 'Profile Photo',
    
    // Notifications
    'notifications.title': 'Notifications',
    'notifications.noNotifications': 'No notifications',
    'notifications.markAllRead': 'Mark all as read',
    'notifications.preferences': 'Notification Preferences',
    'notifications.email': 'Email Notifications',
    'notifications.inApp': 'In-App Notifications',
    'notifications.documentApproval': 'Document Approval',
    'notifications.paymentReminders': 'Payment Reminders',
    'notifications.contractDeadlines': 'Contract Deadlines',
    'notifications.statusChanges': 'Status Changes',
    
    // Language
    'language.select': 'Select Language',
    'language.english': 'English',
    'language.french': 'French',
  },
  fr: {
    // Common
    'common.search': 'Rechercher',
    'common.logout': 'Déconnexion',
    'common.settings': 'Paramètres',
    'common.notifications': 'Notifications',
    'common.profile': 'Profil',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    
    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.overview': 'Vue d\'ensemble',
    'nav.properties': 'Propriétés',
    'nav.tenants': 'Locataires',
    'nav.payments': 'Paiements',
    
    // Profile
    'profile.title': 'Paramètres du profil',
    'profile.personal': 'Informations personnelles',
    'profile.password': 'Changer le mot de passe',
    'profile.notifications': 'Préférences de notification',
    'profile.language': 'Langue',
    'profile.photo': 'Photo de profil',
    
    // Notifications
    'notifications.title': 'Notifications',
    'notifications.noNotifications': 'Aucune notification',
    'notifications.markAllRead': 'Tout marquer comme lu',
    'notifications.preferences': 'Préférences de notification',
    'notifications.email': 'Notifications par e-mail',
    'notifications.inApp': 'Notifications dans l\'application',
    'notifications.documentApproval': 'Approbation de document',
    'notifications.paymentReminders': 'Rappels de paiement',
    'notifications.contractDeadlines': 'Échéances de contrat',
    'notifications.statusChanges': 'Changements de statut',
    
    // Language
    'language.select': 'Sélectionner la langue',
    'language.english': 'Anglais',
    'language.french': 'Français',
  }
};

// Get current language from localStorage or default to 'en'
export const getLanguage = () => {
  return localStorage.getItem('language') || 'en';
};

// Set language
export const setLanguage = (lang) => {
  localStorage.setItem('language', lang);
  // Trigger language change event
  window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
};

// Translate function
export const t = (key, lang = null) => {
  const currentLang = lang || getLanguage();
  const keys = key.split('.');
  let value = translations[currentLang];
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  return value || key;
};

// Initialize language
if (!localStorage.getItem('language')) {
  // Try to detect browser language
  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'fr') {
    setLanguage('fr');
  } else {
    setLanguage('en');
  }
}

export default { getLanguage, setLanguage, t, translations };
