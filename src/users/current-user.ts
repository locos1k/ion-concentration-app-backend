export interface CurrentUser {
  readonly id: number;
  readonly username: string;
}

let instance: CurrentUser | undefined;

export function getCurrentUser(): CurrentUser {
  instance ??= Object.freeze({ id: 1, username: 'student' });
  return instance;
}
