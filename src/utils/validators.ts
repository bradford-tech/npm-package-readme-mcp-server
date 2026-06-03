import { PackageReadmeMcpError } from '../types/index.js';

export function validatePackageName(packageName: string): void {
  if (!packageName || typeof packageName !== 'string') {
    throw new PackageReadmeMcpError(
      'Package name is required and must be a string.\n' +
      'Examples of valid package names:\n' +
      '• Regular packages: lodash, express, react\n' +
      '• Scoped packages: @babel/core, @types/node, @my-org/utils',
      'INVALID_PACKAGE_NAME'
    );
  }

  const trimmed = packageName.trim();
  if (trimmed.length === 0) {
    throw new PackageReadmeMcpError(
      'Package name cannot be empty.\n' +
      'Examples of valid package names:\n' +
      '• Regular packages: lodash, express, react\n' +
      '• Scoped packages: @babel/core, @types/node, @my-org/utils',
      'INVALID_PACKAGE_NAME'
    );
  }

  if (trimmed.length > 214) {
    throw new PackageReadmeMcpError(
      `Package name cannot exceed 214 characters (current: ${trimmed.length}).\n` +
      'Consider shortening the package name or using a scoped package with a shorter name.',
      'INVALID_PACKAGE_NAME'
    );
  }

  // Check for uppercase letters - common mistake
  if (/[A-Z]/.test(trimmed)) {
    const suggested = trimmed.toLowerCase();
    throw new PackageReadmeMcpError(
      `Package name cannot contain uppercase letters.\n` +
      `Suggestion: "${suggested}"\n` +
      'NPM package names must be lowercase.',
      'INVALID_PACKAGE_NAME'
    );
  }

  // Check for leading/trailing spaces or dots
  if (trimmed.startsWith('.') || trimmed.endsWith('.')) {
    const suggested = trimmed.replace(/^\.+|\.+$/g, '');
    throw new PackageReadmeMcpError(
      `Package name cannot start or end with a dot.\n` +
      `Suggestion: "${suggested}"\n` +
      'Dots are only allowed within the package name.',
      'INVALID_PACKAGE_NAME'
    );
  }

  // Check for leading/trailing hyphens
  if (trimmed.startsWith('-') || trimmed.endsWith('-')) {
    const suggested = trimmed.replace(/^-+|-+$/g, '');
    throw new PackageReadmeMcpError(
      `Package name cannot start or end with a hyphen.\n` +
      `Suggestion: "${suggested}"\n` +
      'Hyphens are only allowed within the package name.',
      'INVALID_PACKAGE_NAME'
    );
  }

  // Check for invalid sequences
  if (trimmed.includes('..')) {
    const suggested = trimmed.replace(/\.{2,}/g, '.');
    throw new PackageReadmeMcpError(
      `Package name cannot contain consecutive dots.\n` +
      `Suggestion: "${suggested}"\n` +
      'Use single dots to separate parts of your package name.',
      'INVALID_PACKAGE_NAME'
    );
  }

  if (trimmed.includes('_-') || trimmed.includes('-_')) {
    const suggested = trimmed.replace(/_-|-_/g, '-');
    throw new PackageReadmeMcpError(
      `Package name cannot contain underscore-hyphen sequences.\n` +
      `Suggestion: "${suggested}"\n` +
      'Use either hyphens or underscores consistently.',
      'INVALID_PACKAGE_NAME'
    );
  }

  // Check for spaces - common mistake
  if (trimmed.includes(' ')) {
    const suggested = trimmed.replace(/\s+/g, '-');
    throw new PackageReadmeMcpError(
      `Package name cannot contain spaces.\n` +
      `Suggestion: "${suggested}"\n` +
      'Use hyphens to separate words in package names.',
      'INVALID_PACKAGE_NAME'
    );
  }

  // Validate scoped packages specifically
  if (trimmed.startsWith('@')) {
    if (!trimmed.includes('/')) {
      throw new PackageReadmeMcpError(
        `Scoped package name must include a slash after the scope.\n` +
        `Example: "${trimmed}/package-name"\n` +
        'Scoped packages follow the format: @scope/package-name',
        'INVALID_PACKAGE_NAME'
      );
    }

    const [scope, packagePart] = trimmed.split('/');
    if (!scope || scope === '@') {
      throw new PackageReadmeMcpError(
        `Scoped package must have a valid scope name.\n` +
        'Examples: @babel/core, @types/node, @my-org/utils\n' +
        'Scope names must contain at least one character after the @.',
        'INVALID_PACKAGE_NAME'
      );
    }

    if (!packagePart || packagePart.length === 0) {
      throw new PackageReadmeMcpError(
        `Scoped package must have a package name after the slash.\n` +
        `Example: "${scope}/package-name"\n` +
        'Scoped packages follow the format: @scope/package-name',
        'INVALID_PACKAGE_NAME'
      );
    }

    // Check for multiple slashes in scoped packages
    if (trimmed.split('/').length > 2) {
      throw new PackageReadmeMcpError(
        `Scoped package name can only contain one slash.\n` +
        'Examples: @babel/core, @types/node, @my-org/utils\n' +
        'Format: @scope/package-name (exactly one slash)',
        'INVALID_PACKAGE_NAME'
      );
    }
  }

  // General npm package name validation rules
  if (!/^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(trimmed)) {
    let suggestion = '';
    
    // Provide specific suggestions based on common patterns
    if (trimmed.includes('@') && !trimmed.startsWith('@')) {
      suggestion = '\nNote: @ symbol is only allowed at the beginning for scoped packages.';
    } else if (/[^a-z0-9\-._~@\/]/.test(trimmed)) {
      const invalidChars = trimmed.match(/[^a-z0-9\-._~@\/]/g);
      const suggested = trimmed.replace(/[^a-z0-9\-._~@\/]/g, '-');
      suggestion = `\nInvalid characters found: ${Array.from(new Set(invalidChars)).join(', ')}\n` +
                  `Suggestion: "${suggested}"`;
    }

    throw new PackageReadmeMcpError(
      `Package name contains invalid characters.${suggestion}\n\n` +
      'Valid characters: lowercase letters (a-z), numbers (0-9), hyphens (-), dots (.), underscores (_), tildes (~)\n' +
      'For scoped packages, use @ at the beginning followed by scope/package-name\n\n' +
      'Examples:\n' +
      '• Regular: lodash, my-package, utils.js, package_name\n' +
      '• Scoped: @babel/core, @types/node, @my-org/utils',
      'INVALID_PACKAGE_NAME'
    );
  }

  // Check for reserved names
  const reservedNames = [
    'node_modules', 'favicon.ico', '.DS_Store', 'thumbs.db', 'package.json',
    'npm', 'node', 'javascript', 'js', 'nodejs'
  ];
  
  const packageNameOnly = trimmed.startsWith('@') ? trimmed.split('/')[1] : trimmed;
  if (reservedNames.includes(packageNameOnly.toLowerCase())) {
    throw new PackageReadmeMcpError(
      `"${packageNameOnly}" is a reserved name and cannot be used as a package name.\n` +
      `Try adding a prefix or suffix: ${packageNameOnly}-lib, my-${packageNameOnly}, ${packageNameOnly}-utils\n` +
      'Reserved names include system files and core JavaScript/Node.js terms.',
      'INVALID_PACKAGE_NAME'
    );
  }
}

