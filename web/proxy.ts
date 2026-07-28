import { withAuth } from "next-auth/middleware";
import { HANYANG_DOMAIN, isHanyangEmail } from "@/app/lib/auth-constants";

export default withAuth({
  callbacks: {
    authorized({ token }) {
      return Boolean(
        token?.email &&
          isHanyangEmail(token.email) &&
          token.hd === HANYANG_DOMAIN
      );
    },
  },
  pages: {
    signIn: "/",
  },
});

export const config = {
  matcher: ["/data/:path*"],
};
