import Learn from "@ui/screens/Learn";
import AuthGate from "@/interfaces/ui/components/AuthGate";

export const dynamic = "force-dynamic";

export default function Page(){
  return (
    <AuthGate>
      <Learn />
    </AuthGate>
  );
}
