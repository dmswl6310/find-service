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

function findFunction(sourceFile, name) {
  return sourceFile.statements.find(
    (statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name,
  );
}

function visit(node, visitor) {
  visitor(node);
  ts.forEachChild(node, (child) => visit(child, visitor));
}

function returnedSvgTemplate(functionNode) {
  if (!functionNode?.body) return undefined;

  const returnStatement = functionNode.body.statements.find(ts.isReturnStatement);
  if (!returnStatement?.expression) return undefined;

  let expression = unwrapExpression(returnStatement.expression);
  if (
    ts.isCallExpression(expression)
    && expression.arguments.length === 0
    && ts.isPropertyAccessExpression(expression.expression)
    && expression.expression.name.text === "trim"
  ) {
    expression = unwrapExpression(expression.expression.expression);
  }

  return ts.isTemplateExpression(expression) && expression.head.text.includes("<svg")
    ? expression
    : undefined;
}

function templateUsesPaletteAttribute(template, role) {
  for (let index = 0; index < template.templateSpans.length; index += 1) {
    const span = template.templateSpans[index];
    const expression = unwrapExpression(span.expression);
    if (
      !ts.isPropertyAccessExpression(expression)
      || !ts.isIdentifier(expression.expression)
      || expression.expression.text !== "palette"
      || expression.name.text !== role
    ) {
      continue;
    }

    const before = index === 0
      ? template.head.text
      : template.templateSpans[index - 1].literal.text;
    const attribute = before.match(new RegExp(`(?:^|\\s)${role}\\s*=\\s*(["'])$`));
    if (attribute && span.literal.text.startsWith(attribute[1])) return true;
  }

  return false;
}

function isConstDeclaration(declaration) {
  return ts.isVariableDeclarationList(declaration.parent)
    && Boolean(declaration.parent.flags & ts.NodeFlags.Const);
}

function namedVariableDeclarations(functionNode, name) {
  const declarations = [];
  visit(functionNode.body, (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      declarations.push(node);
    }
  });
  return declarations;
}

function assignmentTargetsName(expression, name) {
  const target = unwrapExpression(expression);
  if (ts.isIdentifier(target)) return target.text === name;
  if (ts.isPropertyAccessExpression(target) || ts.isElementAccessExpression(target)) {
    return assignmentTargetsName(target.expression, name);
  }
  if (ts.isArrayLiteralExpression(target) || ts.isObjectLiteralExpression(target)) {
    let targetsName = false;
    visit(target, (node) => {
      if (ts.isIdentifier(node) && node.text === name) targetsName = true;
    });
    return targetsName;
  }
  return false;
}

function hasWriteAfter(functionNode, declaration, name) {
  let hasWrite = false;
  visit(functionNode.body, (node) => {
    if (node.getStart() <= declaration.end) return;
    if (
      ts.isBinaryExpression(node)
      && ts.isAssignmentOperator(node.operatorToken.kind)
      && assignmentTargetsName(node.left, name)
    ) {
      hasWrite = true;
    }
    if (
      (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node))
      && [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator)
      && assignmentTargetsName(node.operand, name)
    ) {
      hasWrite = true;
    }
  });
  return hasWrite;
}

function returnedSvgUsesPalette(functionNode, sourceFile, kind) {
  if (!functionNode?.body) return false;
  const paletteDeclarations = namedVariableDeclarations(functionNode, "palette");
  if (paletteDeclarations.length !== 1) return false;
  const [paletteDeclaration] = paletteDeclarations;
  const initializer = paletteDeclaration.initializer
    ? unwrapExpression(paletteDeclaration.initializer)
    : undefined;
  const bindsApprovedPalette = isConstDeclaration(paletteDeclaration)
    && initializer
    && ts.isPropertyAccessExpression(initializer)
    && initializer.expression.getText(sourceFile) === "MAP_DOMAIN_COLORS"
    && initializer.name.text === kind
    && !hasWriteAfter(functionNode, paletteDeclaration, "palette");

  const template = returnedSvgTemplate(functionNode);
  return Boolean(
    bindsApprovedPalette
    && template
    && templateUsesPaletteAttribute(template, "fill")
    && templateUsesPaletteAttribute(template, "stroke"),
  );
}

function isDirectBuilderCall(expression, name) {
  const candidate = unwrapExpression(expression);
  return ts.isCallExpression(candidate)
    && ts.isIdentifier(candidate.expression)
    && candidate.expression.text === name;
}

