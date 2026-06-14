import { BadRequestException } from "@nestjs/common";
import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";

/**
 * Tiny dependency-free request validation (PRD §7 "validate input").
 *
 * NestJS + class-validator DTOs need `emitDecoratorMetadata` to resolve the DTO
 * class from the `@Body()` param type — but this app runs under tsx/esbuild with
 * no metadata emission. So validation is schema-explicit instead:
 *
 *   @Post() create(@Body(validateBody(CreateJobSchema)) body: CreateJob) { … }
 *
 * Schemas are plain objects of field validators; unknown keys are stripped.
 */

type Ok = { ok: true; value: unknown };
type Err = { ok: false; error: string };
export type FieldValidator = (value: unknown, key: string) => Ok | Err;
export type Schema = Record<string, FieldValidator>;
export type Infer<S extends Schema> = { [K in keyof S]?: unknown };

const ok = (value: unknown): Ok => ({ ok: true, value });
const err = (error: string): Err => ({ ok: false, error });

function optional(inner: FieldValidator): FieldValidator {
  return (value, key) => (value === undefined || value === null ? ok(undefined) : inner(value, key));
}

export const v = {
  string(opts: { min?: number; max?: number } = {}): FieldValidator {
    return (value, key) => {
      if (typeof value !== "string") return err(`\`${key}\` must be a string`);
      if (opts.min !== undefined && value.length < opts.min) return err(`\`${key}\` must be ≥ ${opts.min} chars`);
      if (opts.max !== undefined && value.length > opts.max) return err(`\`${key}\` must be ≤ ${opts.max} chars`);
      return ok(value);
    };
  },
  number(opts: { int?: boolean; min?: number; max?: number } = {}): FieldValidator {
    return (value, key) => {
      if (typeof value !== "number" || Number.isNaN(value)) return err(`\`${key}\` must be a number`);
      if (opts.int && !Number.isInteger(value)) return err(`\`${key}\` must be an integer`);
      if (opts.min !== undefined && value < opts.min) return err(`\`${key}\` must be ≥ ${opts.min}`);
      if (opts.max !== undefined && value > opts.max) return err(`\`${key}\` must be ≤ ${opts.max}`);
      return ok(value);
    };
  },
  boolean(): FieldValidator {
    return (value, key) => (typeof value === "boolean" ? ok(value) : err(`\`${key}\` must be a boolean`));
  },
  enumOf<T extends string>(values: readonly T[]): FieldValidator {
    return (value, key) =>
      values.includes(value as T) ? ok(value) : err(`\`${key}\` must be one of: ${values.join(", ")}`);
  },
  arrayOf(inner: FieldValidator): FieldValidator {
    return (value, key) => {
      if (!Array.isArray(value)) return err(`\`${key}\` must be an array`);
      const out: unknown[] = [];
      for (let i = 0; i < value.length; i += 1) {
        const r = inner(value[i], `${key}[${i}]`);
        if (!r.ok) return r;
        out.push(r.value);
      }
      return ok(out);
    };
  },
  isoDate(): FieldValidator {
    return (value, key) => {
      if (typeof value !== "string" || Number.isNaN(new Date(value).getTime())) {
        return err(`\`${key}\` must be a valid ISO timestamp`);
      }
      return ok(value);
    };
  },
  /** A syntactically well-formed email (single @, no spaces, a dotted domain). */
  email(opts: { max?: number } = {}): FieldValidator {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (value, key) => {
      if (typeof value !== "string") return err(`\`${key}\` must be a string`);
      const trimmed = value.trim();
      if ((opts.max ?? 254) < trimmed.length) return err(`\`${key}\` must be ≤ ${opts.max ?? 254} chars`);
      if (!re.test(trimmed)) return err(`\`${key}\` must be a valid email`);
      return ok(trimmed);
    };
  },
  /** Any plain object (no deep validation) — for loosely-shaped nested config. */
  object(): FieldValidator {
    return (value, key) =>
      typeof value === "object" && value !== null && !Array.isArray(value) ? ok(value) : err(`\`${key}\` must be an object`);
  },
  /**
   * Deeply-validated nested object against a sub-schema; strips unknown keys.
   * Composes with `arrayOf` for typed arrays: `v.arrayOf(v.shape({ name: v.string() }))`.
   */
  shape(subSchema: Schema): FieldValidator {
    return (value, key) => {
      if (typeof value !== "object" || value === null || Array.isArray(value)) return err(`\`${key}\` must be an object`);
      const source = value as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, validator] of Object.entries(subSchema)) {
        const r = validator(source[k], `${key}.${k}`);
        if (!r.ok) return r;
        if (r.value !== undefined) out[k] = r.value;
      }
      return ok(out);
    };
  },
  optional,
};

/** Validate `body` against `schema`; strips unknown keys, throws 400 on any error. */
export function parseSchema<S extends Schema>(schema: S, body: unknown): Infer<S> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new BadRequestException("Request body must be a JSON object");
  }
  const source = body as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  const errors: string[] = [];
  for (const [key, validator] of Object.entries(schema)) {
    const result = validator(source[key], key);
    if (!result.ok) errors.push(result.error);
    else if (result.value !== undefined) out[key] = result.value;
  }
  if (errors.length) throw new BadRequestException(errors);
  return out as Infer<S>;
}

class SchemaPipe implements PipeTransform {
  constructor(private readonly schema: Schema) {}
  transform(value: unknown, _metadata: ArgumentMetadata) {
    return parseSchema(this.schema, value);
  }
}

/** Use as `@Body(validateBody(schema))`. */
export function validateBody(schema: Schema): SchemaPipe {
  return new SchemaPipe(schema);
}
