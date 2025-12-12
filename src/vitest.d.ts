/// <reference types="vitest" />
/// <reference types="vitest/globals" />

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'
import type { Mock } from 'vitest'

declare module 'vitest' {
  interface Assertion<T = any> extends jest.Matchers<void, T>, TestingLibraryMatchers<T, void> {}
  interface AsymmetricMatchersContaining extends jest.Matchers<void, any> {}
}

declare global {
  namespace jest {
    type Mock<T = any, Y extends any[] = any[]> = import('vitest').Mock<T, Y>
  }
  const jest: typeof import('vitest').vi
}
