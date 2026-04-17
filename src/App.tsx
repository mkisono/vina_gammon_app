import { Authenticator } from "@aws-amplify/ui-react";
import type { AuthUser } from "aws-amplify/auth";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { EventPage } from "./pages/EventPage";
import { ProfilePage } from "./pages/ProfilePage";
import { EventCreatePage } from "./pages/EventCreatePage";

type AuthenticatedContentProps = {
  signOut?: () => void;
  user?: AuthUser;
};

function AuthenticatedContent({ signOut, user }: AuthenticatedContentProps) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage signOut={signOut} user={user} />} />
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
        return null;
      },
    },
  };

  return (
    <Authenticator
      components={authComponents}
      loginMechanisms={["email"]}
      passwordless={{
        preferredAuthMethod: "EMAIL_OTP",
        hiddenAuthMethods: ["PASSWORD", "SMS_OTP", "WEB_AUTHN"],
      }}
      formFields={{
        signIn: {
          password: {
            type: "hidden",
            isRequired: false,
            labelHidden: true,
          },
        },
        signUp: {
          password: {
            type: "hidden",
            isRequired: false,
            labelHidden: true,
          },
          confirm_password: {
            type: "hidden",
            isRequired: false,
            labelHidden: true,
          },
        },
      }}
    >
      {({ signOut, user }) => <AuthenticatedContent signOut={signOut} user={user} />}
    </Authenticator>
  );
}

export default App;
