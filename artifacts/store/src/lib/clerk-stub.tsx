import React from "react";
import { Show } from "@clerk/react";

export {
  ClerkProvider,
  SignIn,
  SignUp,
  Show,
  useUser,
  useClerk,
  useAuth,
  UserButton,
} from "@clerk/react";

export function SignedIn({ children }: { children: React.ReactNode }) {
  return <Show when="signed-in">{children}</Show>;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  return <Show when="signed-out">{children}</Show>;
}
