import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Traducciones reales (español por defecto) para buscar por texto visible.
import '../i18n';

afterEach(() => {
  cleanup();
});
