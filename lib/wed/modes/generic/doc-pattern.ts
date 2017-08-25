/**
 * Facilities for interpreting the patterns passed in dochtml in
 * metadata files.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

/**
 * An execution context for a pattern.
 */
export interface Context {
  /**
   * Resolve an interpolated name to a value.
   *
   * @param name The name to resolve.
   *
   * @returns The resolved name. An unresolvable name raise an error.
   */
  resolveName(name: string): string;
}

/**
 * A compiled pattern.
 */
export interface DocPattern {
  /**
   * Execute the pattern so as to get a value.
   *
   * @param context The execution context for the pattern.
   *
   * @returns The evaluated pattern.
   */
  execute(context: Context): string;
}

/**
 * A literal value in a pattern.
 */
class Literal {
  /**
   * @param value The value to which this literal resolves to.
   */
  constructor(private readonly value: string) {}

  execute(): string {
    return this.value;
  }
}

/**
 * A concatenation operation.
 */
class Concat {
  /**
   * @param values The patterns to concatenate.
   */
  constructor(private readonly values: DocPattern[]) {}

  execute(context: Context): string {
    return this.values.map((value) => value.execute(context)).join("");
  }
}

/**
 * An interpolation like ``${foo}``.
 */
class Interpolation {
  /**
   * @param name The name to interpolate.
   */
  constructor(private readonly name: string) {}

  execute(context: Context): string {
    return context.resolveName(this.name);
  }
}

/**
 * A substitution operation, like in ``${foo:s("a","b")}``.
 */
class Substitution {
  constructor(private readonly pattern: string,
              private readonly substitution: string,
              private readonly child: DocPattern) {}

  execute(context: Context): string {
    const value = this.child.execute(context);
    return value.replace(this.pattern, this.substitution);
  }
}

/**
 * Compile a string pattern to a [[DocPattern]] object.
 *
 * @param pattern The pattern to compile.
 *
 * @returns The compiled pattern.
 */
export function compile(pattern: string): DocPattern {
  const parts = pattern.split(/(\$\{|\})/);

  const patterns: DocPattern[] = [];
  let interpolating = false;
  for (const part of parts) {
    // tslint:disable-next-line:no-invalid-template-strings
    if (part === "${") {
      if (interpolating) {
        throw new Error("nested interpolations are invalid");
      }

      interpolating = true;
    }
    else if (part === "}") {
      if (!interpolating) {
        throw new Error("errant interpolation closure");
      }
      interpolating = false;
    }
    else if (interpolating) {
      const [name, transform] = part.split(":", 1);

      if (transform === undefined) {
        patterns.push(new Interpolation(name));
      }
      else {
        if (transform[0] === "s") {
          const paramList = transform.slice(1);
          if (paramList[0] !== "(" || paramList[paramList.length - 1] !== ")") {
            throw new Error("transform parameters must be in parentheses");
          }

          // We slice to drop the parentheses.
          let params = paramList.slice(1, -1).split(",").map((x) => x.trim());
          if (params.length !== 2) {
            throw new Error("an s transform takes 2 parameters");
          }

          for (const param of params) {
            if (param[0] !== "\"" || param[param.length - 1] !== "\"") {
              throw new Error(`parameter must be a string wrapped in double \
quotes: ${param}`);
            }
          }

          // Drop the wrapping quotes.
          params = params.map((x) => x.slice(1, -1));
          patterns.push(new Substitution(params[0], params[1],
                                         new Interpolation(name)));
        }
        else {
          throw new Error(`unknown transform ${transform}`);
        }
      }
    }
    else {
      patterns.push(new Literal(part));
    }
  }

  if (interpolating) {
    throw new Error("an interpolation was not closed");
  }

  return new Concat(patterns);
}

//  LocalWords:  dochtml MPL unresolvable param
