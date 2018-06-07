export interface Editor {
  name: string;
}

export function handler(ev: JQueryEventObject): void;
export function is_terminating(): boolean;
export const editors: Editor[];
