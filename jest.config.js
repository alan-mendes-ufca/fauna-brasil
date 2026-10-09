// Jest com Babel (o pacote `typescript` 7 é nativo e não expõe a API JS que o ts-jest exige).
// Os testes cobrem apenas módulos puros; se algo importar `phaser`, ele cai neste stub.
/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: { '^phaser$': '<rootDir>/tests/stubs/phaser.ts' },
  collectCoverageFrom: ['src/capture/rules.ts', 'src/battle/engine.ts', 'src/state/bag.ts', 'src/state/conservation.ts', 'src/data/conservation.ts', 'src/world/village.ts', 'src/world/encounters.ts', 'src/data/regions/index.ts', 'src/data/legends.ts', 'src/state/legends.ts', 'src/battle/legend.ts'],
  coverageDirectory: 'coverage',
};
