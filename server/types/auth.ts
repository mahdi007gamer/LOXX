export interface RegisterDTO {
  username: string;
  phone: string;
  password: string;
  email?: string;
}

export interface LoginDTO {
  phone: string;
  password: string;
}
