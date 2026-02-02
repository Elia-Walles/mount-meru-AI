declare module 'bcryptjs' {
  function hash(s: string, rounds: number): Promise<string>;
  function compare(s: string, hash: string): Promise<boolean>;
}
