const API_BASE_URL = "http://localhost:8080/api";
async function request<T>(path: string, options = {}): Promise<T> {
    const url = API_BASE_URL + path;
    const headers = { "Content-type": "application/json" };

    const config: RequestInit = {
        headers: {
            ...headers,
        },
        ...options,
        credentials: "include",
    };

    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(`${response.status}: ${JSON.stringify(data)}`);
    }

    return data;
}

export async function register(data: {
    email: string;
    username: string;
    password: string;
}) {
    return request<{ message: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function login(data: { email: string; password: string }) {
    return request<{ message: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// export async function getRooms(data: { page: string; limit: string }) {
//     return request("/rooms" + new URLSearchParams({data}).toString(), {});
// }

export async function getUser() {
    return request<{ userId: string; username: string; email: string }>(
        "/auth/me",
        {
            method: "GET",
        },
    );
}

export async function getRooms(data: { page: string; limit: string }) {
    return request<{ data: Room[] }>(
        "/rooms?" +
            new URLSearchParams({
                page: data.page,
                limit: data.limit,
            }).toString(),
        {
            method: "GET",
        },
    );
}

export async function createRoom(data: { name: string }) {
    return request<{data: Room}>(
        "/room",
        {
            method: "POST",
            body: JSON.stringify(data),
        }
    );
}

export function getLocalUser(): User | null {
    return user;
}

export async function initAuth() {
    try {
        const user = await getUser();
        setUser(user);
    } catch (err) {
        setUser(null);
    }
}

export function setUser(u: User | null) {
    user = u;
}

export type User = {
    userId: string;
    username: string;
    email: string;
};

export let user: User | null = null;
await initAuth();

export type Room = {
    id: string;
    name: string;
    userId: string;
    createdAt: string;
    expiresAt: string;
};
