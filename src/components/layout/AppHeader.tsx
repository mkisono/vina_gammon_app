import { Heading, View } from "@aws-amplify/ui-react";
import { useEffect, useRef, useState } from "react";

type AppHeaderProps = {
  isAdmin?: boolean;
  onGoHome: () => void;
  onGoProfile: () => void;
  onGoEventCreate?: () => void;
  onSignOut?: () => void;
};

export function AppHeader({
  isAdmin = false,
  onGoHome,
  onGoProfile,
  onGoEventCreate,
  onSignOut,
}: AppHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEscape);

    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, []);

  const handleGoProfile = () => {
    setIsMenuOpen(false);
    onGoProfile();
  };

  const handleSignOut = () => {
    setIsMenuOpen(false);
    onSignOut?.();
  };

  const handleGoEventCreate = () => {
    setIsMenuOpen(false);
    onGoEventCreate?.();
  };

  return (
    <View className="appbar">
      <View className="appbar-left">
        <button
          type="button"
          className="appbar-home-link"
          aria-label="ホームへ戻る"
          onClick={onGoHome}
        >
          <svg
            className="appbar-home-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M4.5 10.5L12 4l7.5 6.5v8a1 1 0 0 1-1 1h-4.5v-5h-4v5H5.5a1 1 0 0 1-1-1z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <Heading level={2} className="appbar-title">海老名でバックギャモン</Heading>
      </View>

      <View className="appbar-right" ref={menuRef}>
        <button
          type="button"
          className="appbar-account-trigger"
          aria-label="アカウントメニュー"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <span className="appbar-account-icon" />
        </button>

        {isMenuOpen && (
          <View className="appbar-menu">
            {isAdmin && onGoEventCreate && (
              <button type="button" className="appbar-menu-item" onClick={handleGoEventCreate}>
                イベント作成
              </button>
            )}
            <button type="button" className="appbar-menu-item" onClick={handleGoProfile}>
              プロフィール編集
            </button>
            <button type="button" className="appbar-menu-item" onClick={handleSignOut}>
              サインアウト
            </button>
          </View>
        )}
      </View>
    </View>
  );
}
