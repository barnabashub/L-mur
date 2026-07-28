import { describe, expect, it } from 'vitest';
import { formatLatLng, isValidLatLng, toPlace } from '@/lib/geocode-utils';

describe('toPlace', () => {
  it('POI nevéből és a településből épít nevet', () => {
    const p = toPlace({
      lat: '47.5022',
      lon: '19.0344',
      name: 'Halászbástya',
      display_name: 'Halászbástya, Szentháromság tér, Budapest, 1014, Magyarország',
      address: { city: 'Budapest', country: 'Magyarország' },
    });
    expect(p).not.toBeNull();
    expect(p!.name).toBe('Halászbástya, Budapest');
    expect(p!.lat).toBeCloseTo(47.5022);
    expect(p!.lng).toBeCloseTo(19.0344);
    expect(p!.detail).toContain('Szentháromság tér');
  });

  it('név nélkül a display_name első eleme lesz a név', () => {
    const p = toPlace({
      lat: '46.25',
      lon: '20.15',
      display_name: 'Dóm tér, Szeged, Magyarország',
      address: { town: 'Szeged' },
    });
    expect(p!.name).toBe('Dóm tér, Szeged');
  });

  it('nem ismétli a települést, ha az a POI neve', () => {
    const p = toPlace({
      lat: '47.5',
      lon: '19.05',
      name: 'Budapest',
      display_name: 'Budapest, Magyarország',
      address: { city: 'Budapest' },
    });
    expect(p!.name).toBe('Budapest');
  });

  it('érvénytelen koordinátára null', () => {
    expect(toPlace({ lat: 'x', lon: '19.0', display_name: 'akármi' })).toBeNull();
  });
});

describe('isValidLatLng', () => {
  it.each([
    [47.5, 19.05, true],
    ['47.5', '19.05', true],
    [91, 19, false],
    [47, 181, false],
    ['abc', 19, false],
    [null, null, false],
  ])('(%s, %s) → %s', (lat, lng, expected) => {
    expect(isValidLatLng(lat, lng)).toBe(expected);
  });
});

describe('formatLatLng', () => {
  it('5 tizedesre kerekít', () => {
    expect(formatLatLng(47.5022123456, 19.034412345)).toBe('47.50221, 19.03441');
  });
});
