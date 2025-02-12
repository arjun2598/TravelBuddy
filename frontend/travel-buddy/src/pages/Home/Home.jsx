import React, { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar';
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import TravelStoryCard from '../../components/Cards/TravelStoryCard';

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

  // Handle edit story click
  const handleEdit = (data) => {}
  
  // Handle story click
  const handleViewStory = (data) => {}
  
  // Handle update of favourite
  const updateIsFavourite = async (storyData) => {
    const storyId = storyData._id;

    try {
      const response = await axiosInstance.put("/update-is-favourite/" + storyId,
        {
          isFavourite: !storyData.isFavourite,
        }
      );

      if (response.data && response.data.story) {
        getAllTravelStories();
      }
    } catch (error) {
      console.log("An unexpected error occurred. Please try again.");
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
            {allStories.length > 0 ? (
              <div className='grid grid-cols-2 gap-4'>
                {allStories.map((item) => {
                  return (
                    <TravelStoryCard
                      key={item._id}
                      imgUrl={item.imageUrl}
                      title={item.title}
                      story={item.story}
                      date={item.visitedDate}
                      visitedLocation={item.visitedLocation}
                      isFavourite={item.isFavourite}
                      onEdit={() => handleEdit(item)}
                      onClick={() => handleViewStory(item)}
                      onFavouriteClick = {() => updateIsFavourite(item)}
                    />
                  );
                })}
              </div>
            ) : (
                <>Empty card here</>
            )}
          </div>

          <div className='w-[320px]'></div>
        </div>
      </div>
    </>
  );
};

export default Home