import { Authenticator, useAuthenticator, View, Button } from "@aws-amplify/ui-react";
import type { AuthUser } from "aws-amplify/auth";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { EventPage } from "./pages/EventPage";
import { ProfilePage } from "./pages/ProfilePage";
import { EventCreatePage } from "./pages/EventCreatePage";
import { SecuritySetupPage } from "./pages/SecuritySetupPage.tsx";

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

function AuthenticatedContent({ signOut, user }: AuthenticatedContentProps) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage signOut={signOut} user={user} />} />
        <Route path="/security-setup" element={<SecuritySetupPage signOut={signOut} user={user} />} />
        <Route path="/profile" element={<ProfilePage signOut={signOut} user={user} />} />
        <Route path="/events/create" element={<EventCreatePage signOut={signOut} user={user} />} />
        <Route path="/events/:eventId" element={<EventPage signOut={signOut} user={user} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
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
      loginMechanisms={["email"]}
      passwordless={{
        preferredAuthMethod: "PASSWORD",
        hiddenAuthMethods: ["SMS_OTP"],
      }}
    >
      {({ signOut, user }) => <AuthenticatedContent signOut={signOut} user={user} />}
    </Authenticator>
  );
}

export default App;
