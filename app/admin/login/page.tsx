// app/admin/login/page.tsx
// Server component wrapping client form to fix static export
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginForm />;
}
