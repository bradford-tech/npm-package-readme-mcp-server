import { validatePackageName } from '../src/utils/validators.js';
import { PackageReadmeMcpError } from '../src/types/index.js';

describe('NPM Package Validation Tests', () => {
  describe('validatePackageName', () => {
    test('valid package names should pass', () => {
      const validNames = [
        'lodash',
        'express',
        'react',
        'vue',
        'angular',
        'my-package',
        'my_package',
        'package.name',
        'package-name-123',
        'abc123',
        '123abc',
        'a',
        'valid-package-name',
        'valid_package_name',
        'valid.package.name',
        'valid~package',
        '@babel/core',
        '@types/node',
        '@my-org/utils',
        '@scope/package',
        '@babel/preset-env',
        '@angular/core',
        '@vue/cli'
      ];

      validNames.forEach(name => {
        expect(() => validatePackageName(name)).not.toThrow();
      });
    });

    describe('invalid package names should fail with specific errors', () => {
      test('lodash should pass (valid)', () => {
        expect(() => validatePackageName('lodash')).not.toThrow();
      });

      test('LODASH should fail (invalid - uppercase)', () => {
        expect(() => validatePackageName('LODASH')).toThrow(PackageReadmeMcpError);
        try {
          validatePackageName('LODASH');
        } catch (error) {
          expect(error).toBeInstanceOf(PackageReadmeMcpError);
          expect(error.message).toContain('cannot contain uppercase letters');
          expect(error.message).toContain('lodash');
          expect(error.code).toBe('INVALID_PACKAGE_NAME');
        }
      });

      test('my package should fail (invalid - spaces)', () => {
        expect(() => validatePackageName('my package')).toThrow(PackageReadmeMcpError);
        try {
          validatePackageName('my package');
        } catch (error) {
          expect(error).toBeInstanceOf(PackageReadmeMcpError);
          expect(error.message).toContain('cannot contain spaces');
          expect(error.message).toContain('my-package');
          expect(error.code).toBe('INVALID_PACKAGE_NAME');
        }
      });

      test('@babel/core should pass (valid scoped)', () => {
        expect(() => validatePackageName('@babel/core')).not.toThrow();
      });

      test('@babel should fail (invalid - missing package)', () => {
        expect(() => validatePackageName('@babel')).toThrow(PackageReadmeMcpError);
        try {
          validatePackageName('@babel');
        } catch (error) {
          expect(error).toBeInstanceOf(PackageReadmeMcpError);
          expect(error.message).toContain('must include a slash after the scope');
          expect(error.message).toContain('@babel/package-name');
          expect(error.code).toBe('INVALID_PACKAGE_NAME');
        }
      });

      test('@/core should fail (invalid - missing scope)', () => {
        expect(() => validatePackageName('@/core')).toThrow(PackageReadmeMcpError);
        try {
          validatePackageName('@/core');
        } catch (error) {
          expect(error).toBeInstanceOf(PackageReadmeMcpError);
          expect(error.message).toContain('must have a valid scope name');
          expect(error.code).toBe('INVALID_PACKAGE_NAME');
        }
      });

      test('@scope/ should fail (invalid - missing package name)', () => {
        expect(() => validatePackageName('@scope/')).toThrow(PackageReadmeMcpError);
        try {
          validatePackageName('@scope/');
        } catch (error) {
          expect(error).toBeInstanceOf(PackageReadmeMcpError);
          expect(error.message).toContain('must have a package name after the slash');
          expect(error.code).toBe('INVALID_PACKAGE_NAME');
        }
      });

      test('@ should fail (invalid - just @)', () => {
        expect(() => validatePackageName('@')).toThrow(PackageReadmeMcpError);
        try {
          validatePackageName('@');
        } catch (error) {
          expect(error).toBeInstanceOf(PackageReadmeMcpError);
          expect(error.message).toContain('must include a slash after the scope');
          expect(error.code).toBe('INVALID_PACKAGE_NAME');
        }
      });

      test('empty string should fail', () => {
        expect(() => validatePackageName('')).toThrow(PackageReadmeMcpError);
        try {
          validatePackageName('');
        } catch (error) {
          expect(error).toBeInstanceOf(PackageReadmeMcpError);
          expect(error.message).toContain('cannot be empty');
          expect(error.code).toBe('INVALID_PACKAGE_NAME');
        }
      });

      test('package names starting with dots should fail', () => {
        expect(() => validatePackageName('.package')).toThrow(PackageReadmeMcpError);
        try {
          validatePackageName('.package');
        } catch (error) {
          expect(error).toBeInstanceOf(PackageReadmeMcpError);
          expect(error.message).toContain('cannot start or end with a dot');
          expect(error.message).toContain('package');
          expect(error.code).toBe('INVALID_PACKAGE_NAME');
        }
      });

      test('package names ending with dots should fail', () => {
        expect(() => validatePackageName('package.')).toThrow(PackageReadmeMcpError);
        try {
          validatePackageName('package.');
        } catch (error) {
          expect(error).toBeInstanceOf(PackageReadmeMcpError);
          expect(error.message).toContain('cannot start or end with a dot');
          expect(error.message).toContain('package');
          expect(error.code).toBe('INVALID_PACKAGE_NAME');
        }
      });

      test('package names starting with hyphens should fail', () => {
        expect(() => validatePackageName('-package')).toThrow(PackageReadmeMcpError);
        try {
          validatePackageName('-package');
        } catch (error) {
          expect(error).toBeInstanceOf(PackageReadmeMcpError);
          expect(error.message).toContain('cannot start or end with a hyphen');
          expect(error.message).toContain('package');
          expect(error.code).toBe('INVALID_PACKAGE_NAME');
        }
      });

      test('package names ending with hyphens should fail', () => {
        expect(() => validatePackageName('package-')).toThrow(PackageReadmeMcpError);
        try {
          validatePackageName('package-');
        } catch (error) {
          expect(error).toBeInstanceOf(PackageReadmeMcpError);
          expect(error.message).toContain('cannot start or end with a hyphen');
          expect(error.message).toContain('package');
          expect(error.code).toBe('INVALID_PACKAGE_NAME');
        }
      });

      test('package names with consecutive dots should fail', () => {
        expect(() => validatePackageName('package..name')).toThrow(PackageReadmeMcpError);
        try {
          validatePackageName('package..name');
        } catch (error) {
          expect(error).toBeInstanceOf(PackageReadmeMcpError);
          expect(error.message).toContain('cannot contain consecutive dots');
          expect(error.message).toContain('package.name');
          expect(error.code).toBe('INVALID_PACKAGE_NAME');
        }
      });

      test('package names with underscore-hyphen sequences should fail', () => {
        expect(() => validatePackageName('package_-name')).toThrow(PackageReadmeMcpError);
        expect(() => validatePackageName('package-_name')).toThrow(PackageReadmeMcpError);
        try {
          validatePackageName('package_-name');
        } catch (error) {
          expect(error).toBeInstanceOf(PackageReadmeMcpError);
          expect(error.message).toContain('cannot contain underscore-hyphen sequences');
          expect(error.message).toContain('package-name');
          expect(error.code).toBe('INVALID_PACKAGE_NAME');
        }
      });

      test('reserved names should fail', () => {
        const reservedNames = ['node_modules', 'favicon.ico', 'npm', 'node', 'javascript'];
        
        reservedNames.forEach(name => {
          expect(() => validatePackageName(name)).toThrow(PackageReadmeMcpError);
          try {
            validatePackageName(name);
          } catch (error) {
            expect(error).toBeInstanceOf(PackageReadmeMcpError);
            expect(error.message).toContain('is a reserved name');
            expect(error.code).toBe('INVALID_PACKAGE_NAME');
          }
        });
      });

      test('scoped packages with multiple slashes should fail', () => {
        expect(() => validatePackageName('@scope/package/extra')).toThrow(PackageReadmeMcpError);
        try {
          validatePackageName('@scope/package/extra');
        } catch (error) {
          expect(error).toBeInstanceOf(PackageReadmeMcpError);
          expect(error.message).toContain('can only contain one slash');
          expect(error.code).toBe('INVALID_PACKAGE_NAME');
        }
      });

      test('package names with invalid characters should fail', () => {
        const invalidNames = [
          'package!name',
          'package@name',
          'package#name',
          'package$name',
          'package%name',
          'package&name',
          'package*name',
          'package+name',
          'package=name',
          'package?name',
          'package[name]',
          'package{name}',
          'package|name',
          'package\\name',
          'package"name',
          "package'name"
        ];

        invalidNames.forEach(name => {
          expect(() => validatePackageName(name)).toThrow(PackageReadmeMcpError);
        });
      });

      test('excessively long package names should fail', () => {
        const longName = 'a'.repeat(215);
        expect(() => validatePackageName(longName)).toThrow(PackageReadmeMcpError);
        try {
          validatePackageName(longName);
        } catch (error) {
          expect(error).toBeInstanceOf(PackageReadmeMcpError);
          expect(error.message).toContain('cannot exceed 214 characters');
          expect(error.code).toBe('INVALID_PACKAGE_NAME');
        }
      });

      test('non-string input should fail', () => {
        expect(() => validatePackageName(123)).toThrow(PackageReadmeMcpError);
        expect(() => validatePackageName(null)).toThrow(PackageReadmeMcpError);
        expect(() => validatePackageName(undefined)).toThrow(PackageReadmeMcpError);
        expect(() => validatePackageName({})).toThrow(PackageReadmeMcpError);
      });
    });

    test('package names with whitespace should be trimmed', () => {
      // Note: We're not testing the return value since validatePackageName doesn't return anything
      // We're just checking that it doesn't throw for valid names after trimming
      expect(() => validatePackageName('  lodash  ')).not.toThrow();
      expect(() => validatePackageName('\t@babel/core\n')).not.toThrow();
    });
  });
});