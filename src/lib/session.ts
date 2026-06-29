export type Employee = {
  id: string;
  name: string;
  branch: string;
  role: string;
  status: string;
};

const KEY = 'hk_employee';

export function getSession(): Employee | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setSession(emp: Employee) {
  sessionStorage.setItem(KEY, JSON.stringify(emp));
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
}
