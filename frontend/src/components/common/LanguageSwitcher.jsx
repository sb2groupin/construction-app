// frontend/src/components/common/LanguageSwitcher.jsx
import { useTranslation } from 'react-i18next';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'EN', title: 'English' },
  { code: 'hi', label: 'HI', title: 'Hindi' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const currentLanguage = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const isActive = (lng) => currentLanguage.startsWith(lng);

  return (
    <div className="language-switcher" role="group" aria-label="Language switcher">
      {LANGUAGE_OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => changeLanguage(option.code)}
          className={isActive(option.code) ? 'active' : ''}
          aria-pressed={isActive(option.code)}
          title={option.title}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
