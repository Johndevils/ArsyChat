import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am ArsyChat AI. How can I help you today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('moonshotai/Kimi-K2-Thinking:novita');
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [showUserModal, setShowUserModal] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  
  const fileInputRef = useRef(null);
  const profileImageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-vercel-app.vercel.app/api';
  const DEFAULT_USER_IMAGE = "https://arsynoxhash.dpdns.org/file/BQACAgUAAyEGAAS6vrhKAANZaS_jqaCAc93eN8vSw2FgRmD3A1cAAmQZAAKEhIFVH23W0BCfsec82BA.jpg";

  // Initialize user or load from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('arsychat_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setShowUserModal(false);
      setProfileImage(parsedUser.imageUrl || DEFAULT_USER_IMAGE);
    }
    fetchModels();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch user stats when user changes
  useEffect(() => {
    if (user && user.id) {
      fetchUserStats(user.id);
    }
  }, [user]);

  const fetchModels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/models`);
      const data = await response.json();
      setModels(data.models);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  const fetchUserStats = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}/stats`);
      const data = await response.json();
      if (data.success) {
        setUserStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogin = async () => {
    if (!username.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() })
      });

      const data = await response.json();
      if (data.success) {
        const userData = data.user;
        setUser(userData);
        setProfileImage(userData.imageUrl || DEFAULT_USER_IMAGE);
        setShowUserModal(false);
        localStorage.setItem('arsychat_user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Maximum size is 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;
      setProfileImage(base64Image);

      // Upload to server
      const formData = new FormData();
      formData.append('image', file);
      formData.append('userId', user.id);

      try {
        const response = await fetch(`${API_BASE_URL}/user/image`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          localStorage.setItem('arsychat_user', JSON.stringify(data.user));
        }
      } catch (error) {
        console.error('Profile image upload error:', error);
        alert('Failed to update profile image');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !uploadedImage) return;

    const userMessageContent = uploadedImage 
      ? `${inputMessage}\n\n[Image attached: ${uploadedImage.fileName}]`
      : inputMessage;

    const userMessage = { role: 'user', content: userMessageContent };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInputMessage('');
    setUploadedImage(null);
    setImagePreview(null);
    setIsLoading(true);

    try {
      // If there's an uploaded image, send it first
      let imageUrl = null;
      if (uploadedImage) {
        const formData = new FormData();
        const blob = new Blob([uploadedImage.file], { type: uploadedImage.file.type });
        formData.append('image', blob, uploadedImage.fileName);

        const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          body: formData
        });

        const uploadData = await uploadResponse.json();
        if (uploadData.success) {
          imageUrl = uploadData.imageUrl;
        }
      }

      // Send chat request with user info
      const chatResponse = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          model: selectedModel,
          userId: user?.id
        })
      });

      const data = await chatResponse.json();
      
      if (data.response) {
        setMessages(prev => [...prev, data.response]);
      } else {
        throw new Error(data.error || 'No response from server');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${error.message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Maximum size is 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setUploadedImage({
        file: file,
        fileName: file.name,
        size: file.size,
        type: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('arsychat_user');
    setUser(null);
    setShowUserModal(true);
    setUsername('');
    setProfileImage(DEFAULT_USER_IMAGE);
    setMessages([{ role: 'assistant', content: 'Hello! I am ArsyChat AI. How can I help you today?' }]);
  };

  return (
    <div className="app">
      {/* User Modal */}
      {showUserModal && (
        <div className="user-modal-overlay">
          <div className="user-modal">
            <h2>Welcome to ArsyChat</h2>
            <p>Enter your name to get started</p>
            <div className="profile-image-preview">
              <img 
                src={DEFAULT_USER_IMAGE} 
                alt="Default Profile" 
                className="profile-preview-image"
              />
              <div className="profile-image-note">
                Default profile image
              </div>
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="username-input"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button
              onClick={handleLogin}
              disabled={!username.trim()}
              className="login-button"
            >
              Start Chatting
            </button>
          </div>
        </div>
      )}

      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">ArsyChat</h1>
          {userStats && (
            <div className="user-stats">
              <span className="stat">Messages: {userStats.messageCount}</span>
              <span className="stat">Joined: {formatDate(userStats.joined)}</span>
            </div>
          )}
        </div>
        
        <div className="header-right">
          {user && (
            <div className="user-profile">
              <div className="profile-image-container">
                <img 
                  src={profileImage || DEFAULT_USER_IMAGE} 
                  alt={user.username} 
                  className="profile-image"
                  onClick={() => profileImageInputRef.current?.click()}
                  title="Click to change profile image"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  ref={profileImageInputRef}
                  className="profile-image-input"
                />
                <button 
                  className="change-image-btn"
                  onClick={() => profileImageInputRef.current?.click()}
                  title="Change profile image"
                >
                  📷
                </button>
              </div>
              <div className="user-info">
                <span className="username">{user.username}</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </div>
          )}
          
          <div className="model-selector">
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              className="model-dropdown"
            >
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="chat-container">
        <div className="messages-container">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.role}`}
            >
              <div className="message-avatar">
                {message.role === 'user' ? (
                  <img 
                    src={profileImage || DEFAULT_USER_IMAGE} 
                    alt="User" 
                    className="avatar-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.textContent = '👤';
                    }}
                  />
                ) : (
                  '🤖'
                )}
              </div>
              <div className="message-content">
                <div className="message-role">
                  {message.role === 'user' ? (user?.username || 'You') : 'ArsyChat'}
                </div>
                <div className="message-text">
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="message-role">ArsyChat</div>
                <div className="message-text typing">
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {user && (
          <div className="input-area">
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" className="preview-image" />
                <div className="image-info">
                  <span>{uploadedImage.fileName}</span>
                  <span>{formatBytes(uploadedImage.size)}</span>
                  <button 
                    onClick={removeImage}
                    className="remove-image-btn"
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <div className="input-controls">
              <div className="file-upload">
                <label htmlFor="file-upload" className="file-upload-label">
                  📎 Attach Image
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="file-input"
                />
              </div>

              <div className="text-input-wrapper">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  className="message-input"
                  rows="3"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && !uploadedImage) || isLoading}
                  className="send-button"
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="app-footer">
        <p>ArsyChat - Powered by Hugging Face AI Models</p>
        <p>Default user image from: https://arsynoxhash.dpdns.org</p>
      </footer>
    </div>
  );
}

export default App;
