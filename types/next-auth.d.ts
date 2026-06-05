import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      provider: string | null;
    } & DefaultSession["user"];
  }
}
