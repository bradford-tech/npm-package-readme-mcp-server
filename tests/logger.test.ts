import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, LogLevel } from '../src/utils/logger.js';

describe('Logger', () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  describe('constructor', () => {
    test('defaults to INFO when no level provided', () => {
      const logger = new Logger();
      logger.info('hello');
      expect(stderrSpy).toHaveBeenCalledOnce();
    });

    test('accepts numeric LogLevel', () => {
      const logger = new Logger(LogLevel.ERROR);
      logger.warn('filtered');
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    test('accepts string level (case-insensitive)', () => {
      const logger = new Logger('debug');
      logger.debug('shown');
      expect(stderrSpy).toHaveBeenCalledOnce();
    });

    test('falls back to INFO for unknown string', () => {
      const logger = new Logger('GARBAGE');
      logger.info('shown');
      logger.debug('filtered');
      expect(stderrSpy).toHaveBeenCalledOnce();
    });
  });

  describe('output', () => {
    test('writes to stderr (not stdout)', () => {
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const logger = new Logger(LogLevel.INFO);
      logger.info('msg');
      expect(stderrSpy).toHaveBeenCalledOnce();
      expect(stdoutSpy).not.toHaveBeenCalled();
      stdoutSpy.mockRestore();
    });

    test('includes the level name in the output', () => {
      const logger = new Logger(LogLevel.DEBUG);
      logger.warn('a warning');
      const written = stderrSpy.mock.calls[0]?.[0] as string;
      expect(written).toContain('WARN');
      expect(written).toContain('a warning');
    });

    test('serialises the data argument when present', () => {
      const logger = new Logger(LogLevel.INFO);
      logger.info('with data', { foo: 'bar' });
      const written = stderrSpy.mock.calls[0]?.[0] as string;
      expect(written).toContain('"foo":"bar"');
    });

    test('renders Error data with name and message', () => {
      const logger = new Logger(LogLevel.INFO);
      logger.error('boom', new Error('something broke'));
      const written = stderrSpy.mock.calls[0]?.[0] as string;
      expect(written).toContain('Error');
      expect(written).toContain('something broke');
    });
  });

  describe('level filtering', () => {
    test('INFO suppresses DEBUG messages', () => {
      const logger = new Logger(LogLevel.INFO);
      logger.debug('hidden');
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    test('ERROR suppresses WARN, INFO, and DEBUG', () => {
      const logger = new Logger(LogLevel.ERROR);
      logger.warn('hidden');
      logger.info('hidden');
      logger.debug('hidden');
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    test('DEBUG shows all four levels', () => {
      const logger = new Logger(LogLevel.DEBUG);
      logger.error('shown');
      logger.warn('shown');
      logger.info('shown');
      logger.debug('shown');
      expect(stderrSpy).toHaveBeenCalledTimes(4);
    });
  });
});
