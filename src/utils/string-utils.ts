export function capitalize(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function slugify(str: string): string {
    if (!str) return str;
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function truncate(str: string, length: number): string {
    if (!str) return str;
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}
