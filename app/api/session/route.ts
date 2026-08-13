import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "@/app/chatgpt-auth";

export const runtime = "edge";

export async function GET() {
  const user = await getChatGPTUser();

  if (!user && process.env.NODE_ENV === "development") {
    return Response.json(
      {
        authenticated: true,
        user: { displayName: "Local preview", email: "local@datasprint.dev" },
        signOutPath: null,
        localPreview: true,
      },
      { headers: { "cache-control": "no-store" } },
    );
  }

  return Response.json(
    user
      ? {
          authenticated: true,
          user: { displayName: user.displayName, email: user.email },
          signOutPath: chatGPTSignOutPath("/"),
          localPreview: false,
        }
      : {
          authenticated: false,
          user: null,
          signInPath: chatGPTSignInPath("/"),
          localPreview: false,
        },
    { headers: { "cache-control": "no-store" } },
  );
}
