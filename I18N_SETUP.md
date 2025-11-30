# Multi-Language Support (i18n) Setup Guide

## 📦 Installation

First, install the required dependencies:

```bash
cd d:\gthai-mobile
npm install i18next react-i18next
```

## 🌍 Available Languages

- 🇹🇭 Thai (ไทย) - Default
- 🇬🇧 English
- 🇨🇳 Chinese (中文)
- 🇯🇵 Japanese (日本語)

## 📁 File Structure

```
src/
├── locales/
│   ├── th.json    # Thai translations
│   ├── en.json    # English translations
│   ├── zh.json    # Chinese translations
│   └── ja.json    # Japanese translations
├── components/
│   └── LanguageSelector.jsx  # Language switcher component
└── i18n.js        # i18n configuration
```

## 🚀 Usage in Components

### Import and use translations:

```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
    const { t } = useTranslation();
    
    return (
        <div>
            <h1>{t('nav.home')}</h1>
            <p>{t('common.loading')}</p>
        </div>
    );
}
```

### Add Language Selector to Header:

In `src/components/Header.jsx`, add:

```javascript
import LanguageSelector from './LanguageSelector';

// In the render/return section, add:
<LanguageSelector />
```

## 📝 Adding New Translations

1. Open the appropriate language file in `src/locales/`
2. Add your key-value pairs following the existing structure
3. Use the same keys across all language files

Example:
```json
{
  "mySection": {
    "myKey": "My translated text"
  }
}
```

## 🎨 Example: Update BottomNav Component

```javascript
import { useTranslation } from 'react-i18next';

const BottomNav = () => {
    const { t } = useTranslation();
    
    return (
        <nav>
            <Link to="/">{t('nav.home')}</Link>
            <Link to="/favourites">{t('nav.favourites')}</Link>
            <Link to="/special">{t('nav.special')}</Link>
            <Link to="/chat">{t('nav.chat')}</Link>
            <Link to="/profile">{t('nav.profile')}</Link>
        </nav>
    );
};
```

## 💾 Language Persistence

The selected language is automatically saved to `localStorage` and will persist across sessions.

## 🔧 Configuration

The i18n configuration is in `src/i18n.js`:
- Default language: Thai (th)
- Fallback language: Thai (th)
- Language preference is saved to localStorage

## 📱 Mobile Responsive

The LanguageSelector component is fully responsive and works on both desktop and mobile devices.

## 🎯 Next Steps

1. Install dependencies: `npm install i18next react-i18next`
2. Add `<LanguageSelector />` to your Header component
3. Replace hardcoded text with `t('key.path')` in your components
4. Test language switching functionality

## 🌟 Tips

- Keep translation keys consistent across all language files
- Use nested objects to organize translations by feature/section
- Test all languages to ensure translations are complete
- Consider using translation keys that describe the content (e.g., `auth.loginButton` instead of `button1`)

---

**Created by:** Antigravity AI
**Date:** 2025-11-30
