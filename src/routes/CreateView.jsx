import React, { useState } from 'react';
import './CreateView.css'
import { supabase } from '../client.js';
import PostForm from '../components/PostForm.jsx';

const CreateView = () => {
  const [post, setPost] = useState({ title: "", text: "", img: "", likes: 0, author: "", author_id: "", author_nickname: "", community: "" });
  const [fileData, setFileData] = useState(null);

  const account_info = JSON.parse(localStorage.getItem('account_info'));

  const handleFileChange = (event) => {
      const file = event.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setFileData(reader.result);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleChange = (event) => {
      const { name, value } = event.target;
      setPost((prevState) => ({
          ...prevState,
          [name]: value,
      }));
  };

  const handleSubmit = async (event) => {
      event.preventDefault();

      // Check if the title or text fields are empty
      if (!post.title.trim() || !post.text.trim()) {
          alert("Please enter both title and text creating a post.");
          return;
      }

      // Convert the file data to a base64 string if available
      const imgData = fileData ? fileData.split(",")[1] : null;

      const { data, error } = await supabase
          .from('posts')
          .insert({
              id: Date.now(),
              title: post.title,
              text: post.text,
              img: imgData,
              author: account_info.email,
              author_id: account_info.account_id,
              author_nickname: account_info.nickname,
              likes: 0,
              community: post.community !== "nocommunity" ? post.community : null
          });

      if (error) {
          console.error('Error creating post:', error.message);
      } else {
          console.log('Post created successfully:', data);
      }

      // Increment post count
      const newPostCount = account_info.post_count + 1;

      // Update accounts table with the new post count
      await supabase
          .from('accounts')
          .update({ post_count: newPostCount })
          .eq('account_id', account_info.account_id);

      // Update localStorage account_info
      const updatedAccountInfo = { ...account_info, post_count: newPostCount };
      localStorage.setItem('account_info', JSON.stringify(updatedAccountInfo));
      
    // Increment post count for the community if a community was selected
    if (post.community && post.community !== "nocommunity") {
      // Fetch current post count for the community
      const { data: communityData, error: communityError } = await supabase
          .from('communities')
          .select('post_count')
          .eq('id', post.community)
          .single();

      if (communityError) {
          console.error('Error fetching community post count:', communityError.message);
      } else {
          const newCommunityPostCount = communityData.post_count + 1;
          await supabase
              .from('communities')
              .update({ post_count: newCommunityPostCount })
              .eq('id', post.community);
      } }
      // Reset post and file data
      setPost({ title: "", text: "", img: "", likes: 0, author: "", author_id: "", author_nickname: "", community: "" });
      setFileData(null);

      window.location = "/";
  };

  const clearImageInput = () => {
      setFileData(null);
      setPost((prev) => ({
          ...prev,
          img: "",
      }));
  };

  
  return (
    <>
    <div className='main-block'>
      <h2>Share your thoughts with the girls! </h2>

      <PostForm
        handleSubmit={handleSubmit}
        handleChange={handleChange}
        handleFileChange={handleFileChange}
        clearImageInput={clearImageInput}
        title={post.title}
        text={post.text}
        img={post.img}
        isEdit={false}  
      />


      </div>
    </>
  );
};

export default CreateView;