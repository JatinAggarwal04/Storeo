import re


# Unicode ranges for Indian scripts
DEVANAGARI_RANGE = r'\u0900-\u097F'  # Hindi
GURMUKHI_RANGE = r'\u0A00-\u0A7F'   # Punjabi
KANNADA_RANGE = r'\u0C80-\u0CFF'    # Kannada


def detect_language(text: str) -> str:
    """
    Detect language from text using script-based heuristics.
    Returns one of: 'English', 'Hindi', 'Punjabi', 'Kannada'
    """
    if not text or not text.strip():
        return "English"

    # Count characters in each script
    devanagari_count = len(re.findall(f'[{DEVANAGARI_RANGE}]', text))
    gurmukhi_count = len(re.findall(f'[{GURMUKHI_RANGE}]', text))
    kannada_count = len(re.findall(f'[{KANNADA_RANGE}]', text))
    latin_count = len(re.findall(r'[a-zA-Z]', text))

    total_script = devanagari_count + gurmukhi_count + kannada_count + latin_count

    if total_script == 0:
        return "English"

    # If non-Latin script dominates
    if gurmukhi_count > 0 and gurmukhi_count >= max(devanagari_count, kannada_count):
        return "Punjabi"
    if kannada_count > 0 and kannada_count >= max(devanagari_count, gurmukhi_count):
        return "Kannada"
    if devanagari_count > 0 and devanagari_count >= max(gurmukhi_count, kannada_count):
        return "Hindi"

    # Check for romanized Hindi/Punjabi common words
    text_lower = text.lower()
    hindi_markers = [
        "kya", "hai", "mujhe", "chahiye", "kitna", "kitne", "aur",
        "nahi", "haan", "ji", "bhai", "dukan", "saman", "paisa",
        "rupee", "rupaye", "theek", "accha", "bahut", "dhanyavaad",
        "namaste", "bolo", "batao", "dikha", "do", "lena", "dena",
    ]
    hindi_word_count = sum(1 for w in hindi_markers if w in text_lower.split())
    if hindi_word_count >= 2:
        return "Hindi"

    return "English"


LANGUAGE_PROMPTS = {
    "English": "Respond in clear, simple English.",
    "Hindi": "Respond in Hindi (Devanagari script). Use simple everyday Hindi.",
    "Punjabi": "Respond in Punjabi (Gurmukhi script). Use simple everyday Punjabi.",
    "Kannada": "Respond in Kannada (Kannada script). Use simple everyday Kannada.",
}


def get_language_instruction(language: str) -> str:
    """Get the language instruction for Claude prompts."""
    return LANGUAGE_PROMPTS.get(language, LANGUAGE_PROMPTS["English"])