function isOriginKindCondition(expression) {
  const condition = unwrapExpression(expression);
  return ts.isBinaryExpression(condition)
    && condition.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken
    && ts.isIdentifier(unwrapExpression(condition.left))
    && unwrapExpression(condition.left).text === "kind"
    && ts.isStringLiteral(unwrapExpression(condition.right))
    && unwrapExpression(condition.right).text === "origin";
}

function isExactEncodedSvgSource(expression) {
  const source = unwrapExpression(expression);
  if (
    !ts.isTemplateExpression(source)
    || source.head.text !== "data:image/svg+xml;charset=UTF-8,"
    || source.templateSpans.length !== 1
    || source.templateSpans[0].literal.text !== ""
  ) {
    return false;
  }

  const encoded = unwrapExpression(source.templateSpans[0].expression);
  return ts.isCallExpression(encoded)
    && ts.isIdentifier(encoded.expression)
    && encoded.expression.text === "encodeURIComponent"
    && encoded.arguments.length === 1
    && ts.isIdentifier(unwrapExpression(encoded.arguments[0]))
    && unwrapExpression(encoded.arguments[0]).text === "svg";
}

function markerImageReturnsEncodedSvg(functionNode) {
  if (!functionNode?.body) return false;

  const svgDeclarations = namedVariableDeclarations(functionNode, "svg");
  if (svgDeclarations.length !== 1) return false;
  const [svgDeclaration] = svgDeclarations;
  const svgInitializer = svgDeclaration?.initializer
    ? unwrapExpression(svgDeclaration.initializer)
    : undefined;
  if (
    !isConstDeclaration(svgDeclaration)
    || hasWriteAfter(functionNode, svgDeclaration, "svg")
    || !svgInitializer
    || !ts.isConditionalExpression(svgInitializer)
    || !isOriginKindCondition(svgInitializer.condition)
    || !isDirectBuilderCall(svgInitializer.whenTrue, "buildOriginMarker")
    || !isDirectBuilderCall(svgInitializer.whenFalse, "buildCandidateMarker")
  ) {
    return false;
  }

  const returnStatement = functionNode.body.statements.find(ts.isReturnStatement);
  const returned = returnStatement?.expression
    ? unwrapExpression(returnStatement.expression)
    : undefined;
  const properties = returned ? objectProperties(returned) : undefined;
  const src = properties?.get("src");
  return Boolean(src && isExactEncodedSvgSource(src));
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
    || !markerImageReturnsEncodedSvg(findFunction(sourceFile, "createMapMarkerImage"))
  ) {
    return new Set();
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

function isFunctionScope(node) {
  return ts.isArrowFunction(node)
    || ts.isFunctionDeclaration(node)
    || ts.isFunctionExpression(node)
    || ts.isMethodDeclaration(node)
    || ts.isGetAccessorDeclaration(node)
    || ts.isSetAccessorDeclaration(node)
    || ts.isConstructorDeclaration(node);
}

function isLexicalScope(node) {
  return ts.isSourceFile(node)
    || ts.isBlock(node)
    || ts.isModuleBlock(node)
    || ts.isCaseBlock(node)
    || ts.isCatchClause(node)
    || ts.isForStatement(node)
    || ts.isForInStatement(node)
    || ts.isForOfStatement(node)
    || isFunctionScope(node);
}

function nearestScope(node, predicate = isLexicalScope) {
  let current = node.parent;
  while (current && !predicate(current)) current = current.parent;
  return current;
}

function collectLexicalBindings(sourceFile) {
  const declarations = new Map();

  function add(scope, name, binding) {
    if (!scope) return;
    const scopeBindings = declarations.get(scope) ?? new Map();
    const existing = scopeBindings.get(name) ?? [];
    existing.push(binding);
    scopeBindings.set(name, existing);
    declarations.set(scope, scopeBindings);
  }

  visit(sourceFile, (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const declarationList = node.parent;
      if (!ts.isVariableDeclarationList(declarationList)) return;
      const isConst = Boolean(declarationList.flags & ts.NodeFlags.Const);
      const scope = nearestScope(
        node,
        isConst
          ? isLexicalScope
          : (candidate) => ts.isSourceFile(candidate) || isFunctionScope(candidate),
      );
      add(scope, node.name.text, {
        declaration: node,
        initializer: isConst ? node.initializer : undefined,
      });
      return;
    }

    if (ts.isParameter(node) && ts.isIdentifier(node.name)) {
      add(nearestScope(node, isFunctionScope), node.name.text, { declaration: node });
      return;
    }

    if (
      (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isEnumDeclaration(node))
      && node.name
    ) {
      add(nearestScope(node), node.name.text, { declaration: node });
    }
  });

  return declarations;
}

