import React, { useState } from 'react'
import PasswordInput from '../../components/Input/PasswordInput';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    return (
        <div className='h-screen bg-cyan-50 overflow-hidden relative'> 
            <div className='login-ui-box right-10 -top-40' />
            <div className='login-ui-box bg-cyan-200 -bottom-40 right-1/2' />

            <div className='container h-screen flex items-center justify-center px-20 mx-auto'>
                <div className='w-2/4 h-[90vh] flex items-end bg-login-bg-img bg-cover bg-center rounded-lg p-10 z-50'>
                    <div>
                        <h4 className='text-5xl font-semibold leading-[58px]'>
                            Capture your Journeys!
                        </h4>
                        <p className='text-[15px] leading-6 pr-6 mt-2'>
                            Record your travel experiences and memories in your
                            personal travel journal.
                        </p>
                    </div>
                </div>

                <div className='w-2/4 h-[75vh] bg-white rounded-r-lg relative p-16 shadow-lg shadow-cyan-200/20'>
                    <form onSubmit={() => { }}>
                        <h4 className='text-2xl font-semibold mb-7'>Login</h4>

                        <input type='text' placeholder='Email' className='input-box' />

                        <PasswordInput />

                        <button type='submit' className='btn-primary'>
                            LOGIN
                        </button>

                        <p className='text-xs text-slate-500 text-center my-4'>Or</p>

                        <button
                            type='submit'
                            className='btn-primary btn-light'
                            onClick={() => {
                                navigate("/signUp");
                            }}
                        >
                            CREATE ACCOUNT
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login