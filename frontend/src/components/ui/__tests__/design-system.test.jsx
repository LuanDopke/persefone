import { describe, expect, it } from 'vitest';

import config from '../../../../tailwind.config';

describe('shared design tokens', () => {
  it('keeps the Chlorophyll Noir palette and hard shadows centralized', () => {
    expect(config.theme.extend.colors.lime.DEFAULT).toBe('#BDFF00');
    expect(config.theme.extend.colors.charcoal).toBe('#1A1A1A');
    expect(config.theme.extend.colors.botanical).toBe('#247A47');
    expect(config.theme.extend.colors.amber).toBe('#D97706');
    expect(config.theme.extend.colors.critical).toBe('#B91C1C');
    expect(config.theme.extend.boxShadow.hard).toBe('4px 4px 0px 0px #1A1A1A');
    expect(config.theme.extend.boxShadow['hard-lg']).toBe('6px 6px 0px 0px #1A1A1A');
  });

  it('uses Lexend for reading and a technical monospace stack', () => {
    expect(config.theme.extend.fontFamily.sans[0]).toBe('Lexend');
    expect(config.theme.extend.fontFamily.mono[0]).toBe('JetBrains Mono');
    expect(config.theme.extend.screens.xs).toBe('360px');
  });
});
