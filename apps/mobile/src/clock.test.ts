import { describe, it, expect } from 'vitest';
import { clockIsOff, clockSummary, dayLabel, driftLabel, wrongDay } from './clock';

const clock = (serverDay: string | null, deviceDay: string, driftMs: number | null) => ({
  day: serverDay ?? deviceDay,
  serverDay,
  deviceDay,
  driftMs,
});

describe('dayLabel', () => {
  it('met la date en mots', () => {
    expect(dayLabel('2026-08-08')).toBe('8 août');
    expect(dayLabel('2026-01-01')).toBe('1 janvier');
  });

  it('ne décale pas la veille en repassant par UTC', () => {
    expect(dayLabel('2026-08-09')).toBe('9 août');
  });

  it('rend la chaîne telle quelle si elle est illisible', () => {
    expect(dayLabel('')).toBe('');
    expect(dayLabel('pas-une-date')).toBe('pas-une-date');
  });
});

describe('driftLabel', () => {
  it('sous la minute', () => {
    expect(driftLabel(30_000)).toBe('moins d’une minute');
  });

  it('en minutes, puis en heures', () => {
    expect(driftLabel(12 * 60_000)).toBe('12 min');
    expect(driftLabel(60 * 60_000)).toBe('1 h');
    expect(driftLabel(90 * 60_000)).toBe('1 h 30');
    expect(driftLabel((23 * 60 + 12) * 60_000)).toBe('23 h 12');
  });

  it('en jours au-delà de 24 h', () => {
    expect(driftLabel(24 * 60 * 60_000)).toBe('1 j');
    expect(driftLabel(25 * 60 * 60_000)).toBe('1 j 1 h');
  });

  it('ignore le sens du décalage', () => {
    expect(driftLabel(-12 * 60_000)).toBe('12 min');
  });
});

describe('wrongDay', () => {
  it('signale le désaccord de journée', () => {
    expect(wrongDay(clock('2026-08-09', '2026-08-08', -86_400_000))).toBe(true);
    expect(wrongDay(clock('2026-08-09', '2026-08-09', 1_000))).toBe(false);
  });

  it('ne conclut rien sans réponse du serveur', () => {
    expect(wrongDay(clock(null, '2026-08-08', null))).toBe(false);
  });
});

describe('clockIsOff', () => {
  it('tolère la latence réseau', () => {
    expect(clockIsOff(clock('2026-08-09', '2026-08-09', 4_000))).toBe(false);
  });

  it('signale un écart de plusieurs minutes', () => {
    expect(clockIsOff(clock('2026-08-09', '2026-08-09', 11 * 60_000))).toBe(true);
  });
});

describe('clockSummary', () => {
  it('dit le sens du décalage', () => {
    expect(clockSummary(clock('2026-08-09', '2026-08-09', 11 * 60_000))).toBe(
      'Décalée de 11 min, en avance',
    );
    expect(clockSummary(clock('2026-08-09', '2026-08-09', -11 * 60_000))).toBe(
      'Décalée de 11 min, en retard',
    );
  });

  it('reste sobre quand tout va bien', () => {
    expect(clockSummary(clock('2026-08-09', '2026-08-09', 500))).toBe('À l’heure');
  });

  it('distingue le serveur injoignable', () => {
    expect(clockSummary(clock(null, '2026-08-09', null))).toBe('Serveur injoignable');
  });
});