export function validateVersion(version: string): void {
  if (!version || typeof version !== 'string') {
    throw new PackageReadmeMcpError('Version must be a string', 'INVALID_VERSION');
  }

  const trimmed = version.trim();
  if (trimmed.length === 0) {
    throw new PackageReadmeMcpError('Version cannot be empty', 'INVALID_VERSION');
  }

  // Allow "latest" and other dist-tags
  if (trimmed === 'latest' || trimmed === 'next' || trimmed === 'beta' || trimmed === 'alpha') {
    return;
  }

  // Validate semantic version
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  if (!semverRegex.test(trimmed)) {
    throw new PackageReadmeMcpError(
      'Version must be a valid semantic version (e.g., 1.0.0) or a dist-tag (e.g., latest)',
      'INVALID_VERSION'
    );
  }
}

export function validateSearchQuery(query: string): void {
  if (!query || typeof query !== 'string') {
    throw new PackageReadmeMcpError('Search query is required and must be a string', 'INVALID_SEARCH_QUERY');
  }

  const trimmed = query.trim();
  if (trimmed.length === 0) {
    throw new PackageReadmeMcpError('Search query cannot be empty', 'INVALID_SEARCH_QUERY');
  }

  if (trimmed.length > 250) {
    throw new PackageReadmeMcpError('Search query cannot exceed 250 characters', 'INVALID_SEARCH_QUERY');
  }
}

export function validateLimit(limit: number): void {
  if (!Number.isInteger(limit) || limit < 1 || limit > 250) {
    throw new PackageReadmeMcpError('Limit must be an integer between 1 and 250', 'INVALID_LIMIT');
  }
}

export function validateScore(score: number, name: string): void {
  if (typeof score !== 'number' || score < 0 || score > 1) {
    throw new PackageReadmeMcpError(`${name} must be a number between 0 and 1`, 'INVALID_SCORE');
  }
}