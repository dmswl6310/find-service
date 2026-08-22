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
const ARBITRARY_COLOR_FUNCTION = /^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(/i;

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

function findFunction(sourceFile, name) {
  return sourceFile.statements.find(
    (statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name,
  );
}

function visit(node, visitor) {
  visitor(node);
  ts.forEachChild(node, (child) => visit(child, visitor));
}

function returnedSvgUsesPalette(functionNode, sourceFile, kind) {
  if (!functionNode?.body) return false;

  let bindsApprovedPalette = false;
  let returnedSvgUsesFill = false;
  let returnedSvgUsesStroke = false;

  visit(functionNode.body, (node) => {
    if (
      ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text === "palette"
      && node.initializer
      && ts.isPropertyAccessExpression(node.initializer)
      && node.initializer.expression.getText(sourceFile) === "MAP_DOMAIN_COLORS"
      && node.initializer.name.text === kind
    ) {
      bindsApprovedPalette = true;
    }

    if (!ts.isReturnStatement(node) || !node.expression) return;
    const returnedSource = node.expression.getText(sourceFile);
    if (!returnedSource.includes("<svg")) return;
    visit(node.expression, (returnedNode) => {
      if (
        ts.isPropertyAccessExpression(returnedNode)
        && returnedNode.expression.getText(sourceFile) === "palette"
      ) {
        if (returnedNode.name.text === "fill") returnedSvgUsesFill = true;
        if (returnedNode.name.text === "stroke") returnedSvgUsesStroke = true;
      }
    });
  });

  return bindsApprovedPalette && returnedSvgUsesFill && returnedSvgUsesStroke;
}

function markerImageReturnsEncodedSvg(functionNode, sourceFile) {
  if (!functionNode?.body) return false;

  let svgUsesOriginBuilder = false;
  let svgUsesCandidateBuilder = false;
  let srcEncodesSvgDataUrl = false;

  visit(functionNode.body, (node) => {
    if (
      ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text === "svg"
      && node.initializer
    ) {
      visit(node.initializer, (initializerNode) => {
        if (!ts.isCallExpression(initializerNode) || !ts.isIdentifier(initializerNode.expression)) return;
        if (initializerNode.expression.text === "buildOriginMarker") svgUsesOriginBuilder = true;
        if (initializerNode.expression.text === "buildCandidateMarker") svgUsesCandidateBuilder = true;
      });
    }

    if (!ts.isReturnStatement(node) || !node.expression) return;
    visit(node.expression, (returnedNode) => {
      if (!ts.isPropertyAssignment(returnedNode) || propertyName(returnedNode.name) !== "src") return;
      const srcSource = returnedNode.initializer.getText(sourceFile);
      let encodesSvg = false;
      visit(returnedNode.initializer, (srcNode) => {
        if (
          ts.isCallExpression(srcNode)
          && ts.isIdentifier(srcNode.expression)
          && srcNode.expression.text === "encodeURIComponent"
          && srcNode.arguments.length === 1
          && srcNode.arguments[0].getText(sourceFile) === "svg"
        ) {
          encodesSvg = true;
        }
      });
      if (srcSource.includes("data:image/svg+xml") && encodesSvg) srcEncodesSvgDataUrl = true;
    });
  });

  return svgUsesOriginBuilder && svgUsesCandidateBuilder && srcEncodesSvgDataUrl;
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

  if (
    !returnedSvgUsesPalette(findFunction(sourceFile, "buildOriginMarker"), sourceFile, "origin")
    || !returnedSvgUsesPalette(findFunction(sourceFile, "buildCandidateMarker"), sourceFile, "candidate")
    || !markerImageReturnsEncodedSvg(findFunction(sourceFile, "createMapMarkerImage"), sourceFile)
  ) {
    return new Set();
  }

  return allowedPositions;
}

function isDirectArbitraryColor(match) {
  const bracketStart = match.indexOf("[");
  let value = match.slice(bracketStart + 1, -1).trim();
  if (value.toLowerCase().startsWith("color:")) value = value.slice("color:".length).trim();

  return /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)
    || ARBITRARY_COLOR_FUNCTION.test(value)
    || /^[a-z]+$/i.test(value);
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

  return violations
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
