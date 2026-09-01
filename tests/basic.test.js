// Minimal smoke test — expand with supertest + mongodb-memory-server for real coverage.
test('sanity check: math still works', () => {
  expect(1 + 1).toBe(2);
});
