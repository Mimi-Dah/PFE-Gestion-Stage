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

  unwrap() {
    if (this.ok) return this.value;
    throw this.error;
  }

  unwrapOr(fallback) {
    if (this.ok) return this.value;
    return fallback;
  }

  map(fn) {
    if (this.ok) return Result.Ok(fn(this.value));
    return this;
  }
}

export async function wrapPromise(promise) {
  try {
    const data = await promise;
    return Result.Ok(data);
  } catch (error) {
    return Result.Err(error);
  }
}
