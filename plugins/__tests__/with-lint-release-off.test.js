const { test, expect } = require('@jest/globals');
const { desactivarLintRelease } = require('../with-lint-release-off');

const GRADLE =
  'apply plugin: "com.android.application"\n\nandroid {\n    ndkVersion rootProject.ext.ndkVersion\n}\n';

test('desactiva el lint del Release dentro del bloque android, una sola vez', () => {
  const una = desactivarLintRelease(GRADLE);
  expect(una).toContain('android {\n    lint {\n        checkReleaseBuilds false\n    }');
  expect(desactivarLintRelease(una)).toBe(una);
});
