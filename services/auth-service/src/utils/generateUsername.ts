// example usage: generateUniqueUsername("user") might return "user_a1b2c3"
export const generateUniqueUsername = (base: string): string => {
    const randomSuffix = Math.random().toString(36).substring(2, 8); // Generate a random 6-character string
    return `${base}_${randomSuffix}`;
}

/**
 regiser -> first name , last name , email, password, generate username from first name and last name, if username already exists, add random suffix to make it unique
 login -> email or phone, password
 */