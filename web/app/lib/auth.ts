import type { NextAuthOptions } from "next-auth";
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import {
  HANYANG_DOMAIN,
  isHanyangEmail,
  SESSION_MAX_AGE_SECONDS,
} from "./auth-constants";

function isHanyangGoogleProfile(profile: GoogleProfile | undefined) {
  return Boolean(
    profile?.email_verified &&
      profile.hd?.toLowerCase() === HANYANG_DOMAIN &&
      isHanyangEmail(profile.email)
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          hd: HANYANG_DOMAIN,
          prompt: "select_account",
          scope: "openid email",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  callbacks: {
    signIn({ account, profile }) {
      if (account?.provider !== "google") {
        return false;
      }

      return isHanyangGoogleProfile(profile as GoogleProfile | undefined);
    },
    jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile) {
        token.hd = (profile as GoogleProfile).hd.toLowerCase();
      }

      delete token.name;
      delete token.picture;
      delete token.sub;

      return token;
    },
    session({ session, token }) {
      session.hostedDomain =
        typeof token.hd === "string" ? token.hd : undefined;
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};
