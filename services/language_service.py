import re


# Unicode ranges for Indian scripts
DEVANAGARI_RANGE = r'\u0900-\u097F'  # Hindi
GURMUKHI_RANGE = r'\u0A00-\u0A7F'   # Punjabi
KANNADA_RANGE = r'\u0C80-\u0CFF'    # Kannada

HINDI_MARKERS = [
    "kya", "hai", "mujhe", "chahiye", "kitna", "kitne", "aur",
    "nahi", "haan", "ji", "bhai", "dukan", "saman", "paisa",
    "rupee", "rupaye", "theek", "accha", "bahut", "dhanyavaad",
    "namaste", "bolo", "batao", "dikha", "lena", "dena", "order",
    "chahie", "dikhao", "kitne", "price", "wala", "wali", "karo",
    "abhi", "jaldi", "please", "bhejo", "milega", "available",
]


def detect_language(text: str) -> str:
    """
    Detect language from text. Returns: 'English', 'Hindi', 'Hinglish', 'Punjabi', 'Kannada'
    Hinglish = Hindi meaning in Roman/Latin script (how Indians text)
    """
    if not text or not text.strip():
        return "English"

    devanagari_count = len(re.findall(f'[{DEVANAGARI_RANGE}]', text))
    gurmukhi_count = len(re.findall(f'[{GURMUKHI_RANGE}]', text))
    kannada_count = len(re.findall(f'[{KANNADA_RANGE}]', text))
    latin_count = len(re.findall(r'[a-zA-Z]', text))

    # Non-Latin scripts take priority
    if gurmukhi_count > 0 and gurmukhi_count >= max(devanagari_count, kannada_count):
        return "Punjabi"
    if kannada_count > 0 and kannada_count >= max(devanagari_count, gurmukhi_count):
        return "Kannada"
    if devanagari_count > 0 and devanagari_count >= max(gurmukhi_count, kannada_count):
        return "Hindi"

    # Check for Hinglish: Hindi markers in purely Latin script
    if latin_count > 0:
        text_lower = text.lower()
        words = text_lower.split()
        hindi_word_count = sum(1 for w in HINDI_MARKERS if w in words)
        # Hinglish: multiple Hindi marker words, but no Devanagari script
        if hindi_word_count >= 2 and devanagari_count == 0:
            return "Hinglish"

    return "English"


LANGUAGE_PROMPTS = {
    "English": "Respond in clear, simple English.",
    "Hindi": "Respond in Hindi (Devanagari script). Use simple everyday Hindi.",
    "Hinglish": "Respond in Hinglish — Hindi words written in Roman/English script, mixed naturally with English, the way Indians text each other. Example: 'Bilkul! Aapka order confirm ho gaya 😊 Koi aur help chahiye?'",
    "Punjabi": "Respond in Punjabi (Gurmukhi script). Use simple everyday Punjabi.",
    "Kannada": "Respond in Kannada (Kannada script). Use simple everyday Kannada.",
}


def get_language_instruction(language: str) -> str:
    """Get the language instruction for AI prompts."""
    return LANGUAGE_PROMPTS.get(language, LANGUAGE_PROMPTS["English"])
