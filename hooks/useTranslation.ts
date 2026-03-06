import { useApp } from '../contexts/AppContext';
import { getTranslation, TranslationKey } from '../constants/translations';

export function useTranslation() {
  const { language } = useApp();
  const t = getTranslation(language);
  return { t, language };
}
