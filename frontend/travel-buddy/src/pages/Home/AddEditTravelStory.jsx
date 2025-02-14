import React from 'react'
import { MdAdd, MdDeleteOutline, MdClose, MdUpdate } from 'react-icons/md'
import DateSelector from '../../components/Input/DateSelector';

const AddEditTravelStory = ({ storyInfo, type, onClose, getAllTravelStories, }) => {

  const handleAddOrUpdateClick = () => {

  };


  return (
    <div>
      <div className='flex items-center justify-between'>
         <h5 className='text-xl font-medium text-slate-700'>
           {type === "add" ? "Add Story" : "Update Story"}
        </h5>
              
        <div>
            <div className='flex items-center gap-3 bg-cyan-50/50 p-2 rounded-l-lg'>
              {type === 'add' ? <button className='btn-small' onClick={handleAddOrUpdateClick}>
                <MdAdd className='text-lg' />ADD STORY
                  </button> : <>
                    <button className='btn-small' onClick={handleAddOrUpdateClick}>
                      <MdUpdate className='text-lg' />UPDATE STORY
                    </button>
                  </>}

              <button className='' onClick={onClose}>
                <MdClose className='text-xl text-slate-400 cursor-pointer rounded-full hover:bg-slate-200' /> 
              </button>
            </div>        
        </div>
      </div>    

          <div>
              <div className='flex-1 flex flex-col gap-2 pt-4'>
                  <label className='input-label'>TITLE</label>
                  <input type='text' className='text-2xl text-slate-950 outline-none' placeholder='A Day at the Eiffel Tower' />

                  <div className='my-3'>
                      <DateSelector />
                  </div>
              </div>
        </div>
    </div>
  )
}

export default AddEditTravelStory