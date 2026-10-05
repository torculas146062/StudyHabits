/**
 * Port for database health checks.
 *
 * Callers depend only on this interface. Technology-specific implementations
 * live in subfolders (e.g. `repositories/mysql`) so the underlying database
 * can be swapped without changing callers.
 */
export interface IHealthRepository {
  /**
   * Verifies the database is reachable.
   *
   * Resolves when the connection succeeds; rejects when it fails.
   */
  ping(): Promise<void>;
}
