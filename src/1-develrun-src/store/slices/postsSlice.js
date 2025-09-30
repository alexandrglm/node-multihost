import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const fetchRecentPosts = createAsyncThunk(

    'posts/fetchRecent',
    async () => {
    
        const response = await axios.get(`${API_URL}/posts`);
        return response.data;
    
    }
);

export const fetchPostsWithQuery = createAsyncThunk(
    'posts/fetchQuery',
    
    async (query) => {
        const response = await axios.get(`${API_URL}/posts?title_like=${query}`);
        return response.data;
    }

);



const postsSlice = createSlice({

    name: 'posts',

    initialState: {
        recentPosts: [],
        resultsPosts: [],
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: builder => {
        
        builder
            .addCase(fetchRecentPosts.fulfilled, (state, action) => {
                state.recentPosts = action.payload;
            })
        
            .addCase(fetchPostsWithQuery.fulfilled, (state, action) => {
                state.resultsPosts = action.payload;
        
            });
    }
});

export default postsSlice.reducer;
