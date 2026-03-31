import { SchemaTreeNode } from '@/src/components/Common/SchemaGrid/utils';
import { SuggestionOption } from './Suggestions';

/**
 * Normalize user-typed path for tree search: replace empty brackets `[]` with `[0]`
 * since the schema tree uses `[0]` convention for array item paths.
 */
const normalizePathForSearch = (path: string): string => path.replace(/\[\]/g, '[0]');

/**
 * Find a schema tree node by a JSONata-style path.
 * Handles array access patterns like `choices[0]` or `choices[]` matching the `choices` node.
 */
const findNode = (nodes: SchemaTreeNode[], targetPath: string): SchemaTreeNode | undefined => {
  const normalized = normalizePathForSearch(targetPath);

  for (const node of nodes) {
    if (node.path === normalized) return node;

    // For arrays: 'choices[0]' should match 'choices' node of type array
    if (node.type === 'array' && normalized.startsWith(node.path + '[')) {
      const rest = normalized.slice(node.path.length);
      if (/^\[\d*\]$/.test(rest)) return node;

      const child = findNode(node.children, normalized);
      if (child) return child;
    }

    // Traverse into children for nested paths
    if (normalized.startsWith(node.path + '.')) {
      const child = findNode(node.children, normalized);
      if (child) return child;
    }
  }

  return undefined;
};

const nodeToSuggestion = (node: SchemaTreeNode, prefix: string): SuggestionOption => ({
  label: node.name,
  value: prefix + node.name,
  type: node.type,
});

const nodesToSuggestions = (nodes: SchemaTreeNode[], prefix: string): SuggestionOption[] =>
  nodes.map((n) => nodeToSuggestion(n, prefix));

/**
 * Get schema-based suggestions for the JSONata expression input.
 *
 * Behavior:
 * - Empty expression → show top-level schema properties
 * - Ends with '.' → show children of the node at that path
 * - Ends with ']' → show children of the array node (array item properties)
 * - Partial text → filter current level by the partial segment
 */
export const getSchemaSuggestions = (treeNodes: SchemaTreeNode[], expression: string): SuggestionOption[] => {
  const trimmed = expression.trim();

  // Empty → top-level properties
  if (!trimmed) {
    return nodesToSuggestions(treeNodes, '');
  }

  // Ends with '.' → drill into the node before the dot
  if (trimmed.endsWith('.')) {
    const parentPath = trimmed.slice(0, -1);
    const parentNode = findNode(treeNodes, parentPath);
    if (parentNode) {
      return nodesToSuggestions(parentNode.children, trimmed);
    }
    return [];
  }

  // Ends with ']' → drill into array item properties
  if (trimmed.endsWith(']')) {
    const bracketStart = trimmed.lastIndexOf('[');
    if (bracketStart < 0) return [];
    const arrayPath = trimmed.slice(0, bracketStart);
    const arrayNode = findNode(treeNodes, arrayPath);
    if (arrayNode && arrayNode.type === 'array' && arrayNode.children.length > 0) {
      return nodesToSuggestions(arrayNode.children, trimmed + '.');
    }
    return [];
  }

  // Partial text → determine current level and filter
  const lastDot = trimmed.lastIndexOf('.');
  if (lastDot === -1) {
    // Top level, filter by partial
    const partial = trimmed.toLowerCase();
    return treeNodes.filter((n) => n.name.toLowerCase().includes(partial)).map((n) => nodeToSuggestion(n, ''));
  }

  const parentPath = trimmed.slice(0, lastDot);
  const partial = trimmed.slice(lastDot + 1).toLowerCase();
  const parentNode = findNode(treeNodes, parentPath);

  if (!parentNode) return [];

  const prefix = parentPath + '.';
  return parentNode.children
    .filter((n) => n.name.toLowerCase().includes(partial))
    .map((n) => nodeToSuggestion(n, prefix));
};
