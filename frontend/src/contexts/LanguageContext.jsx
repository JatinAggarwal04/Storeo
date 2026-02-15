
import { createContext, useContext, useState } from 'react'

const LanguageContext = createContext()

export function useLanguage() {
    return useContext(LanguageContext)
}

export const LANGUAGES = {
    en: { name: 'English', dir: 'ltr' },
    hi: { name: 'Hindi', dir: 'ltr' },
    pa: { name: 'Punjabi', dir: 'ltr' },
    kn: { name: 'Kannada', dir: 'ltr' }
}

const TRANSLATIONS = {
    en: {
        setupTitle: 'Set Up Your Business',
        setupSubtitle: 'Tell us a bit about your business to get started.',
        businessName: 'Business Name',
        businessType: 'Business Type',
        whatsappNumber: 'WhatsApp Number',
        language: 'Language',
        submit: 'Complete Setup',
        errorRequired: 'This field is required'
    },
    hi: {
        setupTitle: 'अपना व्यवसाय सेटअप करें',
        setupSubtitle: 'शुरू करने के लिए हमें अपने व्यवसाय के बारे में थोड़ा बताएं।',
        businessName: 'व्यवसाय का नाम',
        businessType: 'व्यवसाय का प्रकार',
        whatsappNumber: 'व्हाट्सएप नंबर',
        language: 'भाषा',
        submit: 'सेटअप पूरा करें',
        errorRequired: 'यह फ़ील्ड आवश्यक है'
    },
    pa: {
        setupTitle: 'ਆਪਣਾ ਕਾਰੋਬਾਰ ਸੈੱਟਅੱਪ ਕਰੋ',
        setupSubtitle: 'ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਸਾਨੂੰ ਆਪਣੇ ਕਾਰੋਬਾਰ ਬਾਰੇ ਥੋੜ੍ਹਾ ਦੱਸੋ।',
        businessName: 'ਕਾਰੋਬਾਰ ਦਾ ਨਾਮ',
        businessType: 'ਕਾਰੋਬਾਰ ਦੀ ਕਿਸਮ',
        whatsappNumber: 'ਵਟਸਐਪ ਨੰਬਰ',
        language: 'ਭਾਸ਼ਾ',
        submit: 'ਸੈੱਟਅੱਪ ਪੂਰਾ ਕਰੋ',
        errorRequired: 'ਇਹ ਖੇਤਰ ਲਾਜ਼ਮੀ ਹੈ'
    },
    kn: {
        setupTitle: 'ನಿಮ್ಮ ವ್ಯವಹಾರವನ್ನು ಹೊಂದಿಸಿ',
        setupSubtitle: 'ಪ್ರಾರಂಭಿಸಲು ನಿಮ್ಮ ವ್ಯವಹಾರದ ಬಗ್ಗೆ ನಮಗೆ ಸ್ವಲ್ಪ ತಿಳಿಸಿ.',
        businessName: 'ವ್ಯವಹಾರದ ಹೆಸರು',
        businessType: 'ವ್ಯವಹಾರದ ಪ್ರಕಾರ',
        whatsappNumber: 'ವಾಟ್ಸಾಪ್ ಸಂಖ್ಯೆ',
        language: 'ಭಾಷೆ',
        submit: 'ಸೆಟಪ್ ಪೂರ್ಣಗೊಳಿಸಿ',
        errorRequired: 'ಈ ಕ್ಷೇತ್ರವನ್ನು ಭರ್ತಿ ಮಾಡುವುದು ಕಡ್ಡಾಯ'
    }
}

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en')

    const t = (key) => {
        return TRANSLATIONS[language][key] || TRANSLATIONS['en'][key] || key
    }

    const value = {
        language,
        setLanguage,
        t,
        LANGUAGES
    }

    return (
        <LanguageContext.Provider value={value}>
            <div dir={LANGUAGES[language].dir}>
                {children}
            </div>
        </LanguageContext.Provider>
    )
}
