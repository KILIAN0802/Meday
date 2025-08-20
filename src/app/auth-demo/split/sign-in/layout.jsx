import { AuthSplitLayout } from 'src/layouts/auth-split';

// ----------------------------------------------------------------------

export default function Layout({ children }) {
  return (
    <AuthSplitLayout
      slotProps={{
        section: { title: 'Chào mừng bạn đến với website! 🎊' },
      }}
    >
      {children}
    </AuthSplitLayout>
  );
}
