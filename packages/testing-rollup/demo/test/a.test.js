import { foo } from '../src/example';

describe('a', () => {
  it('returns false when given true', () => {
    if (foo(false) !== true) {
      throw new Error('not true');
    }
  });

  it('preserves import.meta.url', async () => {
    const response = await fetch(new URL('../src/foo.txt', import.meta.url));
    const text = await response.text();
    if (text !== 'dynamically fetched text') {
      throw new Error('could not fetched text using import.meta.url');
    }
  });

  it('returns true when given false', () => {
    if (foo(true) !== false) {
      throw new Error('not false');
    }
  });

  it('can do dynamic imports', async () => {
    const module = await import('../src/dynamic.js');
    if (module.default !== 'hi from dynamic import') {
      throw new Error('could not fetch dynamic import');
    }
  });
});