function resolveLexicalBinding(identifier, declarations, sourceFile) {
  let scope = nearestScope(identifier);

  while (scope) {
    const candidates = declarations.get(scope)?.get(identifier.text);
    if (candidates) {
      if (candidates.length !== 1) return undefined;
      const [binding] = candidates;
      if (
        !binding.initializer
        || binding.declaration.getStart(sourceFile) > identifier.getStart(sourceFile)
      ) {
        return undefined;
      }
      return binding;
    }
    scope = nearestScope(scope);
  }

  return undefined;
}

function evaluateStaticValue(node, declarations, sourceFile, seen = new Set()) {
  const expression = unwrapExpression(node);

  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return { kind: "string", value: expression.text };
  }
  if (ts.isNumericLiteral(expression)) return { kind: "number", value: Number(expression.text) };
  if (ts.isPrefixUnaryExpression(expression) && [ts.SyntaxKind.PlusToken, ts.SyntaxKind.MinusToken].includes(expression.operator)) {
    const operand = evaluateStaticValue(expression.operand, declarations, sourceFile, seen);
    if (operand?.kind !== "number") return undefined;
    return {
      kind: "number",
      value: expression.operator === ts.SyntaxKind.MinusToken ? -operand.value : operand.value,
    };
  }
  if (ts.isIdentifier(expression)) {
    const binding = resolveLexicalBinding(expression, declarations, sourceFile);
    if (!binding || seen.has(binding.declaration)) return undefined;
    return evaluateStaticValue(
      binding.initializer,
      declarations,
      sourceFile,
      new Set([...seen, binding.declaration]),
    );
  }
  if (ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = evaluateStaticValue(expression.left, declarations, sourceFile, seen);
    const right = evaluateStaticValue(expression.right, declarations, sourceFile, seen);
    if (!left || !right) return undefined;
    if (left.kind === "string" || right.kind === "string") {
      return { kind: "string", value: String(left.value) + String(right.value) };
    }
    return { kind: "number", value: left.value + right.value };
  }
  if (ts.isTemplateExpression(expression)) {
    let value = expression.head.text;
    for (const span of expression.templateSpans) {
      const substitution = evaluateStaticValue(span.expression, declarations, sourceFile, seen);
      if (!substitution) return undefined;
      value += String(substitution.value) + span.literal.text;
    }
    return { kind: "string", value };
  }

  return undefined;
}

function hasCompositeStringAncestor(node) {
  let parent = node.parent;
  while (
    parent
    && (
      ts.isParenthesizedExpression(parent)
      || ts.isAsExpression(parent)
      || ts.isSatisfiesExpression(parent)
    )
  ) {
    parent = parent.parent;
  }

  return Boolean(
    parent
    && (
      (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.PlusToken)
      || ts.isTemplateSpan(parent)
    )
  );
}

function addStaticStringUtilityMatches(violations, path, source, sourceFile) {
  const declarations = collectLexicalBindings(sourceFile);

  visit(sourceFile, (node) => {
    const composite = ts.isTemplateExpression(node)
      || (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken);
    if (!composite || hasCompositeStringAncestor(node)) return;

    const resolved = evaluateStaticValue(node, declarations, sourceFile);
    if (resolved?.kind !== "string") return;

    for (const [pattern, predicate] of [
      [NAMED_COLOR_UTILITY, () => true],
      [ARBITRARY_COLOR_UTILITY, isDirectArbitraryColor],
    ]) {
      pattern.lastIndex = 0;
      for (const match of resolved.value.matchAll(pattern)) {
        if (!predicate(match[0])) continue;
        const index = node.getStart(sourceFile);
        violations.push({ path, line: lineNumberAt(source, index), match: match[0], index });
      }
    }
  });
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

  const sourceFile = ts.createSourceFile(
    normalizedPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    normalizedPath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  addStaticStringUtilityMatches(violations, normalizedPath, source, sourceFile);

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
