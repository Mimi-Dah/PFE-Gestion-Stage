/**
 * Result Type Pattern
 * Provides explicit success (Ok) and failure (Err) states for operations.
 */

export class Result {
  constructor(ok, value, error) {
    this.ok = ok;
    this.value = value;
    this.error = error;
  }

  static Ok(value) {
    return new Result(true, value, null);
  }

  static Err(error) {
    return new Result(false, null, error);
  }

  /**
   * Unwraps the value if Ok, otherwise throws the error.
   */
  unwrap() {
    if (this.ok) return this.value;
    throw this.error;
  }

  /**
   * Returns the value if Ok, otherwise returns the fallback.
   */
  unwrapOr(fallback) {
    if (this.ok) return this.value;
    return fallback;
  }

  /**
   * Transforms the value if Ok.
   */
  map(fn) {
    if (this.ok) return Result.Ok(fn(this.value));
    return this;
  }
}

/**
 * Helper to wrap a promise in a Result.
 */
export async function wrapPromise(promise) {
  try {
    const data = await promise;
    return Result.Ok(data);
  } catch (error) {
    return Result.Err(error);
  }
}
