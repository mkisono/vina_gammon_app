import { Authenticator, useAuthenticator, View, Button } from "@aws-amplify/ui-react";
import type { AuthUser } from "aws-amplify/auth";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PublicHomePage } from "./pages/PublicHomePage";
import { PublicEventPage } from "./pages/PublicEventPage";
import { HomePage } from "./pages/HomePage";
import { EventPage } from "./pages/EventPage";
import { EventCreatePage } from "./pages/EventCreatePage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { useAuthUser } from "./hooks";

type AuthenticatedContentProps = {
  signOut?: () => void;
  user?: AuthUser;
};

function SignInFooter() {
  const { toForgotPassword } = useAuthenticator();
  return (
    <View textAlign="center" marginTop="1rem">
      <Button onClick={toForgotPassword} size="small" variation="link">
        パスワードを忘れた場合
      </Button>
    </View>
  );
}

function AuthenticatedAdminContent({ signOut, user }: AuthenticatedContentProps) {
  const { isAdmin, isLoadingAuthUser } = useAuthUser();

  if (isLoadingAuthUser) {
    return null;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage signOut={signOut} user={user} />} />
      <Route path="/users" element={<AdminUsersPage signOut={signOut} user={user} />} />
      <Route path="/events/create" element={<EventCreatePage signOut={signOut} user={user} />} />
      <Route path="/events/:eventId" element={<EventPage signOut={signOut} user={user} />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

function AdminApp() {
  const authComponents = {
    SignIn: {
      Footer() {
        return <SignInFooter />;
      },
    },
  };

  return (
    <Authenticator
      components={authComponents}
      hideSignUp
      initialState="signIn"
      loginMechanisms={["email"]}
      passwordless={{
        preferredAuthMethod: "PASSWORD",
        hiddenAuthMethods: ["SMS_OTP"],
      }}
    >
      {({ signOut, user }) => <AuthenticatedAdminContent signOut={signOut} user={user} />}
    </Authenticator>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/events/:eventId" element={<PublicEventPage />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
