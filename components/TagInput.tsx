import React, { useState, useEffect, useRef } from 'react';
import { Tag } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';

interface TagInputProps {
    userId: string;
    selectedTags: string[]; // Array of tag names
    onChange: (tags: string[]) => void;
}

export const TagInput: React.FC<TagInputProps> = ({ userId, selectedTags, onChange }) => {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<Tag[]>([]);
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadTags();
    }, [userId]);

    const loadTags = async () => {
        try {
            const tags = await supabaseAdapter.getTags(userId);
            setAllTags(tags);
        } catch (error) {
            console.error('Failed to load tags:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        if (value.trim()) {
            const filtered = allTags.filter(tag =>
                tag.name.toLowerCase().includes(value.toLowerCase()) &&
                !selectedTags.includes(tag.name)
            );
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            addTag(inputValue.trim());
        } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
            removeTag(selectedTags[selectedTags.length - 1]);
        }
    };

    const addTag = async (tagName: string) => {
        // Check if tag exists
        let tag = allTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());

        if (!tag) {
            // Create new tag
            try {
                tag = await supabaseAdapter.createTag({
                    userId,
                    name: tagName,
                    color: getRandomColor(),
                });
                setAllTags([...allTags, tag]);
            } catch (error) {
                console.error('Failed to create tag:', error);
                return;
            }
        }

        if (!selectedTags.includes(tag.name)) {
            onChange([...selectedTags, tag.name]);
        }
        setInputValue('');
        setShowSuggestions(false);
    };

    const removeTag = (tagName: string) => {
        onChange(selectedTags.filter(t => t !== tagName));
    };

    const getRandomColor = () => {
        const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    return (
        <div className="w-full">
            <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                {selectedTags.map(tagName => {
                    const tag = allTags.find(t => t.name === tagName);
                    const color = tag?.color || '#6b7280';

                    return (
                        <span
                            key={tagName}
                            className="flex items-center gap-1 px-2 py-1 text-sm text-white rounded-full"
                            style={{ backgroundColor: color }}
                        >
                            {tagName}
                            <button
                                onClick={() => removeTag(tagName)}
                                className="hover:text-gray-200 focus:outline-none"
                            >
                                ×
                            </button>
                        </span>
                    );
                })}

                <div className="relative flex-1 min-w-[120px]">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => inputValue && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder={selectedTags.length === 0 ? "Add tags..." : ""}
                        className="w-full outline-none bg-transparent text-sm py-1"
                    />

                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                            {suggestions.map(tag => (
                                <button
                                    key={tag.id}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                    onClick={() => addTag(tag.name)}
                                >
                                    <span
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: tag.color }}
                                    />
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
