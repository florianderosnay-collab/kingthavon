import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
        }}>
            <SignIn />
        </div>
    );
}
