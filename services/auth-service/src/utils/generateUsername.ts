const normalizeUsername = (value: string): string => {
    return value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "");
};

export const generateUsername = (firstName: string, lastName: string): string => {
    const baseUsername = normalizeUsername(`${firstName}${lastName}`);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);

    return `${baseUsername}${randomSuffix}`;
};