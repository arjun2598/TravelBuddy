import React, { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar';
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";

const Home = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [allStories, setAllStories] = useState([]);

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

  // Get all travel stories
  const getAllTravelStories = async () => {
    try {
      const response = await axiosInstance.get("/get-all-stories");
      if (response.data && response.data.stories) {
        setAllStories(response.data.stories);
      }
    } catch (error) {
      console.log("An unexpected error occured. Please try again.");
    }
  }

  useEffect(() => {
    getAllTravelStories();
    getUserInfo();
  
    return () => {
      
    }
  }, []);
  

  return (
    <>
      <Navbar userInfo={userInfo} />

      <div className='container mx-auto py-10'>
        <div className='flex gap-7'>
          <div className='flex-1'>
            <div className='w-[320px]'></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home