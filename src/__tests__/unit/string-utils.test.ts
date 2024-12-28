import { capitalize, slugify, truncate } from '../../utils/string-utils.ts';

describe('String Utils', () => {
    describe('capitalize', () => {
        it('should capitalize the first letter and lowercase the rest', () => {
            expect(capitalize('hello')).toBe('Hello');
            expect(capitalize('WORLD')).toBe('World');
            expect(capitalize('hELLo WoRLD')).toBe('Hello world');
        });

        it('should handle empty strings', () => {
            expect(capitalize('')).toBe('');
        });

        it('should handle single character strings', () => {
            expect(capitalize('a')).toBe('A');
        });
    });

    describe('slugify', () => {
        it('should convert spaces to hyphens', () => {
            expect(slugify('hello world')).toBe('hello-world');
        });

        it('should remove special characters', () => {
            expect(slugify('hello! @world#')).toBe('hello-world');
        });

        it('should convert to lowercase', () => {
            expect(slugify('Hello World')).toBe('hello-world');
        });

        it('should handle multiple spaces and special characters', () => {
            expect(slugify('  Hello  World! ')).toBe('hello-world');
        });

        it('should handle empty strings', () => {
            expect(slugify('')).toBe('');
        });
    });

    describe('truncate', () => {
        it('should truncate string longer than specified length', () => {
            expect(truncate('hello world', 5)).toBe('hello...');
        });

        it('should not truncate string shorter than specified length', () => {
            expect(truncate('hello', 10)).toBe('hello');
        });

        it('should handle empty strings', () => {
            expect(truncate('', 5)).toBe('');
        });

        it('should handle exact length strings', () => {
            expect(truncate('hello', 5)).toBe('hello');
        });
    });
});
