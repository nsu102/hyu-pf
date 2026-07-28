import { getServerSession } from "next-auth";
import { CourseDashboard } from "./components/CourseDashboard";
import { LockedDashboard } from "./components/LockedDashboard";
import { authOptions } from "./lib/auth";
import { HANYANG_DOMAIN, isHanyangEmail } from "./lib/auth-constants";

type HomeProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

function getAuthError(error: string | undefined) {
  if (!error) {
    return null;
  }

  if (error === "AccessDenied") {
    return "한양대학교 Google Workspace 계정만 이용할 수 있어요.";
  }

  return "로그인을 완료하지 못했습니다. 계정을 확인한 뒤 다시 시도해 주세요.";
}

export default async function Home({ searchParams }: HomeProps) {
  const [session, params] = await Promise.all([
    getServerSession(authOptions),
    searchParams,
  ]);
  const email = session?.user?.email;
  const isAuthenticated =
    Boolean(email && isHanyangEmail(email)) &&
    session?.hostedDomain === HANYANG_DOMAIN;

  if (!isAuthenticated || !email) {
    const errorCode = Array.isArray(params.error)
      ? params.error[0]
      : params.error;

    return <LockedDashboard errorMessage={getAuthError(errorCode)} />;
  }

  return (
    <CourseDashboard
      user={{
        name: session.user?.name,
        email,
      }}
    />
  );
}
