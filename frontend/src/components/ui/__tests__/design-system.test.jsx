import { describe, expect, it } from 'vitest';

import config from '../../../../tailwind.config';

describe('shared design tokens', () => {
  it('keeps the botanical print palette and hard shadows centralized', () => {
    expect(config.theme.extend.colors.lime.DEFAULT).toBe('#BDFF00');
    expect(config.theme.extend.colors.charcoal).toBe('#171713');
    expect(config.theme.extend.colors.botanical).toBe('#197A50');
    expect(config.theme.extend.colors.primary).toBe('#4F46E5');
    expect(config.theme.extend.colors['primary-container']).toBe('#BDFF00');
    expect(config.theme.extend.colors.secondary).toBe('#5C3DF5');
    expect(config.theme.extend.colors.coral).toBe('#FF6B4A');
    expect(config.theme.extend.colors.mint).toBe('#65D6AD');
    expect(config.theme.extend.boxShadow.hard).toBe('5px 5px 0px 0px #171713');
    expect(config.theme.extend.boxShadow['hard-lg']).toBe('8px 8px 0px 0px #171713');
  });

  it('uses Lexend for reading and a technical monospace stack', () => {
    expect(config.theme.extend.fontFamily.sans[0]).toBe('Lexend');
    expect(config.theme.extend.fontFamily.mono[0]).toBe('JetBrains Mono');
    expect(config.theme.extend.screens.xs).toBe('360px');
  });
});
