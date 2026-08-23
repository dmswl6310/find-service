import { readdir, readFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const PRODUCTION_ROOTS = ["app", "components"];
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const NAMED_PALETTES = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];
const COLOR_UTILITY = [
  "accent",
  "bg",
  "border(?:-[xytrblse])?",
  "caret",
  "decoration",
  "divide(?:-[xy])?",
  "drop-shadow",
  "fill",
  "from",
  "inset-shadow",
  "outline",
  "placeholder",
  "ring(?:-offset)?",
  "shadow",
  "stroke",
  "text-shadow",
  "text",
  "to",
  "via",
].join("|");
const NAMED_COLOR = `(?:${NAMED_PALETTES.join("|")})-\\d{2,3}|white|black`;
const NAMED_COLOR_UTILITY = new RegExp(
  `(?<![\\w-])(?:${COLOR_UTILITY})-(?:${NAMED_COLOR})(?:\\/(?:\\d{1,3}|\\[[^\\]\\s]+\\]))?(?![\\w-])`,
  "g",
);
const ARBITRARY_COLOR_UTILITY = new RegExp(
  `(?<![\\w-])(?:${COLOR_UTILITY})-\\[[^\\]\\r\\n]+\\]`,
  "g",
);
const RAW_HEX_COLOR = /(?<![\da-f])#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})(?![\da-f])/gi;
const RAW_FUNCTION_COLOR = /\b(?:rgba?|hsla?)\(\s*(?=[+-]?(?:\d|\.\d)|none\b)[^)\r\n]+\)/gi;
const ARBITRARY_COLOR_FUNCTION = /(?<![a-z0-9-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\s*\(/gi;
const ARBITRARY_GRADIENT = /\b(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(/i;
const TAILWIND_THEME_COLOR = new RegExp(
  `\\btheme\\(\\s*(?:colors(?:\\.|\\[)|--color-(?:${NAMED_PALETTES.join("|")}|white|black)(?:-|\\b))`,
  "i",
);
const CSS_NAMED_COLORS = new Set(`
  aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue
  blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk
  crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki
  darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen
  darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue
  dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite
  gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki
  lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
  lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen
  lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen
  magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen
  mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream
  mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid
  palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum
  powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown
  seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen
  steelblue tan teal thistle tomato transparent turquoise violet wheat white whitesmoke
  yellow yellowgreen currentcolor
`.trim().split(/\s+/));

const APPROVED_MARKER_COLORS = {
  origin: { fill: "#397C8A", stroke: "#235965" },
  candidate: { fill: "#B9604B", stroke: "#843E30" },
};
const APPROVED_MARKER_FILE = "components/map/mapVisuals.ts";

function normalizePath(path) {
  return relative(process.cwd(), resolve(path)).replaceAll("\\", "/");
}

function unwrapExpression(expression) {
  let current = expression;
  while (
    ts.isAsExpression(current)
    || ts.isSatisfiesExpression(current)
    || ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  return undefined;
}

function objectProperties(expression) {
  const object = unwrapExpression(expression);
  if (!ts.isObjectLiteralExpression(object)) return undefined;

  const properties = new Map();
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) return undefined;
    const name = propertyName(property.name);
    if (!name || properties.has(name)) return undefined;
    properties.set(name, property.initializer);
  }
  return properties;
}

function approvedMarkerColorPositions(path, source) {
  if (normalizePath(path).toLowerCase() !== APPROVED_MARKER_FILE.toLowerCase()) return new Set();

  const sourceFile = ts.createSourceFile(
    APPROVED_MARKER_FILE,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const declaration = sourceFile.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations])
    .find((item) => ts.isIdentifier(item.name) && item.name.text === "MAP_DOMAIN_COLORS");
  if (!declaration?.initializer) return new Set();

  const rootProperties = objectProperties(declaration.initializer);
  if (!rootProperties || [...rootProperties.keys()].join(",") !== "origin,candidate") return new Set();

  const allowedPositions = new Set();
  for (const [kind, expectedColors] of Object.entries(APPROVED_MARKER_COLORS)) {
    const kindExpression = rootProperties.get(kind);
    const colors = kindExpression ? objectProperties(kindExpression) : undefined;
    if (!colors || [...colors.keys()].join(",") !== "fill,stroke") return new Set();

    for (const [role, expectedValue] of Object.entries(expectedColors)) {
      const value = unwrapExpression(colors.get(role));
      if (!ts.isStringLiteral(value) || value.text !== expectedValue) return new Set();
      allowedPositions.add(value.getStart(sourceFile) + 1);
    }
  }

  return allowedPositions;
}

function colorFunctionWithoutSemanticVariable(value) {
  ARBITRARY_COLOR_FUNCTION.lastIndex = 0;
  for (const match of value.matchAll(ARBITRARY_COLOR_FUNCTION)) {
    let depth = 1;
    let cursor = match.index + match[0].length;
    while (cursor < value.length && depth > 0) {
      if (value[cursor] === "(") depth += 1;
      else if (value[cursor] === ")") depth -= 1;
      cursor += 1;
    }

    const functionSource = value.slice(match.index, cursor);
    if (!/\bvar\(\s*--[\w-]+/i.test(functionSource)) return true;
  }

  return false;
}

function withoutCssFunctions(value, functionName) {
  const pattern = new RegExp(`\\b${functionName}\\s*\\(`, "gi");
  let result = "";
  let copiedUntil = 0;

  for (const match of value.matchAll(pattern)) {
    if (match.index < copiedUntil) continue;
    let cursor = match.index + match[0].length;
    let depth = 1;
    let quote;

    while (cursor < value.length && depth > 0) {
      const character = value[cursor];
      if (quote) {
        if (character === "\\") cursor += 1;
        else if (character === quote) quote = undefined;
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === "(") {
        depth += 1;
      } else if (character === ")") {
        depth -= 1;
      }
      cursor += 1;
    }

    if (depth !== 0) continue;
    result += value.slice(copiedUntil, match.index) + " ";
    copiedUntil = cursor;
  }

  return result + value.slice(copiedUntil);
}

function containsNamedCssColor(value) {
  const withoutUrls = withoutCssFunctions(value, "url");
  const withoutVariableNames = withoutUrls.replace(/\bvar\(\s*--[\w-]+/gi, "var(");
  return (withoutVariableNames.match(/[a-z]+/gi) ?? [])
    .some((word) => CSS_NAMED_COLORS.has(word.toLowerCase()));
}

function isDirectArbitraryColor(match) {
  const bracketStart = match.indexOf("[");
  let value = match.slice(bracketStart + 1, -1).trim();
  if (value.toLowerCase().startsWith("color:")) value = value.slice("color:".length).trim();

  return /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)
    || /#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})(?![\da-f])/i.test(value)
    || ARBITRARY_GRADIENT.test(value)
    || TAILWIND_THEME_COLOR.test(value)
    || colorFunctionWithoutSemanticVariable(value)
    || containsNamedCssColor(value);
}

function lineNumberAt(source, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (source.charCodeAt(cursor) === 10) line += 1;
  }
  return line;
}

function addMatches(violations, ranges, path, source, pattern, predicate = () => true) {
  pattern.lastIndex = 0;
  for (const match of source.matchAll(pattern)) {
    if (!predicate(match[0])) continue;
    const index = match.index;
    violations.push({ path, line: lineNumberAt(source, index), match: match[0], index });
    ranges.push({ start: index, end: index + match[0].length });
  }
}

export function findSemanticColorViolations(path, source) {
  const normalizedPath = normalizePath(path);
  const violations = [];
  const utilityRanges = [];

  addMatches(violations, utilityRanges, normalizedPath, source, NAMED_COLOR_UTILITY);
  addMatches(
    violations,
    utilityRanges,
    normalizedPath,
    source,
    ARBITRARY_COLOR_UTILITY,
    isDirectArbitraryColor,
  );

  // Tailwind generates CSS only for complete tokens present in source. Runtime concatenation and
  // template substitutions are intentionally outside this checker's contract and are not evaluated.

  const approvedPositions = approvedMarkerColorPositions(path, source);
  for (const pattern of [RAW_HEX_COLOR, RAW_FUNCTION_COLOR]) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      const index = match.index;
      if (approvedPositions.has(index)) continue;
      if (utilityRanges.some((range) => index >= range.start && index < range.end)) continue;
      violations.push({
        path: normalizedPath,
        line: lineNumberAt(source, index),
        match: match[0],
        index,
      });
    }
  }

  const uniqueViolations = [...new Map(
    violations.map((violation) => [`${violation.index}:${violation.match}`, violation]),
  ).values()];

  return uniqueViolations
    .sort((left, right) => left.index - right.index || left.match.localeCompare(right.match))
    .map((violation) => ({
      path: violation.path,
      line: violation.line,
      match: violation.match,
    }));
}

export function formatSemanticColorViolation(violation) {
  return `${violation.path}:${violation.line}:${violation.match}`;
}

async function productionFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await productionFiles(path));
    else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) files.push(path);
  }

  return files;
}

export async function scanProductionSemanticColors() {
  const files = (await Promise.all(PRODUCTION_ROOTS.map((root) => productionFiles(resolve(root))))).flat();
  const violations = [];

  for (const path of files) {
    const source = await readFile(path, "utf8");
    violations.push(...findSemanticColorViolations(path, source));
  }

  return violations;
}

async function main() {
  const violations = await scanProductionSemanticColors();
  if (violations.length === 0) return;

  console.error(violations.map(formatSemanticColorViolation).join("\n"));
  process.exitCode = 1;
}

const cliUrl = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : undefined;
if (cliUrl === import.meta.url) await main();
