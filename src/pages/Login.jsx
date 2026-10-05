import LoginForm from "../components/LoginForm";

function Login() {
    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>Pondok Tahfidz RSQ</h1>
                    <p>Aplikasi Pengelolaan Pondok Tahfidz RSQ</p>
                </div>

                <LoginForm />

                <p className="login-footer">
                    Silakan masuk menggunakan akun Anda
                </p>
            </div>
        </div>
    );
}

export default Login;