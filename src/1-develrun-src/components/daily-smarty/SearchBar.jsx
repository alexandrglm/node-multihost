import React from 'react';
import { useForm } from 'react-hook-form';

function SearchBar({ page, onSubmit }) {

    const { register, handleSubmit } = useForm();

    const onFormSubmit = (data) => {
        onSubmit(data.query);
    };

    return (
    
        <form
            className={`search-bar search-bar__${page}`}
            onSubmit={handleSubmit(onFormSubmit)}
        >
            
            <div className="search-bar__wrapper">
            
                <input
                    placeholder="&#xf002; Search something ..."
                    type="text"
                    {...register('query', { required: true })}
                />
                <p>Press return to search</p>
            
            </div>
        </form>
    );
}

export default SearchBar;
