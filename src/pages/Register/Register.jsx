import React, { useState } from "react";
import Footer from "../../components/Footer/Footer.jsx";
import './Register.css';
import { assets } from '../../assets/assets.js';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from 'js-cookie'; // Nhập thư viện js-cookie

const Register = () => {
    const navigate = useNavigate();

    // State để lưu thông tin đăng ký
    const [fullName, setFullName] = useState("");
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState(""); // Added error state
    const [passwordError, setPasswordError] = useState("");

    const handleLogin = () => {
        navigate('/login');
    };

    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    };
    const validateFullName = (name) => {
        // Không cho phép tên chứa số
        const fullNameRegex = /^[^\d]*$/;
        return fullNameRegex.test(name);
    };
    
    const validateUserName = (username) => {
        // Không cho phép chứa các ký hiệu &, =, _, ', -, +, ,, <, >, hoặc nhiều dấu chấm liên tiếp
        // Không cho phép khoảng trắng
        // Cho phép bắt đầu/kết thúc với ký tự không phải chữ số nhưng không phải dấu chấm
        const userNameRegex = /^(?!.*\.\.)(?!.*\s)(?!.*[&=_'\-+,<>])(?!\.)[A-Za-z0-9.]+(?<!\.)$/;
        return userNameRegex.test(username);
    };
    

    const handleRegister = async () => {
        if (!validateFullName(fullName)) {
            setError("Họ và tên không được chứa chữ số.");
            return;
        }
    
        if (!validateUserName(userName)) {
            setError("Tên tài khoản không hợp lệ. Vui lòng nhập tên tài khoản không chứa ký hiệu đặc biệt (&, =, _, ', -, +, ,, <, >), không chứa khoảng trắng và không có nhiều dấu chấm liên tiếp.");
            return;
        }
    
        if (!validatePassword(password)) {
            setError('Mật khẩu không hợp lệ, vui lòng nhập mật khẩu gồm 8 chữ số trở lên, gồm ký tự đặc biệt, chữ thường, chữ hoa và số!');
            return;
        }
        setPasswordError("");
        const data = {
            fullName,
            userName,
            password
        };

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/v1/auth/register`, data, {
                headers: {
                    'Content-Type': 'application/json' // Đảm bảo rằng content type là JSON
                }
            });

            console.log('Đăng ký thành công:', response.data);
            setMessage('Đăng ký thành công')

            // // Lưu token vào cookie nếu có trong phản hồi
            // if (response.data.access_token) {
            //     Cookies.set('access_token', response.data.access_token, { expires: 7 }); // Hết hạn sau 7 ngày
            // }
            // if (response.data.refresh_token) {
            //     Cookies.set('refresh_token', response.data.refresh_token, { expires: 7 });
            // }

            // Điều hướng đến trang home sau một khoảng thời gian
            setTimeout(() => {
                navigate('/login');
            }, 2000); 
        } catch (error) {
            console.error('Lỗi đăng ký:', error);
            if (error.response) {
                const { status, data } = error.response;
                if (status === 409) {
                    console.log(data)
                    setError("Tài khoản đã tồn tại"); 
                    setMessage(""); 
                }
            }
        }
    };

    const handleBack = () => {
        navigate('/home'); // Điều hướng đến trang Register
    };

    // Handler for input change
    const handleInputChange = (setter) => (event) => {
        setter(event.target.value);
        setError(""); 
        setMessage(""); 
        if (setter === setPassword) setPasswordError("");
    };

    return (
        <div className="register-page">
            <div className="register-container">
                <div className="login-image">
                    <img src={assets.login} alt='' />
                    <i className="ti-arrow-left" onClick={handleBack}></i>
                </div>
                <div className="register-form">
                    <h2>Tạo tài khoản mới</h2>
                    {/* Conditional rendering for prompt message */}
                    {!message && !error && <p className="small-text">Nhập thông tin cá nhân bên dưới</p>}

                    {/* Display error if it exists */}
                    {message && <p className="message">{message}</p>}
                    {error && <p className="error-message">{error}</p>}

                    <div className="register-input-group">
                        <input
                            type="text"
                            placeholder="Họ và tên"
                            className={`register-input ${error && !validateFullName(fullName) ? 'input-error' : ''}`}
                            value={fullName}
                            onChange={handleInputChange(setFullName)} // Use the new handler
                            style={{
                                width: '80%',
                                padding: '10px 0',
                                border: 'none',
                                borderBottom: '1px solid #666',
                                outline: 'none',
                                margin: '5px 0',
                                fontSize: '16px'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Tên tài khoản"
                            className={`register-input ${error && !validateUserName(userName) ? 'input-error' : ''}`}
                            value={userName}
                            onChange={handleInputChange(setUserName)} // Use the new handler
                            style={{
                                width: '80%',
                                padding: '10px 0',
                                border: 'none',
                                borderBottom: '1px solid #666',
                                outline: 'none',
                                margin: '5px 0',
                                fontSize: '16px'
                            }}
                        />
                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            className={`input ${passwordError ? 'input-error' : ''}`}
                            value={password}
                            onChange={handleInputChange(setPassword)} // Use the new handler
                        />
                    </div>
                    <div className="button-group-register">
                        <button className="btn-register" onClick={handleRegister}>Tạo tài khoản</button>
                    </div>
                    <button className="btn-google">
                        <img src={assets.gg} alt='' className="google-icon" />Đăng Nhập bằng Google
                    </button>
                    <p className="login-text">Bạn đã có tài khoản? <span className="login-link" onClick={handleLogin}>Đăng nhập</span></p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Register;
