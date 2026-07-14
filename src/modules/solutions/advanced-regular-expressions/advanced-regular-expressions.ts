export function zipStr(source: string): string {
  let prev;

  do {
    prev = source;
    source = source.replace(/(\w+)\1+/g, '$1');
  } while (source !== prev);

  return source;
}

export function format(template: string, params: Record<string, string | number>): string {
  function getValue(_str: string, match: string): string {
    return String(params[match] ?? `\${${match}}`);
  }

  return template.replace(/\$\{(\w+)\}/g, getValue);
}

export function calc(source: string): string {
  const expressionRegex = /\(?\d+(?:\s*(?:\*\*|[+\-*])\s*\d+\)?)+/g;

  return source.replace(expressionRegex, (expr) => String(Function(`return ${expr}`)()));
}
