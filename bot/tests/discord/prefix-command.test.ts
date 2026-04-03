import test from 'node:test';
import assert from 'node:assert/strict';

import { parsePrefixCommand } from '../../src/utils/prefixCommand.js';

test('parsePrefixCommand extrait le nom et les arguments', () => {
  const parsed = parsePrefixCommand('%i @skchskch recent', '%');

  assert.deepEqual(parsed, {
    name: 'i',
    args: ['@skchskch', 'recent']
  });
});

test('parsePrefixCommand ignore les messages sans préfixe', () => {
  assert.equal(parsePrefixCommand('/roll', '%'), null);
  assert.equal(parsePrefixCommand('bonjour', '%'), null);
});

test('parsePrefixCommand rejette un préfixe vide sans commande', () => {
  assert.equal(parsePrefixCommand('%', '%'), null);
  assert.equal(parsePrefixCommand('   %   ', '%'), null);
});
