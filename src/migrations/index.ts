import * as migration_20260913_152558_initial from './20260913_152558_initial';

export const migrations = [
  {
    up: migration_20260913_152558_initial.up,
    down: migration_20260913_152558_initial.down,
    name: '20260913_152558_initial'
  },
];
