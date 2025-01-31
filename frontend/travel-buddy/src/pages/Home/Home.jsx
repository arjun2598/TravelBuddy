import React, { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar';
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";

const Home = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);

  // Get user info
  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      if (response.data && response.data.user) {
        setUserInfo(response.data.user); // Set user info if it exists
      }
    } catch (error) {
      if (error.response.status === 401) {
        localStorage.clear(); // Clear storage if unauthorized
        navigate("/login"); // Redirect to login page
      }
    }
  };

useEffect(() => {
    getUserInfo();
  
    return () => {
      
    }
  }, []);
  

  return (
    <>
      <Navbar userInfo={userInfo} />
    </>
  );
};

export default Home